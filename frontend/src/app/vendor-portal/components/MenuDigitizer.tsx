'use client';

import React, { useState } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  Send,
  Eye,
  Camera,
} from 'lucide-react';

export interface DigitizedMenuItem {
  id: string;
  name: string;
  price: number;
  category: 'RICE' | 'SWALLOW' | 'PROTEIN' | 'SOUPS' | 'SNACK' | 'DRINK';
  confidence: number;
  isAvailable: boolean;
  boundingBox?: [number, number, number, number];
}

const SAMPLE_DEMO_ITEMS: DigitizedMenuItem[] = [
  {
    id: 'item_1',
    name: 'Smoky Jollof Rice & Crispy Chicken',
    price: 2500,
    category: 'RICE',
    confidence: 0.96,
    isAvailable: true,
  },
  {
    id: 'item_2',
    name: 'Amala with Gbegiri & Ewedu (Goat Meat)',
    price: 2800,
    category: 'SWALLOW',
    confidence: 0.94,
    isAvailable: true,
  },
  {
    id: 'item_3',
    name: 'Fried Rice & Peppered Beef',
    price: 3000,
    category: 'RICE',
    confidence: 0.91,
    isAvailable: true,
  },
  {
    id: 'item_4',
    name: 'Pounded Yam & Egusi Soup (Assorted)',
    price: 3200,
    category: 'SWALLOW',
    confidence: 0.84, // Yellow review
    isAvailable: true,
  },
  {
    id: 'item_5',
    name: 'Beef Shawarma with Double Sausage',
    price: 1800,
    category: 'SNACK',
    confidence: 0.72, // Red review
    isAvailable: true,
  },
  {
    id: 'item_6',
    name: 'Chilled Chapman (500ml)',
    price: 700,
    category: 'DRINK',
    confidence: 0.98,
    isAvailable: true,
  },
];

export default function MenuDigitizer({
  onPublishSuccess,
}: {
  onPublishSuccess?: (itemsCount: number) => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [extractedItems, setExtractedItems] = useState<DigitizedMenuItem[]>([]);
  const [isPublished, setIsPublished] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      simulateScan();
    }
  };

  const loadDemoMenu = () => {
    setSelectedFile(null);
    setPreviewUrl('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80');
    simulateScan();
  };

  const simulateScan = () => {
    setIsScanning(true);
    setIsPublished(false);
    setScanStep('Sending image to Gemini 1.5 Flash Vision...');

    setTimeout(() => {
      setScanStep('Extracting text, item names, and Naira price bounding boxes...');
    }, 1200);

    setTimeout(() => {
      setScanStep('Normalizing items into canonical Nigerian food taxonomy (Gemma 2B)...');
    }, 2400);

    setTimeout(() => {
      setIsScanning(false);
      setExtractedItems(SAMPLE_DEMO_ITEMS);
      setScanStep('');
    }, 3600);
  };

  const updateItem = (id: string, updates: Partial<DigitizedMenuItem>) => {
    setExtractedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const deleteItem = (id: string) => {
    setExtractedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addNewItem = () => {
    const newItem: DigitizedMenuItem = {
      id: `item_manual_${Date.now()}`,
      name: '',
      price: 1500,
      category: 'RICE',
      confidence: 1.0,
      isAvailable: true,
    };
    setExtractedItems((prev) => [...prev, newItem]);
  };

  const publishMenu = () => {
    setIsPublished(true);
    if (onPublishSuccess) {
      onPublishSuccess(extractedItems.length);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {(confidence * 100).toFixed(0)}% Confirmed
        </span>
      );
    }
    if (confidence >= 0.75) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5" />
          {(confidence * 100).toFixed(0)}% Review Price
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
        <AlertCircle className="w-3.5 h-3.5" />
        {(confidence * 100).toFixed(0)}% Manual Check
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Multimodal Menu Digitizer (Gemini Vision)
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Digitize Paper or Chalkboard Menu
          </h2>
          <p className="text-xs text-slate-500">
            Upload a photo of your handwritten board, printed menu, or plated dishes. AI extracts prices and items in 6 seconds.
          </p>
        </div>

        <button
          onClick={loadDemoMenu}
          type="button"
          className="text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Camera className="w-4 h-4 text-slate-500" />
          Load Demo Photo (Ilorin Buka)
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Upload Zone */}
        {extractedItems.length === 0 && !isScanning && (
          <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50/50 hover:bg-emerald-50/20 group">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition duration-200">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mt-4">
              Click to upload or drag and drop menu photo
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Supports JPEG, PNG, HEIC up to 15MB. Best results with flat overhead lighting and clear handwritten prices.
            </p>
          </label>
        )}

        {/* Scanning Progress Animation */}
        {isScanning && (
          <div className="p-8 border border-emerald-100 bg-emerald-50/30 rounded-2xl flex flex-col items-center text-center space-y-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-200 animate-ping opacity-25"></div>
              <div className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Gemini 1.5 Flash Vision Processing
              </h4>
              <p className="text-xs text-emerald-700 font-medium mt-1 animate-pulse">
                {scanStep}
              </p>
            </div>
          </div>
        )}

        {/* Extraction Review Table */}
        {extractedItems.length > 0 && !isScanning && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                {previewUrl && (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                    <img
                      src={previewUrl}
                      alt="Source Menu"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Extracted {extractedItems.length} Dishes & Drinks
                  </h4>
                  <p className="text-xs text-slate-500">
                    Review prices and categories before publishing to your storefront.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={addNewItem}
                  type="button"
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Dish
                </button>
                <label className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer">
                  <UploadCloud className="w-3.5 h-3.5" />
                  Scan Another Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            {/* Editable List */}
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              <div className="grid grid-cols-12 bg-slate-100/70 p-3 text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                <div className="col-span-5">Dish / Item Name</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Price (₦)</div>
                <div className="col-span-2 text-center">AI Confidence</div>
                <div className="col-span-1 text-right">Action</div>
              </div>

              {extractedItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 p-3 items-center gap-2 text-sm hover:bg-slate-50/60 transition"
                >
                  {/* Name Input */}
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, { name: e.target.value })}
                      placeholder="e.g. Smoky Jollof Rice"
                      className="w-full text-xs font-semibold text-slate-800 bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded-lg px-2 py-1 outline-none transition"
                    />
                  </div>

                  {/* Category Selector */}
                  <div className="col-span-2">
                    <select
                      value={item.category}
                      onChange={(e) =>
                        updateItem(item.id, {
                          category: e.target.value as DigitizedMenuItem['category'],
                        })
                      }
                      className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none"
                    >
                      <option value="RICE">Rice</option>
                      <option value="SWALLOW">Swallow</option>
                      <option value="PROTEIN">Protein</option>
                      <option value="SOUPS">Soups</option>
                      <option value="SNACK">Snack</option>
                      <option value="DRINK">Drink</option>
                    </select>
                  </div>

                  {/* Price Input */}
                  <div className="col-span-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">
                        ₦
                      </span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(item.id, {
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full text-xs font-bold text-slate-800 pl-6 pr-2 py-1 border border-slate-200 focus:border-emerald-500 rounded-lg outline-none"
                      />
                    </div>
                  </div>

                  {/* AI Confidence Badge */}
                  <div className="col-span-2 flex justify-center">
                    {getConfidenceBadge(item.confidence)}
                  </div>

                  {/* Delete Button */}
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => deleteItem(item.id)}
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Publish & Status Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  Target Listing SLA:
                </span>{' '}
                90 seconds from photo to live customer menu.
              </div>

              <div className="flex items-center gap-3">
                {isPublished ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Menu Successfully Published to Live Storefront!
                  </div>
                ) : (
                  <button
                    onClick={publishMenu}
                    type="button"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Publish {extractedItems.length} Items to Storefront
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
