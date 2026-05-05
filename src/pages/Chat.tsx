import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/useStore';
import { Send, User } from 'lucide-react';

export default function Chat() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get('listingId');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !userId) return;

    // Chat ID is usually a combination of both IDs sorted to be unique
    const chatId = [user.id, userId].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('created_at', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [userId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !userId) return;

    const chatId = [user.id, userId].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    await addDoc(messagesRef, {
      sender_id: user.id,
      receiver_id: userId,
      content: input,
      listing_id: listingId,
      created_at: new Date().toISOString()
    });

    setInput('');
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Navbar onSearch={() => {}} />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col overflow-hidden">
        <div className="bg-white rounded-t-2xl border border-gray-200 p-4 border-b-2 flex items-center gap-3">
          <div className="bg-gray-100 p-2 rounded-full">
            <User className="h-6 w-6 text-gray-500" />
          </div>
          <h2 className="font-bold text-gray-900">Chatting with Seller</h2>
        </div>
        
        <div className="flex-1 bg-white border-x border-slate-200 overflow-y-auto p-4 space-y-4 shadow-inner">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                msg.sender_id === user?.id 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-slate-100 text-slate-900 rounded-tl-none'
              }`}>
                {msg.content}
                <p className={`text-[10px] mt-1 opacity-70 ${msg.sender_id === user?.id ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="bg-white border border-slate-200 p-4 rounded-b-2xl border-t-2 flex gap-3">
          <input
            type="text"
            className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button 
            type="submit"
            className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-all shadow-md"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </main>
    </div>
  );
}
