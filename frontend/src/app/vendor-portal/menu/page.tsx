'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Tag, Check, X, Edit2, Trash2, AlertCircle, Utensils, Clock } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  isAvailable: boolean;
  prepTimeMinutes?: number;
}

export default function VendorMenuPage() {
  const vendorId = '20000000-0000-0000-0000-000000000001'; // Default Tanke Kitchen
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Rice & Combos');
  const [formPrice, setFormPrice] = useState('2500');
  const [formDesc, setFormDesc] = useState('');
  const [formPrepTime, setFormPrepTime] = useState('15');

  // Initial fetch
  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch(`http://localhost:4000/api/products/vendor/${vendorId}?includeUnpublished=true`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setItems(
              data.map((d: any) => ({
                id: d.id,
                name: d.name,
                category: d.category || 'Dishes',
                price: parseFloat(d.price) || 0,
                description: d.description || '',
                isAvailable: d.is_available ?? d.isAvailable ?? true,
                prepTimeMinutes: d.prep_time_minutes || 15,
              }))
            );
            setLoading(false);
            return;
          }
        }
      } catch (_) {}

      // Fallback sample catalog for offline/standalone execution
      setItems([
        {
          id: 'item-1',
          name: 'Smoky Jollof Rice & Crispy Chicken',
          category: 'Rice & Combos',
          price: 3200,
          description: 'Wood-fired party jollof served with fried plantain & spiced quarter chicken.',
          isAvailable: true,
          prepTimeMinutes: 12,
        },
        {
          id: 'item-2',
          name: 'Special Beef Shawarma (Double Sausage)',
          category: 'Quick Bites',
          price: 2500,
          description: 'Loaded pita with shredded grilled beef, two sausages, garlic mayo & cabbage.',
          isAvailable: true,
          prepTimeMinutes: 10,
        },
        {
          id: 'item-3',
          name: 'Pounded Yam with Egusi & Goat Meat',
          category: 'Swallows',
          price: 4000,
          description: 'Hot pounded yam with rich melon soup and tender slow-cooked goat meat.',
          isAvailable: false, // Sold out
          prepTimeMinutes: 20,
        },
        {
          id: 'item-4',
          name: 'Grilled Catfish Point & Kill (Spicy Pepper Sauce)',
          category: 'Grills',
          price: 5500,
          description: 'Whole charcoal-grilled catfish garnished with roasted bell peppers & onions.',
          isAvailable: true,
          prepTimeMinutes: 30,
        },
        {
          id: 'item-5',
          name: 'Chilled Zobo Drink (Ginger & Cloves)',
          category: 'Drinks',
          price: 800,
          description: 'Natural hibiscus beverage infused with fresh ginger and natural pineapple.',
          isAvailable: true,
          prepTimeMinutes: 2,
        },
      ]);
      setLoading(false);
    }

    fetchMenu();
  }, [vendorId]);

  const toggleAvailability = async (id: string, currentVal: boolean) => {
    const newVal = !currentVal;
    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isAvailable: newVal } : item))
    );

    try {
      await fetch(`http://localhost:4000/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: newVal }),
      });
    } catch (_) {}
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('Rice & Combos');
    setFormPrice('2500');
    setFormDesc('');
    setFormPrepTime('15');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price.toString());
    setFormDesc(item.description);
    setFormPrepTime((item.prepTimeMinutes || 15).toString());
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this dish from the menu?')) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch(`http://localhost:4000/api/products/${id}`, {
        method: 'DELETE',
      });
    } catch (_) {}
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(formPrice) || 0;
    const prepNum = parseInt(formPrepTime, 10) || 15;

    if (editingItem) {
      // Update existing
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? {
                ...i,
                name: formName,
                category: formCategory,
                price: priceNum,
                description: formDesc,
                prepTimeMinutes: prepNum,
              }
            : i
        )
      );

      try {
        await fetch(`http://localhost:4000/api/products/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            category: formCategory,
            price: priceNum,
            description: formDesc,
          }),
        });
      } catch (_) {}
    } else {
      // Create new
      const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        name: formName,
        category: formCategory,
        price: priceNum,
        description: formDesc,
        isAvailable: true,
        prepTimeMinutes: prepNum,
      };
      setItems((prev) => [newItem, ...prev]);

      try {
        await fetch(`http://localhost:4000/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId,
            name: formName,
            category: formCategory,
            price: priceNum,
            description: formDesc,
            isAvailable: true,
          }),
        });
      } catch (_) {}
    }

    setIsModalOpen(false);
  };

  const categories = ['ALL', 'Rice & Combos', 'Swallows', 'Quick Bites', 'Grills', 'Drinks'];

  const filteredItems = items.filter((item) => {
    const matchesCat = filterCategory === 'ALL' || item.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Kitchen Catalog Management
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
              {items.filter((i) => i.isAvailable).length} Active Dishes
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Menu Dishes & Stock Availability
          </h1>
          <p className="text-xs text-slate-500">
            Changes update instantly on customer storefront PWAs, WhatsApp bot, and rider delivery manifests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/vendor-portal/dashboard"
            className="px-3.5 py-2 text-xs font-bold border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition"
          >
            ← Live Kitchen Queue
          </a>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Dish
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Categories pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                filterCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search dish or ingredient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Menu items grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-2xl border p-5 transition flex flex-col justify-between shadow-sm ${
              item.isAvailable ? 'border-slate-200' : 'border-rose-200 bg-rose-50/20'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {item.category}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base mt-1.5">{item.name}</h3>
                </div>
                <span className="font-extrabold text-emerald-700 text-base">
                  ₦{item.price.toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-2 line-clamp-2">{item.description}</p>

              <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  ~{item.prepTimeMinutes || 15} mins prep
                </span>
                <span className="flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5" />
                  Portion: Regular
                </span>
              </div>
            </div>

            {/* Actions footer */}
            <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between">
              {/* Sold Out Switch */}
              <button
                type="button"
                onClick={() => toggleAvailability(item.id, item.isAvailable)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  item.isAvailable
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                }`}
              >
                {item.isAvailable ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    In-Stock
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    Sold Out
                  </>
                )}
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                  title="Edit dish"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  title="Delete dish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
            <Utensils className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="font-bold text-slate-800">No dishes match your filter</p>
            <p className="text-xs text-slate-400 mt-1">Try selecting a different category or clearing search.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-extrabold text-slate-900">
                {editingItem ? 'Edit Dish Details' : 'Add New Dish to Menu'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Dish / Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asun Rice & Fried Plantain"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Rice & Combos">Rice & Combos</option>
                    <option value="Swallows">Swallows</option>
                    <option value="Quick Bites">Quick Bites</option>
                    <option value="Grills">Grills</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Price (₦ Naira)
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="50"
                    placeholder="2500"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Estimated Cooking Time (Minutes)
                </label>
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={formPrepTime}
                  onChange={(e) => setFormPrepTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description & Ingredients
                </label>
                <textarea
                  rows={3}
                  placeholder="Mention sides, spiciness level, proteins included..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 font-bold text-xs text-slate-700 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white rounded-xl transition shadow-sm"
                >
                  {editingItem ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
