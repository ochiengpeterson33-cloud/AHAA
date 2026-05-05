import React from 'react';
import { MapPin, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  images: string; // JSON string
  category: string;
  [key: string]: any;
}

export default function ListingCard({ listing, onClick }: { listing: Listing, onClick: () => void | Promise<void>, key?: any }) {
  const images = JSON.parse(listing.images);
  const imageUrl = images[0] || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop';

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute top-2 left-2 bg-emerald-600/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider">
          {listing.category}
        </div>
      </div>
      <div className="p-4">
        <p className="text-[10px] text-slate-500 mb-1 uppercase font-bold tracking-widest">{listing.category}</p>
        <h3 className="font-bold text-slate-900 border-b border-transparent hover:text-emerald-600 transition-colors line-clamp-1 text-sm">
          {listing.title}
        </h3>
        <p className="text-xl font-black text-emerald-600 mt-1">
          KSh {listing.price.toLocaleString()}
        </p>
        <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{listing.location}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 font-bold">
            <ShieldCheck className="h-3 w-3" />
            <span>VERIFIED</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
