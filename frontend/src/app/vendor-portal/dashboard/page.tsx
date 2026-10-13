'use client';

import { useState } from 'react';
import { Volume2, Bell, CheckCircle, Clock, ShoppingBag } from 'lucide-react';
import MenuDigitizer from '../components/MenuDigitizer';

export default function VendorDashboardPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [orders, setOrders] = useState([
    {
      id: 'ORD-2K3F9A',
      items: '2x Smoky Jollof Rice & Crispy Chicken',
      amount: '₦5,000',
      status: 'PREPARING',
      timeAgo: '4 mins ago',
    },
    {
      id: 'ORD-8K3F9A',
      items: '1x Special Beef Shawarma (Double Sausage)',
      amount: '₦1,800',
      status: 'RIDER_ASSIGNED',
      timeAgo: '12 mins ago',
    },
  ]);

  const playNotificationChime = () => {
    setSoundPlaying(true);
    try {
      // Synthesize realistic dual-frequency cash register chime using Web Audio API
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Play high chime sequence: 880Hz -> 1320Hz -> 1760Hz
      playTone(880, 0, 0.25);
      playTone(1320, 0.12, 0.35);
      playTone(1760, 0.24, 0.6);
    } catch (_) {}

    setTimeout(() => setSoundPlaying(false), 1000);
  };

  const markReady = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: 'READY_FOR_PICKUP' } : o,
      ),
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Banner & Status Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Vendor Portal • Ilorin Cluster
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700">
              TANKE CORRIDOR
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Mama's Kitchen (Tanke Central)
          </h1>
          <p className="text-xs text-slate-500">
            Store ID: <span className="font-mono">vnd_tanke_001</span> • Monnify Account Verified
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Test Sound Button */}
          <button
            onClick={playNotificationChime}
            type="button"
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              soundPlaying
                ? 'bg-amber-100 border-amber-300 text-amber-900 scale-95'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Test the physical kitchen order audio bell"
          >
            <Volume2 className="w-4 h-4 text-emerald-600" />
            {soundPlaying ? 'Chime Ringing...' : 'Test Kitchen Bell'}
          </button>

          {/* Store Open/Close Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
              isOpen
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            {isOpen ? '● Open (Accepting Orders)' : '○ Closed (Offline)'}
          </button>
        </div>
      </div>

      {/* Live Order Queue */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Live Incoming Orders</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full">
            {orders.length} Active in Kitchen
          </span>
        </div>

        <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-sm overflow-hidden">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">
                    {order.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {order.timeAgo}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600">{order.items}</p>
                <p className="text-xs font-extrabold text-emerald-700 font-mono">
                  {order.amount}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span
                  className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    order.status === 'PREPARING'
                      ? 'bg-amber-100 text-amber-800'
                      : order.status === 'READY_FOR_PICKUP'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {order.status}
                </span>

                {order.status === 'PREPARING' && (
                  <button
                    onClick={() => markReady(order.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                  >
                    Mark Ready for Rider
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multimodal Gemini Vision Menu Digitizer */}
      <MenuDigitizer />
    </div>
  );
}
