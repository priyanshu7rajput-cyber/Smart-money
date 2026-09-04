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
  Building,
  User,
  LogOut,
  LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function TopNavbar() {
  const pathname = usePathname();
  const { searchQuery, setSearchQuery, currentCompany, currentUser, isAuthenticated, logout } = useApp();
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

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

        {/* User Session Profile & Logout */}
        <div className="relative ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
          {isAuthenticated && currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      {currentUser.role}
                    </span>
                  </div>

                  <Link
                    href="/settings/company"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Company Profile</span>
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="outline" className="text-xs gap-1.5">
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
