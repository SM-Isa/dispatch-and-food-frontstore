import { fetchFromApi } from '@/lib/api';

interface VendorItem {
  id: string;
  store_name: string;
  slug: string;
  cluster_zone: string;
  address_text: string;
  is_open: boolean;
  phone_number: string;
}

export default async function HomePage() {
  let vendors: VendorItem[] = [];
  try {
    vendors = await fetchFromApi<VendorItem[]>('/vendors?isOpenOnly=false');
  } catch {
    // Fallback sample data if backend not connected during initial build
    vendors = [
      {
        id: '20000000-0000-0000-0000-000000000001',
        store_name: 'Tanke Express Kitchen',
        slug: 'tanke-express',
        cluster_zone: 'TANKE',
        address_text: '14 University Road, Tanke, Ilorin',
        is_open: true,
        phone_number: '+2348011112222',
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        store_name: 'GRA Grill House & Smoothies',
        slug: 'gra-grill-house',
        cluster_zone: 'GRA',
        address_text: '8 Ahmadu Bello Way, GRA, Ilorin',
        is_open: true,
        phone_number: '+2348033334444',
      },
    ];
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-800 p-8 text-white shadow-lg">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Craving Delicious Food?
        </h1>
        <p className="mt-2 text-emerald-100 max-w-xl">
          Order directly from top kitchens in your cluster zone. Delivered fast with real-time motorcycle rider tracking.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="bg-emerald-800/80 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            ⚡ Instant Bank Transfer Checkout
          </span>
          <span className="bg-emerald-800/80 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            📍 PostGIS Geo-Clustering
          </span>
          <span className="bg-emerald-800/80 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            🛡️ Escrow Protected
          </span>
        </div>
      </div>

      {/* Cluster selection & Vendor list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Available Kitchens & Storefronts</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs font-semibold rounded-md bg-emerald-600 text-white">
              All Clusters
            </button>
            <button className="px-3 py-1 text-xs font-semibold rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">
              Tanke
            </button>
            <button className="px-3 py-1 text-xs font-semibold rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">
              GRA
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {vendor.cluster_zone}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      vendor.is_open
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {vendor.is_open ? '● Open Now' : 'Closed'}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 mt-2">
                  {vendor.store_name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                  {vendor.address_text || 'Local Kitchen Storefront'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  slug: /{vendor.slug}
                </span>
                <a
                  href={`/store/${vendor.slug}`}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  View Menu →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
