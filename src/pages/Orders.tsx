import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, increment, or } from 'firebase/firestore';
import { useAuthStore } from '../store/useStore';
import { Package, CheckCircle, Clock, AlertCircle, Shield } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef, 
      or(
        where('buyer_id', '==', user.id),
        where('seller_id', '==', user.id)
      )
    ); 

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const confirmReceipt = async (order: any) => {
    if (!window.confirm('Are you sure you have received the item? This will release the funds to the seller.')) return;
    try {
      // 1. Release funds in order
      await updateDoc(doc(db, 'orders', order.id), {
        escrow_status: 'released'
      });

      // 2. Increment seller balance
      await updateDoc(doc(db, 'users', order.seller_id), {
        wallet_balance: increment(order.amount)
      });
    } catch (err) {
      alert('Failed to confirm receipt');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSearch={() => {}} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Escrow Wallet & Orders</h1>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
            <Shield className="h-4 w-4 text-green-600" />
            <p className="text-sm font-bold text-green-800">Your funds are safe</p>
          </div>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-200 h-32 rounded-2xl" />)}
            </div>
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 flex gap-4">
                    <div className="bg-emerald-50 p-4 rounded-xl h-fit border border-emerald-100 font-bold text-emerald-700 text-xl italic flex items-center justify-center w-16 h-16 shrink-0">
                      {order.listing_title.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-900">{order.listing_title}</h3>
                          <p className="text-xs text-slate-500 font-medium">Seller ID: @{order.seller_id.substring(0, 8)} • ID: #{order.id}</p>
                        </div>
                        <StatusBadge status={order.escrow_status} />
                      </div>
                      
                      <div className="mt-4">
                         <div className="flex gap-2">
                           <div className={`h-1.5 flex-1 rounded-full ${order.escrow_status === 'held' || order.escrow_status === 'released' ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
                           <div className={`h-1.5 flex-1 rounded-full ${order.escrow_status === 'held' || order.escrow_status === 'released' ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
                           <div className={`h-1.5 flex-1 rounded-full ${order.escrow_status === 'held' ? 'bg-amber-400' : order.escrow_status === 'released' ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
                           <div className={`h-1.5 flex-1 rounded-full ${order.escrow_status === 'released' ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
                         </div>
                         <div className="flex justify-between text-[9px] text-slate-400 mt-2 uppercase font-bold tracking-wider">
                           <span>Paid</span>
                           <span>Held</span>
                           <span className={order.escrow_status === 'held' ? 'text-amber-600' : ''}>In Transit</span>
                           <span>Released</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 justify-center min-w-[150px]">
                    <p className="text-2xl font-black text-slate-900">KSh {order.amount.toLocaleString()}</p>
                    {order.buyer_id === user?.id && order.escrow_status === 'held' && (
                      <button 
                        onClick={() => confirmReceipt(order)}
                        className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-md text-xs uppercase tracking-tight"
                      >
                        CONFIRM RECEIPT
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  <span>Ordered on {new Date(order.created_at).toLocaleDateString()}</span>
                  <span>{order.buyer_id === user?.id ? 'AS BUYER' : 'AS SELLER'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500 font-medium">No transactions yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    held: { label: 'Funds Held', icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    released: { label: 'Released', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-100' },
    pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
    disputed: { label: 'Disputed', icon: AlertCircle, color: 'text-red-600 bg-red-50 border-red-100' },
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${config.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label.toUpperCase()}
    </div>
  );
}
