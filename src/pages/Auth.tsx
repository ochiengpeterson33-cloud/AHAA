import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: 'buyer',
          wallet_balance: 0,
          created_at: new Date().toISOString(),
        });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Sign in to Jiji' : 'Create an account'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</div>}
          <div className="rounded-md shadow-sm space-y-4">
            {!isLogin && (
              <input
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                placeholder="Full Name"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            )}
            <input
              type="email"
              required
              className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
              placeholder="Email address"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {!isLogin && (
              <input
                type="text"
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                placeholder="Phone Number (M-Pesa enabled)"
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            )}
            <input
              type="password"
              required
              className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
              placeholder="Password"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all uppercase tracking-tight"
            >
              {isLogin ? 'Sign In' : 'Register'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <button
            className="text-sm text-emerald-600 font-bold hover:underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
