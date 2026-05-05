import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ListingCard from '../components/ListingCard';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['All', 'Electronics', 'Vehicles', 'Property', 'Home & Living', 'Fashion', 'Jobs'];

export default function Home() {
  const [listings, setListings] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const listingsRef = collection(db, 'listings');
        let q = query(listingsRef, where('status', '==', 'active'), orderBy('created_at', 'desc'));
        
        if (category !== 'All') {
          q = query(listingsRef, where('status', '==', 'active'), where('category', '==', category), orderBy('created_at', 'desc'));
        }

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Search filter client-side for simplicity (Firestore text search is tricky)
        const filteredData = search 
          ? data.filter((item: any) => item.title.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase()))
          : data;

        setListings(filteredData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchListings, 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSearch={setSearch} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner */}
        <div className="bg-emerald-600 rounded-2xl p-10 mb-8 text-white flex flex-col md:flex-row items-center justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20"></div>
          <div className="max-w-md text-center md:text-left z-10">
            <h2 className="text-4xl font-black mb-3 tracking-tighter uppercase">Safest Market in Nairobi</h2>
            <p className="opacity-80 font-medium text-lg leading-relaxed">Secure escrow funds held safely until you confirm receipt. Zero fraud, guaranteed.</p>
          </div>
          <button 
            className="mt-6 md:mt-0 bg-amber-500 text-white px-10 py-4 rounded-full font-black hover:bg-amber-600 transition-all shadow-xl z-10 text-lg uppercase tracking-tight"
            onClick={() => navigate('/sell')}
          >
            SELL YOUR STUFF
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${
                category === cat 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl aspect-[4/5]" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.map((listing: any) => (
              <ListingCard 
                key={listing.id} 
                listing={listing} 
                onClick={() => navigate(`/listing/${listing.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">No listings found. Be the first to post something!</p>
          </div>
        )}
      </main>
    </div>
  );
}
