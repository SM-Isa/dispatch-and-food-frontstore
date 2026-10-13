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
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                D
              </span>
              <span className="font-bold text-xl tracking-tight text-slate-800">
                Dispatch<span className="text-emerald-600">Eats</span>
              </span>
            </a>
            <div className="flex items-center gap-4 text-sm font-medium">
              <a href="/vendor-portal/dashboard" className="text-slate-600 hover:text-emerald-600 transition">
                Vendor Portal
              </a>
              <a href="/admin/ledger" className="text-slate-600 hover:text-emerald-600 transition">
                Ledger Audit
              </a>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
          <p>© 2026 Dispatch Rider Aggregator & Food Vendor Storefront</p>
        </footer>
      </body>
    </html>
  );
}
