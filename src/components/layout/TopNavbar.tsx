'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  Search, 
  Plus, 
  Menu,
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Building, 
  User, 
  LogOut, 
  LogIn,
  Sun, 
  Moon,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function TopNavbar() {
  const pathname = usePathname();
  const { 
    searchQuery, 
    setSearchQuery, 
    currentCompany, 
    currentUser, 
    isAuthenticated, 
    logout, 
    theme, 
    toggleTheme,
    toggleMobileSidebar 
  } = useApp();
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isSearchVisibleMobile, setIsSearchVisibleMobile] = useState(false);

  // Generate breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => {
    const href = `/${segments.slice(0, i + 1).join('/')}`;
    const label = seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return { href, label };
  });

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between gap-2">
      {/* Left Area: Mobile Hamburger + Breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
          <Link href="/" className="hover:text-blue-600 transition-colors font-semibold flex items-center gap-1.5 shrink-0">
            <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden xs:inline truncate max-w-[110px] sm:max-w-[160px]">
              {currentUser?.name || currentUser?.email || currentCompany.name}
            </span>
          </Link>
          {breadcrumbs.length > 0 && <span className="text-slate-300 dark:text-slate-700">/</span>}
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={b.href}>
              {idx === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[100px] sm:max-w-none">{b.label}</span>
              ) : (
                <>
                  <Link href={b.href} className="hover:text-blue-600 transition-colors hidden sm:inline">{b.label}</Link>
                  <span className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
                </>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Center Search (Desktop / Tablet) */}
      <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-2 lg:mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search transactions, ref, parties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Right Actions & Utilities */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Mobile Search Toggle Button */}
        <button
          type="button"
          onClick={() => setIsSearchVisibleMobile(prev => !prev)}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Desktop Quick Transaction Actions */}
        <div className="hidden xl:flex items-center gap-1.5">
          <Link href="/transactions/cash-receipt">
            <Button size="sm" variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs py-1 px-2.5">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Cash Receipt</span>
            </Button>
          </Link>

          <Link href="/transactions/bank-payment">
            <Button size="sm" variant="outline" className="text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs py-1 px-2.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Bank Payment</span>
            </Button>
          </Link>

          <Link href="/transactions/transfer">
            <Button size="sm" variant="primary" className="text-xs py-1 px-2.5">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </Button>
          </Link>
        </div>

        {/* Compact Quick Action Dropdown for Tablets & Mobile */}
        <div className="relative xl:hidden">
          <Button 
            size="sm" 
            variant="primary" 
            onClick={() => setIsQuickActionsOpen(prev => !prev)}
            className="text-xs py-1.5 px-2 sm:px-3 gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Entry</span>
            <ChevronDown className="w-3 h-3" />
          </Button>

          {isQuickActionsOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <Link
                href="/transactions/cash-receipt"
                onClick={() => setIsQuickActionsOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span>Cash Receipt</span>
              </Link>
              <Link
                href="/transactions/cash-payment"
                onClick={() => setIsQuickActionsOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span>Cash Payment</span>
              </Link>
              <Link
                href="/transactions/bank-receipt"
                onClick={() => setIsQuickActionsOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ArrowDownLeft className="w-4 h-4 text-teal-600" />
                <span>Bank Receipt</span>
              </Link>
              <Link
                href="/transactions/bank-payment"
                onClick={() => setIsQuickActionsOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
                <span>Bank Payment</span>
              </Link>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <Link
                href="/transactions/transfer"
                onClick={() => setIsQuickActionsOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Transfer / Contra</span>
              </Link>
            </div>
          )}
        </div>

        {/* Theme Toggle (Dark / Light) */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* User Session Profile & Logout */}
        <div className="relative pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-700">
          {isAuthenticated && currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs border border-blue-500">
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
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
              <Button size="sm" variant="outline" className="text-xs gap-1.5 py-1 px-2.5">
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log In</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Search Dropdown Input Bar */}
      {isSearchVisibleMobile && (
        <div className="absolute top-16 left-0 right-0 p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 md:hidden z-20 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search transactions, ref, parties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}
    </header>
  );
}
