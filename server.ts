import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('marketplace.db');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'buyer',
    wallet_balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    seller_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    images TEXT, -- JSON array of URLs
    status TEXT DEFAULT 'active', -- active, sold, suspended
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(seller_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    buyer_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    listing_id TEXT NOT NULL,
    amount REAL NOT NULL,
    escrow_status TEXT DEFAULT 'pending', -- pending, held, released, disputed, refunded
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(buyer_id) REFERENCES users(id),
    FOREIGN KEY(seller_id) REFERENCES users(id),
    FOREIGN KEY(listing_id) REFERENCES listings(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    listing_id TEXT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    reviewer_id TEXT NOT NULL,
    reviewee_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const id = Math.random().toString(36).substring(7);

  try {
    const stmt = db.prepare('INSERT INTO users (id, name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, name, email, hashedPassword, phone, role || 'buyer');
    const token = jwt.sign({ id, email, role: role || 'buyer' }, JWT_SECRET);
    res.json({ token, user: { id, name, email, role: role || 'buyer' } });
  } catch (error: any) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// --- LISTING ROUTES ---
app.get('/api/listings', (req, res) => {
  const { category, location, q } = req.query;
  let query = 'SELECT * FROM listings WHERE status = "active"';
  const params: any[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (location) {
    query += ' AND location = ?';
    params.push(location);
  }
  if (q) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }

  query += ' ORDER BY created_at DESC';
  const listings = db.prepare(query).all(...params);
  res.json(listings);
});

app.post('/api/listings', authenticateToken, (req: any, res) => {
  const { title, description, price, category, location, images } = req.body;
  const id = Math.random().toString(36).substring(7);
  const stmt = db.prepare('INSERT INTO listings (id, seller_id, title, description, price, category, location, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  stmt.run(id, req.user.id, title, description, price, category, location, JSON.stringify(images || []));
  res.json({ id, title });
});

app.get('/api/listings/:id', (req, res) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Not found' });
  res.json(listing);
});

// --- ESCROW & ORDER ROUTES ---
app.post('/api/orders/create', authenticateToken, (req: any, res) => {
  const { listingId } = req.body;
  const listing: any = db.prepare('SELECT * FROM listings WHERE id = ?').get(listingId);

  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.seller_id === req.user.id) return res.status(400).json({ error: 'Cannot buy your own listing' });

  const orderId = Math.random().toString(36).substring(7);
  const stmt = db.prepare('INSERT INTO orders (id, buyer_id, seller_id, listing_id, amount, escrow_status) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(orderId, req.user.id, listing.seller_id, listing.id, listing.price, 'held');

  // Mark listing as sold/pending
  db.prepare('UPDATE listings SET status = "sold" WHERE id = ?').run(listingId);

  res.json({ orderId, status: 'held', message: 'Funds held in escrow' });
});

app.post('/api/orders/:id/confirm', authenticateToken, (req: any, res) => {
  const order: any = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order || order.buyer_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

  if (order.escrow_status !== 'held') return res.status(400).json({ error: 'Invalid order state' });

  // Release funds to seller
  db.prepare('UPDATE orders SET escrow_status = "released" WHERE id = ?').run(order.id);
  db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(order.amount, order.seller_id);

  res.json({ success: true, message: 'Funds released to seller' });
});

app.get('/api/orders/my-orders', authenticateToken, (req: any, res) => {
  const orders = db.prepare('SELECT o.*, l.title as listing_title FROM orders o JOIN listings l ON o.listing_id = l.id WHERE o.buyer_id = ? OR o.seller_id = ?').all(req.user.id, req.user.id);
  res.json(orders);
});

// --- CHAT ROUTES ---
app.get('/api/chat/:userId', authenticateToken, (req: any, res) => {
  const messages = db.prepare(`
    SELECT * FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?) 
    OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `).all(req.user.id, req.params.userId, req.params.userId, req.user.id);
  res.json(messages);
});

// --- SOCKET.IO ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('send_message', (data) => {
    const { sender_id, receiver_id, content, listing_id } = data;
    const stmt = db.prepare('INSERT INTO messages (sender_id, receiver_id, content, listing_id) VALUES (?, ?, ?, ?)');
    stmt.run(sender_id, receiver_id, content, listing_id);

    io.to(receiver_id).emit('receive_message', {
      sender_id,
      content,
      created_at: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// --- VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
