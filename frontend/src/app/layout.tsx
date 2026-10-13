import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dispatch & Food Vendor Storefront',
  description: 'Fast multi-tenant e-commerce catalog and dispatch aggregator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-2.5">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-y-2">
            <a href="/" className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-base shadow-sm">
                D
              </span>
              <span className="font-extrabold text-lg tracking-tight text-slate-800">
                Dispatch<span className="text-emerald-600">Eats</span>
              </span>
            </a>

            <nav className="flex items-center flex-wrap gap-1 sm:gap-2 text-xs font-bold">
              {/* Customer Links */}
              <a
                href="/"
                className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Browse Stores
              </a>
              <a
                href="/orders"
                className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                My Orders
              </a>
              <a
                href="/profile"
                className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Saved Addresses
              </a>

              <span className="h-4 w-px bg-slate-200 mx-1 hidden sm:inline-block" />

              {/* Vendor Portal Links */}
              <div className="flex items-center bg-slate-100/80 rounded-lg p-0.5">
                <a
                  href="/vendor-portal/dashboard"
                  className="px-2.5 py-1 rounded-md text-slate-700 hover:text-emerald-700 hover:bg-white transition"
                >
                  Kitchen Display
                </a>
                <a
                  href="/vendor-portal/menu"
                  className="px-2.5 py-1 rounded-md text-slate-700 hover:text-emerald-700 hover:bg-white transition"
                >
                  Menu Catalog
                </a>
              </div>

              <span className="h-4 w-px bg-slate-200 mx-1 hidden sm:inline-block" />

              {/* Admin Ops Console */}
              <a
                href="/admin/dashboard"
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm"
              >
                Ops Console
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 px-4">
            <p>© 2026 Dispatch Operations • Ilorin City Aggregator</p>
            <div className="flex items-center gap-4 text-slate-400">
              <a href="/admin/ledger" className="hover:text-slate-700 underline">Ledger Reconciliation</a>
              <a href="/vendor-portal/register" className="hover:text-slate-700 underline">Vendor Onboarding</a>
              <span>Status: Staging Online</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
