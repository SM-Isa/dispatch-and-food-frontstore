'use client';

import { useState } from 'react';

export default function CheckoutPage() {
  const [phone, setPhone] = useState('+2348012345678');
  const [address, setAddress] = useState('Block B, Tanke Akata Road, Ilorin');
  const [loading, setLoading] = useState(false);
  const [virtualAccount, setVirtualAccount] = useState<{
    bankName: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    paymentReference: string;
  } | null>(null);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate calling POST /api/orders and POST /api/payments/initiate
    setTimeout(() => {
      setVirtualAccount({
        bankName: 'Wema Bank / Monnify',
        accountNumber: '7849102941',
        accountName: 'Dispatch/ORD-8K3F9A',
        amount: 4100.0,
        paymentReference: 'PAY-ORD-8K3F9A-481920',
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">Checkout & Instant Transfer</h1>

      {!virtualAccount ? (
        <form onSubmit={handlePlaceOrder} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Your Phone Number (For SMS & Tracking)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Delivery Address & Landmark
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>

          {/* Pricing Summary */}
          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Item Subtotal</span>
              <span>₦3,200.00</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Rider Delivery Fee</span>
              <span>₦800.00</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Platform Service Fee</span>
              <span>₦100.00</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-base border-t pt-2">
              <span>Total Payable</span>
              <span className="text-emerald-700">₦4,100.00</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-sm flex items-center justify-center gap-2"
          >
            {loading ? 'Generating Transfer Account...' : 'Generate Dynamic Bank Account →'}
          </button>
        </form>
      ) : (
        /* Instant Bank Transfer Virtual Account Presentation */
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              ⚡ Instant Bank Transfer (Monnify / Korapay)
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
              Expires in 30 mins
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Transfer exactly <strong className="text-slate-900">₦{virtualAccount.amount.toLocaleString()}</strong> to the dedicated virtual account below from any banking app or USSD:
          </p>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Bank Name</span>
              <span className="font-bold text-slate-800">{virtualAccount.bankName}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-slate-500">Account Number</span>
              <span className="font-mono font-extrabold text-emerald-700 text-lg tracking-wider">
                {virtualAccount.accountNumber}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Account Name</span>
              <span className="font-semibold text-slate-800">{virtualAccount.accountName}</span>
            </div>
          </div>

          <div className="text-center pt-2">
            <a
              href="/track/ORD-8K3F9A"
              className="inline-block px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
            >
              I Have Sent the Money (Go to Order Tracker) →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
