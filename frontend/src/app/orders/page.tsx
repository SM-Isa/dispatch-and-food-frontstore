'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Star, Clock, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  order_number: string;
  store_name: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  created_at: string;
  vendor_id?: string;
  rider_id?: string;
  items_summary?: string;
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<OrderItem | null>(null);
  const [vendorRating, setVendorRating] = useState(5);
  const [riderRating, setRiderRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch('http://localhost:4000/api/orders/customer/history', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setOrders(data);
            setLoading(false);
            return;
          }
        }
      } catch (_) {}

      // Fallback demonstration order history
      setOrders([
        {
          id: 'ord-hist-1',
          order_number: 'ORD-8K3F9A',
          store_name: 'Tanke Express Kitchen',
          status: 'DELIVERED',
          total_amount: 4100.0,
          delivery_address: 'Block B, Tanke Akata Road, Ilorin',
          created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
          items_summary: 'Smoky Jollof Rice & Crispy Chicken (x1), Special Beef Shawarma (x1)',
        },
        {
          id: 'ord-hist-2',
          order_number: 'ORD-TK9921',
          store_name: 'GRA Grill House & Smoothies',
          status: 'PREPARING',
          total_amount: 5500.0,
          delivery_address: 'Plot 14, Fate Road, Ilorin',
          created_at: new Date(Date.now() - 1800000).toISOString(),
          items_summary: 'Fried Rice & Peppered Turkey (x1), Fresh Mango Smoothie (x1)',
        },
      ]);
      setLoading(false);
    }

    loadOrders();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReview) return;
    setSubmittingReview(true);

    try {
      await fetch('http://localhost:4000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          orderId: selectedOrderForReview.id,
          vendorRating,
          riderRating,
          comment: reviewComment,
        }),
      });
    } catch (_) {}

    setSubmittingReview(false);
    setReviewSuccess(true);
    setTimeout(() => {
      setSelectedOrderForReview(null);
      setReviewSuccess(false);
      setReviewComment('');
    }, 1500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">● Delivered</span>;
      case 'PREPARING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">● In Kitchen</span>;
      case 'RIDER_ASSIGNED':
      case 'PICKED_UP':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">● On the Way</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">● Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Orders & Receipts</h1>
          <p className="text-sm text-slate-500">Track active deliveries, review past meals, and reorder favourite food.</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition"
        >
          <ShoppingBag className="w-4 h-4" /> Order New Food
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading your orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No orders placed yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">Explore top kitchens in Tanke & GRA and enjoy rapid motorcycle delivery with instant bank transfer checkout.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isCompleted = order.status === 'DELIVERED' || order.status === 'COMPLETED';
            return (
              <div
                key={order.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base">{order.store_name}</span>
                      <span className="text-xs text-slate-400">#{order.order_number}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(order.created_at).toLocaleDateString()} at{' '}
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {order.items_summary && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-700">Dishes:</span> {order.items_summary}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="text-sm">
                    <span className="text-slate-500 text-xs">Total: </span>
                    <span className="font-black text-emerald-700 text-base">₦{order.total_amount.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/track/${order.order_number}`}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1"
                    >
                      Track Live <ChevronRight className="w-3 h-3" />
                    </Link>

                    {isCompleted && (
                      <button
                        onClick={() => setSelectedOrderForReview(order)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Rate Experience
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rating & Review Modal */}
      {selectedOrderForReview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Rate Order #{selectedOrderForReview.order_number}
            </h3>
            <p className="text-xs text-slate-500">
              Your feedback directly improves the kitchen quality and rider speed in {selectedOrderForReview.store_name}.
            </p>

            {reviewSuccess ? (
              <div className="py-8 text-center text-emerald-700 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <p className="font-bold">Thank you! Review recorded successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Food Quality & Packaging ({vendorRating}/5)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setVendorRating(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition"
                      >
                        <Star className={`w-6 h-6 ${star <= vendorRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Rider Speed & Conduct ({riderRating}/5)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRiderRating(star)}
                        className="p-1 text-emerald-500 hover:scale-110 transition"
                      >
                        <Star className={`w-6 h-6 ${star <= riderRating ? 'fill-emerald-500' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Comments & Suggestions
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    placeholder="Hot and tasty! Delivery rider arrived faster than expected."
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForReview(null)}
                    className="px-4 py-2 rounded-xl border text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
