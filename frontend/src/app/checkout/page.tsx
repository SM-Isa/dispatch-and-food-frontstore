'use client';

import { useState, useEffect } from 'react';
import { Tag, MapPin, CheckCircle, Copy, AlertCircle, ArrowRight } from 'lucide-react';

interface SavedAddress {
  id: string;
  label: string;
  street: string;
  landmark?: string;
  cluster_zone: string;
  is_default: boolean;
}

export default function CheckoutPage() {
  const [phone, setPhone] = useState('+2348012345678');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('custom');
  const [address, setAddress] = useState('Block B, Tanke Akata Road, Ilorin');
  const [landmark, setLandmark] = useState('Near University Gate');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    message: string;
  } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [virtualAccount, setVirtualAccount] = useState<{
    bankName: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    paymentReference: string;
  } | null>(null);

  const subtotal = 3200;
  const deliveryFee = 800;
  const platformFee = 100;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const totalPayable = Math.max(0, subtotal + deliveryFee + platformFee - discount);

  // Fetch saved addresses
  useEffect(() => {
    async function loadAddresses() {
      try {
        const res = await fetch('http://localhost:4000/api/users/me/addresses');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSavedAddresses(data);
            const def = data.find((a: SavedAddress) => a.is_default) || data[0];
            setSelectedAddressId(def.id);
            setAddress(def.street);
            if (def.landmark) setLandmark(def.landmark);
            return;
          }
        }
      } catch (_) {}

      // Default fallback addresses
      const fallbackAddresses: SavedAddress[] = [
        {
          id: 'addr_1',
          label: 'Home',
          street: '14 University Road, Tanke',
          landmark: 'Beside Sanrab Filling Station',
          cluster_zone: 'TANKE',
          is_default: true,
        },
        {
          id: 'addr_2',
          label: 'Office / Campus',
          street: 'Faculty of Engineering, Unilorin Main Campus',
          landmark: 'Block 3 Staff Car Park',
          cluster_zone: 'UNILORIN',
          is_default: false,
        },
      ];
      setSavedAddresses(fallbackAddresses);
      setSelectedAddressId('addr_1');
      setAddress(fallbackAddresses[0].street);
      setLandmark(fallbackAddresses[0].landmark || '');
    }

    loadAddresses();
  }, []);

  const handleSelectAddress = (id: string) => {
    setSelectedAddressId(id);
    if (id === 'custom') {
      setAddress('');
      setLandmark('');
    } else {
      const found = savedAddresses.find((a) => a.id === id);
      if (found) {
        setAddress(found.street);
        setLandmark(found.landmark || '');
      }
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');

    try {
      const res = await fetch('http://localhost:4000/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          orderAmount: subtotal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isValid) {
          setAppliedCoupon({
            code: data.code,
            discountAmount: data.discountAmount,
            message: data.message,
          });
          setCouponError('');
          return;
        } else {
          setCouponError(data.message || 'Invalid coupon code');
          setAppliedCoupon(null);
          return;
        }
      }
    } catch (_) {}

    // Offline / fallback verification
    const code = couponCode.trim().toUpperCase();
    if (code === 'DISPATCH500') {
      setAppliedCoupon({ code, discountAmount: 500, message: '₦500 off welcome discount applied!' });
    } else if (code === 'ILORIN10') {
      setAppliedCoupon({ code, discountAmount: Math.round(subtotal * 0.1), message: '10% Ilorin community discount applied!' });
    } else if (code === 'FREEDELIVERY') {
      setAppliedCoupon({ code, discountAmount: deliveryFee, message: 'Free delivery applied!' });
    } else {
      setCouponError('Invalid or expired coupon code. Try DISPATCH500 or ILORIN10.');
      setAppliedCoupon(null);
    }
    setValidatingCoupon(false);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderPayload = {
        customerPhone: phone,
        deliveryAddress: `${address}${landmark ? ` (Landmark: ${landmark})` : ''}`,
        subtotal,
        deliveryFee,
        discountAmount: discount,
        couponCode: appliedCoupon?.code,
        totalAmount: totalPayable,
      };

      const res = await fetch('http://localhost:4000/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          amount: totalPayable,
          customerPhone: phone,
          channel: 'BANK_TRANSFER',
        }),
      });

      if (res.ok) {
        const paymentData = await res.json();
        setVirtualAccount({
          bankName: paymentData.bankName || 'Wema Bank / Monnify',
          accountNumber: paymentData.accountNumber || '7849102941',
          accountName: paymentData.accountName || `Dispatch/${paymentData.orderId}`,
          amount: totalPayable,
          paymentReference: paymentData.reference || `PAY-${Date.now()}`,
        });
        setLoading(false);
        return;
      }
    } catch (_) {}

    // Fallback dynamic virtual account
    setTimeout(() => {
      const randRef = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setVirtualAccount({
        bankName: 'Wema Bank / Monnify NIP',
        accountNumber: '7849102941',
        accountName: `Dispatch/${randRef}`,
        amount: totalPayable,
        paymentReference: `PAY-${randRef}-9021`,
      });
      setLoading(false);
    }, 800);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">Checkout & Transfer</h1>
        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
          Instant NIP Gateway
        </span>
      </div>

      {!virtualAccount ? (
        <form onSubmit={handlePlaceOrder} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          {/* Customer Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Your Phone Number (For SMS & Rider Tracking)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>

          {/* Saved Address Book Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Select Delivery Address
              </span>
              <a href="/profile" className="text-emerald-600 lowercase font-medium hover:underline">
                Manage address book →
              </a>
            </label>
            
            <div className="space-y-2 mb-3">
              {savedAddresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                    selectedAddressId === addr.id
                      ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 font-medium'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="addressChoice"
                    checked={selectedAddressId === addr.id}
                    onChange={() => handleSelectAddress(addr.id)}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{addr.label}</span>
                      {addr.is_default && (
                        <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                          Default
                        </span>
                      )}
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                        {addr.cluster_zone}
                      </span>
                    </div>
                    <p className="mt-0.5 text-slate-600">{addr.street}</p>
                    {addr.landmark && (
                      <p className="text-[11px] text-slate-400">Landmark: {addr.landmark}</p>
                    )}
                  </div>
                </label>
              ))}

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                  selectedAddressId === 'custom'
                    ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 font-medium'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="addressChoice"
                  checked={selectedAddressId === 'custom'}
                  onChange={() => handleSelectAddress('custom')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800">+ Enter a different delivery address</span>
              </label>
            </div>

            {selectedAddressId === 'custom' && (
              <div className="space-y-2 mt-2">
                <input
                  type="text"
                  placeholder="Street address (e.g. 24 Tipper Garage Road)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Prominent landmark (e.g. Opposite Bovas Gas Station)"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Promo Code / Coupon Section */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                Promo / Voucher Code
              </label>
              <span className="text-[11px] text-slate-400 font-mono">DISPATCH500 / ILORIN10</span>
            </div>

            {!appliedCoupon ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code (e.g. DISPATCH500)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 uppercase font-mono px-3 py-1.5 border rounded-lg text-xs font-bold tracking-wider outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition"
                >
                  {validatingCoupon ? 'Checking...' : 'Apply'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-emerald-100 text-emerald-900 px-3 py-2 rounded-lg text-xs">
                <div>
                  <span className="font-mono font-bold tracking-wider">{appliedCoupon.code}</span>
                  <p className="text-[11px] text-emerald-800">{appliedCoupon.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode('');
                  }}
                  className="text-emerald-900 hover:text-rose-700 font-bold text-xs underline ml-2"
                >
                  Remove
                </button>
              </div>
            )}

            {couponError && (
              <p className="text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {couponError}
              </p>
            )}
          </div>

          {/* Pricing Breakdown */}
          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Item Subtotal</span>
              <span>₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Rider Delivery Fee</span>
              <span>₦{deliveryFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Platform Service Fee</span>
              <span>₦{platformFee.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Voucher Discount</span>
                <span>-₦{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-slate-900 text-base border-t pt-2">
              <span>Total Payable</span>
              <span className="text-emerald-700 text-lg">₦{totalPayable.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !address}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? 'Generating Transfer Account...' : 'Generate Dynamic Bank Account →'}
          </button>
        </form>
      ) : (
        /* Instant Bank Transfer Virtual Account Presentation */
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 shadow-md space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Instant Bank Transfer (Monnify / Korapay)
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
              Expires in 30 mins
            </span>
          </div>

          <p className="text-xs text-slate-700">
            Transfer exactly <strong className="text-slate-900 font-bold">₦{virtualAccount.amount.toLocaleString()}</strong> to the dedicated virtual account below from any banking app or USSD:
          </p>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Bank Name</span>
              <span className="font-bold text-slate-800">{virtualAccount.bankName}</span>
            </div>
            <div className="flex justify-between items-center text-base">
              <span className="text-slate-500">Account Number</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-emerald-700 text-xl tracking-wider">
                  {virtualAccount.accountNumber}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(virtualAccount.accountNumber)}
                  className="p-1 rounded hover:bg-slate-100 text-slate-600"
                  title="Copy account number"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            {copied && (
              <p className="text-[11px] text-emerald-600 text-right font-medium">Copied to clipboard!</p>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Account Name</span>
              <span className="font-semibold text-slate-800">{virtualAccount.accountName}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t text-slate-400">
              <span>Reference</span>
              <span className="font-mono">{virtualAccount.paymentReference}</span>
            </div>
          </div>

          <div className="text-center pt-2 space-y-2">
            <a
              href="/orders"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-sm"
            >
              <span>I Have Sent the Money (Go to My Orders)</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <p className="text-[11px] text-slate-500">
              Webhook triggers within 2–5 seconds upon interbank settlement.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
