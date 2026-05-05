/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import Chat from './pages/Chat';
import Orders from './pages/Orders';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from './store/useStore';

export default function App() {
  const { setAuth, setLoading, loading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (userDoc.exists()) {
          setAuth({ id: fbUser.uid, ...userDoc.data() } as any);
        } else {
          // If profile doc doesn't exist yet (e.g. just registered), we'll handle it in Auth page
          setAuth(null);
        }
      } else {
        setAuth(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setAuth, setLoading]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-emerald-600 animate-pulse text-2xl">AHAA...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/sell" element={<CreateListing />} />
        <Route path="/chat/:userId" element={<Chat />} />
        <Route path="/orders" element={<Orders />} />
      </Routes>
    </Router>
  );
}

