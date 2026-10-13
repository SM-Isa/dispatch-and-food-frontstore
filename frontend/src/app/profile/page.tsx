'use client';

import React, { useState, useEffect } from 'react';
import { User, MapPin, Plus, Trash2, CheckCircle, ShieldCheck } from 'lucide-react';

interface AddressItem {
  id: string;
  label: string;
  address_text: string;
  landmark?: string;
  is_default: boolean;
}

export default function CustomerProfilePage() {
  const [fullName, setFullName] = useState('Zainab Balogun');
  const [phone, setPhone] = useState('+2348099990000');
  const [email, setEmail] = useState('zainab@gmail.com');
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [newAddressText, setNewAddressText] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadAddresses() {
      try {
        const res = await fetch('http://localhost:4000/api/users/me/addresses', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setAddresses(data);
            return;
          }
        }
      } catch (_) {}

      // Fallback sample addresses
      setAddresses([
        {
          id: 'addr-1',
          label: 'Home',
          address_text: 'Block 4, University Road, Tanke, Ilorin',
          landmark: 'Near Tipper Garage',
          is_default: true,
        },
        {
          id: 'addr-2',
          label: 'Office',
          address_text: 'Plot 12, Ahmadu Bello Way, GRA, Ilorin',
          landmark: 'Opposite Kwara Hotel',
          is_default: false,
        },
      ]);
    }

    loadAddresses();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await fetch('http://localhost:4000/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ fullName, email }),
      });
      setFeedbackMsg('Profile updated successfully!');
    } catch (_) {
      setFeedbackMsg('Profile updated locally!');
    }
    setSavingProfile(false);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressText) return;

    const newAddr: AddressItem = {
      id: `addr-${Date.now()}`,
      label: newLabel,
      address_text: newAddressText,
      landmark: newLandmark || undefined,
      is_default: isDefault,
    };

    try {
      await fetch('http://localhost:4000/api/users/me/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          label: newLabel,
          addressText: newAddressText,
          landmark: newLandmark,
          isDefault,
        }),
      });
    } catch (_) {}

    setAddresses((prev) => [newAddr, ...prev]);
    setShowAddAddress(false);
    setNewAddressText('');
    setNewLandmark('');
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await fetch(`http://localhost:4000/api/users/me/addresses/${id}/delete`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
    } catch (_) {}
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Account Profile & Address Book</h1>
        <p className="text-sm text-slate-500">Manage contact information and saved delivery destinations for 1-click checkout.</p>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" /> {feedbackMsg}
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" /> Personal Details
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number (Verified)</label>
              <input
                type="text"
                value={phone}
                disabled
                className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50 text-slate-500 cursor-not-allowed outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Address Book */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" /> Saved Delivery Addresses
          </h2>
          <button
            onClick={() => setShowAddAddress(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Address
          </button>
        </div>

        {addresses.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No saved addresses yet.</p>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800 text-sm">{addr.label}</span>
                    {addr.is_default && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{addr.address_text}</p>
                  {addr.landmark && (
                    <p className="text-xs text-slate-400 mt-0.5">Landmark: {addr.landmark}</p>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition"
                  title="Remove Address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Address Modal */}
      {showAddAddress && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add New Delivery Destination</h3>

            <form onSubmit={handleAddAddress} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Address Label</label>
                <select
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office / Workplace</option>
                  <option value="Hostel">University Hostel</option>
                  <option value="Family">Family / Friend</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Street Address</label>
                <textarea
                  value={newAddressText}
                  onChange={(e) => setNewAddressText(e.target.value)}
                  placeholder="e.g. Plot 15, University Road, Tanke, Ilorin"
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nearby Landmark (Optional)</label>
                <input
                  type="text"
                  value={newLandmark}
                  onChange={(e) => setNewLandmark(e.target.value)}
                  placeholder="e.g. Opposite Tipper Garage / Near Gate"
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="defaultCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="defaultCheck" className="text-xs font-medium text-slate-700">
                  Set as default delivery address
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="px-4 py-2 rounded-xl border text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
