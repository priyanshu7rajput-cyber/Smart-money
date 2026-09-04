'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  Search, 
  Plus, 
  Bell, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight,
  ShieldCheck,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function TopNavbar() {
  const pathname = usePathname();
  const { searchQuery, setSearchQuery, currentCompany } = useApp();

  // Generate breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => {
    const href = `/${segments.slice(0, i + 1).join('/')}`;
    const label = seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return { href, label };
  });

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-600 transition-colors font-medium flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5" />
          <span>{currentCompany.name}</span>
        </Link>
        {breadcrumbs.length > 0 && <span>/</span>}
        {breadcrumbs.map((b, idx) => (
          <React.Fragment key={b.href}>
            {idx === breadcrumbs.length - 1 ? (
              <span className="font-semibold text-slate-900 dark:text-slate-100">{b.label}</span>
            ) : (
              <>
                <Link href={b.href} className="hover:text-blue-600 transition-colors">{b.label}</Link>
                <span>/</span>
              </>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Center Search */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Tx #, Party, Reference, UTR or Cheque..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Right Quick Transaction Actions */}
      <div className="flex items-center gap-2">
        <Link href="/transactions/cash-receipt">
          <Button size="sm" variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Cash Receipt</span>
          </Button>
        </Link>

        <Link href="/transactions/bank-payment">
          <Button size="sm" variant="outline" className="text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Bank Payment</span>
          </Button>
        </Link>

        <Link href="/transactions/transfer">
          <Button size="sm" variant="primary" className="text-xs">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transfer / Contra</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
