import React from 'react';
import { ShoppingBag, MessageSquare, User, Search, PlusCircle } from 'lucide-react';
import { useAuthStore } from '../store/useStore';

import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export default function Navbar({ onSearch }: { onSearch: (q: string) => void }) {
  const { user } = useAuthStore();
  
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  return (
    <nav className="sticky top-0 z-50 bg-emerald-600 py-4 shadow-md shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-black text-white tracking-tighter cursor-pointer" onClick={() => window.location.href = '/'}>
              SAFIRI<span className="text-emerald-200">MARKET</span>
            </h1>
            <div className="hidden md:flex relative w-96">
              <input
                type="text"
                placeholder="Search electronics, cars, jobs..."
                className="w-full pl-10 pr-4 py-2 bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all text-sm"
                onChange={(e) => onSearch(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button className="flex items-center gap-1 text-white hover:text-emerald-200 transition-colors" onClick={() => window.location.hash = 'chat'}>
                  <MessageSquare className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm font-medium">Messages</span>
                </button>
                <button className="flex items-center gap-1 text-white hover:text-emerald-200 transition-colors" onClick={() => window.location.hash = 'orders'}>
                  <ShoppingBag className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm font-medium">Orders</span>
                </button>
                <div className="flex items-center gap-2 pl-4 border-l border-emerald-500">
                  <User className="h-5 w-5 text-emerald-200" />
                  <div className="hidden lg:block text-xs text-white">
                    <p className="font-bold">{user.name}</p>
                    <button onClick={handleLogout} className="text-emerald-200 hover:underline">Logout</button>
                  </div>
                </div>
                <button 
                  className="bg-amber-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-amber-600 transition-all flex items-center gap-2 text-sm"
                  onClick={() => window.location.hash = 'sell'}
                >
                  <PlusCircle className="h-4 w-4" />
                  SELL
                </button>
              </>
            ) : (
              <button 
                className="bg-amber-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-amber-600 transition-all text-sm"
                onClick={() => window.location.hash = 'auth'}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
