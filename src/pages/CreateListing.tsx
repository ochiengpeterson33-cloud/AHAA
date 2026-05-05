import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Camera, AlertTriangle, ShieldCheck } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useAuthStore } from '../store/useStore';

export default function CreateListing() {
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    price: '', 
    category: 'Electronics', 
    location: 'Nairobi',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleAiCheck = async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
      const prompt = `Analyze this marketplace listing for potential fraud or scam signals. 
      Title: ${formData.title}
      Description: ${formData.description}
      Price: ${formData.price}
      Category: ${formData.category}
      
      Respond with a short safety verdict and advice.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      setAiAnalysis(response.text || "AI verification failed");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate('/auth');
    setLoading(true);
    try {
      await addDoc(collection(db, 'listings'), {
        ...formData,
        seller_id: user.id,
        price: parseFloat(formData.price),
        images: formData.imageUrl ? [formData.imageUrl] : [],
        status: 'active',
        created_at: new Date().toISOString()
      });
      navigate('/');
    } catch (err) {
      alert('Failed to post listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSearch={() => {}} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Post Your Ad</h1>
        
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm space-y-6 border border-slate-100">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">Ad Title</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-300"
              placeholder="e.g. iPhone 13 Pro Max - 256GB"
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">Price (KSh)</label>
              <input
                type="number"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-300"
                placeholder="0"
                onChange={e => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">Category</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option>Electronics</option>
                <option>Vehicles</option>
                <option>Property</option>
                <option>Home & Living</option>
                <option>Fashion</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">Location</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              onChange={e => setFormData({ ...formData, location: e.target.value })}
            >
              <option>Nairobi</option>
              <option>Mombasa</option>
              <option>Kisumu</option>
              <option>Nakuru</option>
              <option>Eldoret</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">Image URL</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-300"
              placeholder="Paste an image URL"
              onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">Description</label>
            <textarea
              rows={5}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-300"
              placeholder="Tell buyers about your item..."
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-4">
            <button 
              type="button"
              onClick={handleAiCheck}
              className="text-emerald-700 bg-emerald-50 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all border border-emerald-200"
            >
              <ShieldCheck className="h-4 w-4" />
              RUN AI FRAUD CHECK
            </button>
            
            {aiAnalysis && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">AI Safety Verdict</p>
                  <p className="text-sm text-amber-700 mt-1 leading-relaxed">{aiAnalysis}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-lg hover:bg-emerald-700 transition-all shadow-xl disabled:opacity-50 uppercase tracking-tight"
            >
              {loading ? 'POSTING...' : 'PUBLISH AD'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
