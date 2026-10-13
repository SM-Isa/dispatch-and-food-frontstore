import { fetchFromApi } from '@/lib/api';
import { Metadata } from 'next';

interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: string;
  is_available: boolean;
  is_published: boolean;
  image_url?: string;
  category: string;
}

interface VendorDetails {
  id: string;
  store_name: string;
  slug: string;
  cluster_zone: string;
  address_text: string;
  phone_number: string;
  is_open: boolean;
  products: ProductItem[];
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const vendor = await fetchFromApi<VendorDetails>(`/vendors/slug/${params.slug}`);
    return {
      title: `${vendor.store_name} | Order Online`,
      description: `Order fresh food from ${vendor.store_name} in ${vendor.cluster_zone}. Fast motorcycle delivery with live tracking!`,
      openGraph: {
        title: `${vendor.store_name} - Online Storefront`,
        description: `Browse menu and order online. Fast delivery in ${vendor.cluster_zone}!`,
      },
    };
  } catch {
    return {
      title: 'Vendor Storefront',
    };
  }
}

export default async function VendorStorefrontPage({
  params,
}: {
  params: { slug: string };
}) {
  let vendor: VendorDetails | null = null;
  try {
    vendor = await fetchFromApi<VendorDetails>(`/vendors/slug/${params.slug}`);
  } catch {
    // Fallback demonstration data
    vendor = {
      id: '20000000-0000-0000-0000-000000000001',
      store_name: 'Tanke Express Kitchen',
      slug: params.slug,
      cluster_zone: 'TANKE',
      address_text: '14 University Road, Tanke, Ilorin',
      phone_number: '+2348011112222',
      is_open: true,
      products: [
        {
          id: '30000000-0000-0000-0000-000000000001',
          name: 'Smoky Jollof Rice & Crispy Chicken',
          description: 'Authentic Nigerian party jollof with spiced grilled chicken and fried plantain',
          price: '3200.00',
          is_available: true,
          is_published: true,
          category: 'Rice & Combos',
        },
        {
          id: '30000000-0000-0000-0000-000000000002',
          name: 'Special Beef Shawarma (Double Sausage)',
          description: 'Freshly grilled pita loaded with shredded beef, spicy mayo, and two sausages',
          price: '2500.00',
          is_available: true,
          is_published: true,
          category: 'Quick Bites',
        },
      ],
    };
  }

  const formatNaira = (val: string | number) =>
    `₦${parseFloat(val.toString()).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Store Header for WhatsApp/IG link sharing */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                {vendor.cluster_zone} Cluster
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  vendor.is_open
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {vendor.is_open ? '● Open & Accepting Orders' : 'Currently Closed'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
              {vendor.store_name}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{vendor.address_text}</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/?text=Check%20out%20${encodeURIComponent(vendor.store_name)}%20menu!`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2"
            >
              Share on WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Menu Catalog */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Menu Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendor.products.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900">{item.name}</h3>
                  <span className="font-extrabold text-emerald-700 whitespace-nowrap text-base">
                    {formatNaira(item.price)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {item.description}
                </p>
                <div className="mt-3">
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {item.category}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${
                    item.is_available ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {item.is_available ? 'In Stock' : 'Sold Out'}
                </span>
                <a
                  href={`/checkout?vendorId=${vendor.id}&productId=${item.id}`}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                    item.is_available && vendor.is_open
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Order Now →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
