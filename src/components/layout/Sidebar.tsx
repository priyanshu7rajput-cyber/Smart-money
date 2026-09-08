'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Wallet, 
  Landmark, 
  ReceiptText, 
  BookOpen, 
  FileSpreadsheet, 
  Users, 
  Tags, 
  Settings, 
  ShieldCheck, 
  PlusCircle, 
  ArrowDownLeft, 
  ArrowUpRight,
  Building2,
  ChevronDown,
  LogOut,
  LogIn,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { currentCompany, companies, setCompany, currentUser, isAuthenticated, logout, isMobileSidebarOpen, setIsMobileSidebarOpen } = useApp();

  const navItems = [
    {
      group: 'Overview',
      items: [
        { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      ]
    },
    {
      group: 'Transactions',
      items: [
        { label: 'All Transactions', href: '/transactions', icon: ArrowLeftRight },
        { label: 'Cash Receipt', href: '/transactions/cash-receipt', icon: ArrowDownLeft },
        { label: 'Cash Payment', href: '/transactions/cash-payment', icon: ArrowUpRight },
        { label: 'Bank Receipt', href: '/transactions/bank-receipt', icon: ArrowDownLeft },
        { label: 'Bank Payment', href: '/transactions/bank-payment', icon: ArrowUpRight },
        { label: 'Transfer / Contra', href: '/transactions/transfer', icon: ArrowLeftRight },
      ]
    },
    {
      group: 'Master Accounts',
      items: [
        { label: 'Cash Accounts', href: '/accounts/cash', icon: Wallet },
        { label: 'Bank Accounts', href: '/accounts/bank', icon: Landmark },
        { label: 'Parties', href: '/accounts/parties', icon: Users },
        { label: 'Categories', href: '/accounts/categories', icon: Tags },
      ]
    },
    {
      group: 'Financial Reports',
      items: [
        { label: 'Cash Book', href: '/reports/cash-book', icon: BookOpen },
        { label: 'Bank Book', href: '/reports/bank-book', icon: BookOpen },
        { label: 'Account Ledger', href: '/reports/ledger', icon: ReceiptText },
        { label: 'Day Book', href: '/reports/day-book', icon: FileSpreadsheet },
        { label: 'Receipts & Payments', href: '/reports/summaries', icon: FileSpreadsheet },
      ]
    },
    {
      group: 'Settings & Compliance',
      items: [
        { label: 'Company Profile', href: '/settings/company', icon: Building2 },
        { label: 'Audit Logs', href: '/settings/audit-logs', icon: ShieldCheck },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside className={cn(
        "w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col h-screen fixed top-0 left-0 z-50 border-r border-slate-800 select-none transition-transform duration-300 ease-in-out",
        isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Brand Header with Close button for mobile */}
        <div className="px-5 py-4.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
              CF
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-tight leading-tight">CashFlow</h1>
              <p className="text-[11px] text-slate-400 font-medium">Enterprise Treasury</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Multi-Company / User Entity */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
        <label className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 block mb-1.5">
          Active Account / Entity
        </label>
        <div className="relative">
          {companies.some(c => c.id === currentCompany.id) ? (
            <select
              value={currentCompany.id}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-slate-800/90 text-xs text-slate-200 border border-slate-700/80 rounded-md py-2 px-2.5 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="w-full bg-slate-800/90 text-xs text-slate-200 border border-slate-700/80 rounded-md py-2 px-2.5 font-medium truncate">
              {currentCompany.name}
            </div>
          )}
          {companies.some(c => c.id === currentCompany.id) && (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          )}
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 px-0.5">
          <span>{currentCompany.tax_id || (currentUser?.email ? 'Personal Vault' : 'GST Registered')}</span>
          <span className="text-emerald-400 font-mono text-[10px]">Active</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {navItems.map((group, idx) => (
          <div key={idx}>
            <div className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              {group.group}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    scroll={false}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                      isActive
                        ? "bg-blue-600 text-white shadow-xs font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User & Logout Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        {isAuthenticated && currentUser ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs border border-blue-500 shadow-xs shrink-0">
                {currentUser.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left leading-tight truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Logout session"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Account</span>
          </Link>
        )}
      </div>
    </aside>
    </>
  );
}
