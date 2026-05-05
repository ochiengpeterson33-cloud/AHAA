import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/useStore';
import { MapPin, MessageCircle, ShoppingCart, ShieldCheck, User } from 'lucide-react';

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const docRef = doc(db, 'listings', id!);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setListing({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Listing not found');
        }
      } catch (err) {
        setError('Listing not found');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const handleBuy = async () => {
    if (!user) return navigate('/auth');
    try {
      // Create order
      await addDoc(collection(db, 'orders'), {
        buyer_id: user.id,
        seller_id: listing.seller_id,
        listing_id: id,
        amount: listing.price,
        listing_title: listing.title,
        escrow_status: 'held',
        created_at: new Date().toISOString(),
      });

      // Mark listing as sold
      await updateDoc(doc(db, 'listings', id!), {
        status: 'sold'
      });

      navigate('/orders');
    } catch (err: any) {
      alert(err.message || 'Purchase failed');
    }
  };

  const handleChat = () => {
    if (!user) return navigate('/auth');
    navigate(`/chat/${listing.seller_id}?listingId=${id}`);
  };

  if (loading) return <div>Loading...</div>;
  if (!listing) return <div className="p-8 text-center">{error}</div>;

  const images = JSON.parse(listing.images);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSearch={() => {}} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Images Section */}
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white shadow-sm">
              <img 
                src={images[0] || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop'} 
                alt={listing.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-white p-8 rounded-2xl shadow-sm space-y-6 border border-slate-100">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{listing.title}</h1>
              <div className="flex items-center gap-2 text-slate-500 mt-2 font-medium">
                <MapPin className="h-4 w-4" />
                <span>{listing.location}</span>
                <span className="mx-2">•</span>
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">{listing.category}</span>
              </div>
            </div>

            <div className="py-6 border-y border-slate-100">
              <p className="text-4xl font-black text-emerald-600">KSh {listing.price.toLocaleString()}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button 
                onClick={handleBuy}
                className="w-full bg-amber-500 text-white py-4 rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-tight"
              >
                <ShoppingCart className="h-5 w-5" />
                BUY NOW (ESCROW PROTECTED)
              </button>
              <button 
                onClick={handleChat}
                className="w-full border-2 border-emerald-600 text-emerald-600 py-4 rounded-xl font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 uppercase tracking-tight"
              >
                <MessageCircle className="h-5 w-5" />
                CHAT WITH SELLER
              </button>
            </div>

            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <ShieldCheck className="h-10 w-10 text-emerald-600" />
              <div>
                <p className="font-bold text-emerald-900 text-sm">Escrow Protection Active</p>
                <p className="text-emerald-700 text-xs mt-0.5 leading-relaxed">Your money is held by us and only released when you confirm delivery. Zero fraud, guaranteed.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
