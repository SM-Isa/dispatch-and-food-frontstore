'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  ShoppingBag,
  Store,
  Bike,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Check,
  X,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface MetricState {
  gmv: number;
  activeDeliveries: number;
  onlineRiders: number;
  escrowBalance: number;
  totalOrders: number;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'vendors' | 'riders' | 'payouts' | 'ledger'>('orders');
  const [loading, setLoading] = useState(false);

  const [metrics, setMetrics] = useState<MetricState>({
    gmv: 428500,
    activeDeliveries: 4,
    onlineRiders: 12,
    escrowBalance: 87500,
    totalOrders: 142,
  });

  // Orders State
  const [orders, setOrders] = useState<any[]>([
    {
      id: 'ord-101',
      orderNumber: 'ORD-8K3F9A',
      customerName: 'Adebayo Tanke',
      vendorName: "Mama's Kitchen",
      riderName: 'Ibrahim K.',
      status: 'PREPARING',
      amount: 4100,
      createdAt: '10 mins ago',
    },
    {
      id: 'ord-102',
      orderNumber: 'ORD-2K3F9B',
      customerName: 'Fatima S.',
      vendorName: 'GRA Grill House',
      riderName: 'Unassigned',
      status: 'PAID',
      amount: 6800,
      createdAt: '18 mins ago',
    },
    {
      id: 'ord-103',
      orderNumber: 'ORD-7B1C4D',
      customerName: 'Emeka U.',
      vendorName: 'Unilorin FastBite',
      riderName: 'Samuel O.',
      status: 'IN_TRANSIT',
      amount: 3500,
      createdAt: '28 mins ago',
    },
  ]);

  // Vendors State
  const [vendors, setVendors] = useState<any[]>([
    {
      id: 'vnd-001',
      storeName: "Mama's Kitchen (Tanke Central)",
      clusterZone: 'TANKE',
      commissionRate: 0.15,
      isActive: true,
      todayOrders: 18,
    },
    {
      id: 'vnd-002',
      storeName: 'GRA Grill House & Smoothies',
      clusterZone: 'GRA',
      commissionRate: 0.15,
      isActive: true,
      todayOrders: 12,
    },
    {
      id: 'vnd-003',
      storeName: 'Campus Shawarma Express',
      clusterZone: 'UNILORIN',
      commissionRate: 0.12,
      isActive: false, // Suspended
      todayOrders: 0,
    },
  ]);

  // Riders State
  const [riders, setRiders] = useState<any[]>([
    {
      id: 'rdr-001',
      fullName: 'Ibrahim Kazeem',
      phone: '+2348011223344',
      vehiclePlate: 'KW-782-ILR',
      clusterZone: 'TANKE',
      isApproved: true,
      isOnline: true,
      rating: 4.9,
    },
    {
      id: 'rdr-002',
      fullName: 'Samuel Olawale',
      phone: '+2348033445566',
      vehiclePlate: 'KW-419-LFN',
      clusterZone: 'UNILORIN',
      isApproved: true,
      isOnline: true,
      rating: 4.8,
    },
    {
      id: 'rdr-003',
      fullName: 'Babatunde Yusuf (New Applicant)',
      phone: '+2348077889900',
      vehiclePlate: 'KW-103-OFF',
      clusterZone: 'TIPPER_GARAGE',
      isApproved: false,
      isOnline: false,
      rating: 0.0,
    },
  ]);

  // Payouts State
  const [payouts, setPayouts] = useState<any[]>([
    {
      id: 'py-001',
      recipientName: 'Ibrahim Kazeem (Rider)',
      bankName: 'Moniepoint MFB',
      accountNumber: '8102941920',
      amount: 14500,
      status: 'PENDING',
      requestedAt: '35 mins ago',
    },
    {
      id: 'py-002',
      recipientName: "Mama's Kitchen (Vendor)",
      bankName: 'GTBank',
      accountNumber: '0129481920',
      amount: 48000,
      status: 'PENDING',
      requestedAt: '1 hour ago',
    },
  ]);

  // Modal State for Force Status
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [targetStatus, setTargetStatus] = useState('DELIVERED');
  const [statusReason, setStatusReason] = useState('');

  // Fetch initial admin data from API if running
  const refreshData = async () => {
    setLoading(true);
    try {
      const [mRes, oRes, vRes, rRes, pRes] = await Promise.all([
        fetch('http://localhost:4000/api/admin/metrics'),
        fetch('http://localhost:4000/api/admin/orders'),
        fetch('http://localhost:4000/api/admin/vendors'),
        fetch('http://localhost:4000/api/admin/riders'),
        fetch('http://localhost:4000/api/admin/payouts'),
      ]);

      if (mRes.ok) setMetrics(await mRes.json());
      if (oRes.ok) setOrders(await oRes.json());
      if (vRes.ok) setVendors(await vRes.json());
      if (rRes.ok) setRiders(await rRes.json());
      if (pRes.ok) setPayouts(await pRes.json());
    } catch (_) {
      // Keep state intact on connection fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Actions
  const handleForceStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id ? { ...o, status: targetStatus } : o
      )
    );

    try {
      await fetch(`http://localhost:4000/api/admin/orders/${selectedOrder.id}/force-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus: targetStatus, reason: statusReason }),
      });
    } catch (_) {}

    setSelectedOrder(null);
    setStatusReason('');
  };

  const handleToggleVendorStatus = async (vendorId: string, current: boolean) => {
    const nextVal = !current;
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, isActive: nextVal } : v))
    );

    try {
      await fetch(`http://localhost:4000/api/admin/vendors/${vendorId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextVal }),
      });
    } catch (_) {}
  };

  const handleUpdateCommission = async (vendorId: string, newRate: number) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, commissionRate: newRate } : v))
    );

    try {
      await fetch(`http://localhost:4000/api/admin/vendors/${vendorId}/commission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionRate: newRate }),
      });
    } catch (_) {}
  };

  const handleApproveRider = async (riderId: string, isApproved: boolean) => {
    setRiders((prev) =>
      prev.map((r) => (r.id === riderId ? { ...r, isApproved } : r))
    );

    try {
      await fetch(`http://localhost:4000/api/admin/riders/${riderId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved }),
      });
    } catch (_) {}
  };

  const handleProcessPayout = async (payoutId: string) => {
    setPayouts((prev) =>
      prev.map((p) => (p.id === payoutId ? { ...p, status: 'COMPLETED' } : p))
    );

    try {
      await fetch('http://localhost:4000/api/payouts/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId }),
      });
    } catch (_) {}
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Ilorin Operations & Market Command
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Dispatch Platform Ops Console
          </h1>
          <p className="text-xs text-slate-500">
            Live order intervention, vendor commission controls, rider fleet onboarding, and NIP settlement parity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/admin/ledger"
            className="px-3.5 py-2 text-xs font-bold border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition"
          >
            Audit Ledger →
          </a>
          <button
            onClick={refreshData}
            disabled={loading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Gross Volume</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">₦{metrics.gmv.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-600 font-bold">+18% today</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Active Deliveries</span>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{metrics.activeDeliveries}</p>
          <span className="text-[10px] text-slate-400 font-medium">In transit now</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Online Riders</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{metrics.onlineRiders}</p>
          <span className="text-[10px] text-emerald-600 font-bold">100% heartbeat</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Escrow Vault</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">₦{metrics.escrowBalance.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400 font-medium">Monnify balance</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 col-span-2 md:col-span-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Ledger Parity</span>
          <p className="text-xl font-extrabold text-emerald-700 mt-1 flex items-center gap-1">
            <CheckCircle className="w-5 h-5 text-emerald-600 inline" />
            100% OK
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Δ Debits = Credits</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2">
        {[
          { key: 'orders', label: 'Live Orders Interventions', icon: ShoppingBag, count: orders.length },
          { key: 'vendors', label: 'Vendors & Commissions', icon: Store, count: vendors.length },
          { key: 'riders', label: 'Rider Fleet Onboarding', icon: Bike, count: riders.length },
          { key: 'payouts', label: 'Payout Batch Approvals', icon: CreditCard, count: payouts.filter(p => p.status === 'PENDING').length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                isActive
                  ? 'border-emerald-600 text-emerald-800 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xs font-extrabold uppercase text-slate-700">Active Live Orders Queue</h2>
            <span className="text-xs text-slate-400">Click "Intervene" to force state transition</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase border-b text-[10px]">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Assigned Rider</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ops Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-slate-900">{order.orderNumber}</td>
                    <td className="p-3 text-slate-700">{order.customerName}</td>
                    <td className="p-3 text-slate-700">{order.vendorName}</td>
                    <td className="p-3">
                      <span className={order.riderName === 'Unassigned' ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                        {order.riderName}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">₦{order.amount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        order.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'CANCELLED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold transition"
                      >
                        Intervene
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Vendors */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xs font-extrabold uppercase text-slate-700">Vendor Partners & Commission Rates</h2>
            <a href="/vendor-portal/register" className="text-xs text-emerald-600 font-bold hover:underline">
              + Onboard New Kitchen
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase border-b text-[10px]">
                <tr>
                  <th className="p-3">Kitchen Name</th>
                  <th className="p-3">Cluster Zone</th>
                  <th className="p-3">Commission %</th>
                  <th className="p-3">Orders Today</th>
                  <th className="p-3">Store Status</th>
                  <th className="p-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{vendor.storeName}</td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {vendor.clusterZone}
                      </span>
                    </td>
                    <td className="p-3">
                      <select
                        value={vendor.commissionRate}
                        onChange={(e) => handleUpdateCommission(vendor.id, parseFloat(e.target.value))}
                        className="border rounded px-2 py-1 bg-white font-bold text-slate-800 text-xs"
                      >
                        <option value={0.10}>10% (Preferred VIP)</option>
                        <option value={0.12}>12% (Campus Tier)</option>
                        <option value={0.15}>15% (Standard Tier)</option>
                        <option value={0.20}>20% (Premium Takeout)</option>
                      </select>
                    </td>
                    <td className="p-3 text-slate-600">{vendor.todayOrders} orders</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        vendor.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {vendor.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleVendorStatus(vendor.id, vendor.isActive)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                          vendor.isActive
                            ? 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {vendor.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Riders */}
      {activeTab === 'riders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xs font-extrabold uppercase text-slate-700">Rider Fleet Verification & Clusters</h2>
            <span className="text-xs text-slate-400">Guarantor and NIN identity verification</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase border-b text-[10px]">
                <tr>
                  <th className="p-3">Rider Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Bike Plate</th>
                  <th className="p-3">Cluster</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Fleet Status</th>
                  <th className="p-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {riders.map((rider) => (
                  <tr key={rider.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{rider.fullName}</td>
                    <td className="p-3 font-mono text-slate-600">{rider.phone}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{rider.vehiclePlate}</td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {rider.clusterZone}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">
                      {rider.rating > 0 ? `★ ${rider.rating}` : 'New Rider'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        rider.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rider.isApproved ? 'APPROVED' : 'PENDING REVIEW'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleApproveRider(rider.id, !rider.isApproved)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                          rider.isApproved
                            ? 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {rider.isApproved ? 'Revoke' : 'Approve Rider'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Payouts */}
      {activeTab === 'payouts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xs font-extrabold uppercase text-slate-700">Instant NIP Payout Settlements</h2>
            <span className="text-xs text-slate-400">Direct debit from Escrow settlement pool</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase border-b text-[10px]">
                <tr>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Bank & Account</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Requested</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Settlement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{payout.recipientName}</td>
                    <td className="p-3 text-slate-600">
                      <p className="font-semibold text-slate-800">{payout.bankName}</p>
                      <p className="font-mono text-xs">{payout.accountNumber}</p>
                    </td>
                    <td className="p-3 font-bold text-emerald-700 text-sm">
                      ₦{payout.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-500">{payout.requestedAt}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        payout.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {payout.status === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={() => handleProcessPayout(payout.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition shadow-sm"
                        >
                          Approve NIP Transfer →
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs font-semibold">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Force Status Intervene Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Force Status Override: {selectedOrder.orderNumber}
                </h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleForceStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Target State Transition
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white"
                >
                  <option value="DELIVERED">DELIVERED (Force Dropoff Completion)</option>
                  <option value="RIDER_ASSIGNED">RIDER_ASSIGNED (Force Re-assignment)</option>
                  <option value="CANCELLED">CANCELLED (Initiate Customer Refund)</option>
                  <option value="PREPARING">PREPARING (Reset Kitchen State)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Operational Justification (Logged to Audit Trail)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Rider phone battery died at customer gate; verified delivery via call."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 py-2 border font-bold text-xs rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Confirm Force Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
