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
import { Account, Party, Transaction } from '@/types/database';
import { formatCurrency, formatDate, maskAccountNumber } from '@/lib/utils';
import { PartyStatementModal } from '@/components/accounts/PartyStatementModal';
import { AccountStatementModal } from '@/components/accounts/AccountStatementModal';
import { Users, FileText, Wallet, Landmark, X as CloseIcon } from 'lucide-react';

export function TopNavbar() {
  const pathname = usePathname();
  const { 
    searchQuery, 
    setSearchQuery, 
    currentCompany, 
    currentUser, 
    parties,
    transactions,
    accounts,
    getPartyBalance,
    getAccountBalance,
    isAuthenticated, 
    logout, 
    theme, 
    toggleTheme,
    toggleMobileSidebar 
  } = useApp();
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isSearchVisibleMobile, setIsSearchVisibleMobile] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedStatementParty, setSelectedStatementParty] = useState<Party | null>(null);
  const [selectedStatementAccount, setSelectedStatementAccount] = useState<Account | null>(null);

  // Compute matched accounts, parties and transactions for autocomplete dropdown
  const normalizedQuery = (searchQuery || '').trim().toLowerCase();
  const cleanQuery = normalizedQuery.replace(/\s+/g, '');

  const matchedAccounts = cleanQuery
    ? accounts.filter((a) => {
        const cleanName = a.name.toLowerCase().replace(/\s+/g, '');
        const cleanBank = (a.bank_name || '').toLowerCase().replace(/\s+/g, '');
        const cleanAccNo = (a.account_number || '').replace(/\s+/g, '');
        const cleanType = (a.type || '').toLowerCase().replace(/\s+/g, '');
        return (
          a.name.toLowerCase().includes(normalizedQuery) ||
          cleanName.includes(cleanQuery) ||
          cleanBank.includes(cleanQuery) ||
          cleanAccNo.includes(cleanQuery) ||
          cleanType.includes(cleanQuery)
        );
      })
    : [];

  const matchedParties = cleanQuery
    ? parties.filter((p) => {
        const cleanName = p.name.toLowerCase().replace(/\s+/g, '');
        const cleanPhone = (p.phone || '').replace(/\s+/g, '');
        const cleanType = (p.type || '').toLowerCase().replace(/\s+/g, '');
        return (
          p.name.toLowerCase().includes(normalizedQuery) ||
          cleanName.includes(cleanQuery) ||
          cleanPhone.includes(cleanQuery) ||
          cleanType.includes(cleanQuery)
        );
      })
    : [];

  const matchedTransactions = cleanQuery
    ? transactions
        .filter((t) => {
          const cleanNo = t.transaction_no.toLowerCase().replace(/\s+/g, '');
          const cleanRef = (t.reference_no || t.utr_no || t.cheque_no || '').toLowerCase().replace(/\s+/g, '');
          const cleanNarr = (t.narration || '').toLowerCase().replace(/\s+/g, '');
          return (
            cleanNo.includes(cleanQuery) ||
            cleanRef.includes(cleanQuery) ||
            cleanNarr.includes(cleanQuery)
          );
        })
        .slice(0, 4)
    : [];

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
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors font-semibold flex items-center gap-1.5 shrink-0">
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
      <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-2 lg:mx-4 relative">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search parties, transactions, ref..."
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchFocused(true);
            }}
            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchFocused(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Global Live Autocomplete Search Results Dropdown */}
        {isSearchFocused && cleanQuery && (
          <>
            {/* Backdrop click to dismiss */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsSearchFocused(false)} 
            />
            
            <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 max-h-[420px] overflow-y-auto">
              {/* Accounts Section */}
              {matchedAccounts.length > 0 && (
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center justify-between">
                    <span>Accounts / Ledgers ({matchedAccounts.length})</span>
                    <span className="text-[9px] text-slate-400 font-normal">Click to view statement</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedAccounts.map((a) => {
                      const bal = getAccountBalance(a.id);
                      const isCash = a.type === 'cash';
                      return (
                        <div
                          key={a.id}
                          onClick={() => {
                            setSelectedStatementAccount(a);
                            setIsSearchFocused(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-blue-50/70 dark:hover:bg-blue-950/40 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isCash 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' 
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                            }`}>
                              {isCash ? <Wallet className="w-3.5 h-3.5" /> : <Landmark className="w-3.5 h-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">
                                {a.name}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                <span className="font-medium text-slate-500 uppercase">{a.type}</span>
                                {a.bank_name && <span>• {a.bank_name}</span>}
                                {a.account_number && <span>• {maskAccountNumber(a.account_number)}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">Balance</span>
                            <span className={`font-mono text-xs font-bold ${bal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {formatCurrency(bal, currentCompany.currency, currentCompany.currency_symbol)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Parties Section */}
              {matchedParties.length > 0 && (
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center justify-between">
                    <span>Parties / Entities ({matchedParties.length})</span>
                    <span className="text-[9px] text-slate-400 font-normal">Click to view statement</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedParties.map((p) => {
                      const bal = getPartyBalance(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedStatementParty(p);
                            setIsSearchFocused(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-purple-50/70 dark:hover:bg-purple-950/40 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 flex items-center justify-center shrink-0">
                              <Users className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-purple-600 transition-colors">
                                {p.name}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                <span className="font-medium text-slate-500">{p.type}</span>
                                {p.phone && <span>• {p.phone}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">Balance</span>
                            <span className={`font-mono text-xs font-bold ${bal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {formatCurrency(bal, currentCompany.currency, currentCompany.currency_symbol)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Transactions Section */}
              {matchedTransactions.length > 0 && (
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Transactions
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedTransactions.map((tx) => {
                      const amt = tx.amount || tx.entries?.reduce((max, e) => Math.max(max, e.debit || 0), 0) || 0;
                      return (
                        <Link
                          key={tx.id}
                          href={`/transactions?id=${tx.id}`}
                          onClick={() => setIsSearchFocused(false)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                                {tx.transaction_no}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500 uppercase">
                                {tx.transaction_type.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {formatDate(tx.transaction_date)} {tx.narration ? `• ${tx.narration}` : ''}
                            </p>
                          </div>

                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 shrink-0">
                            {formatCurrency(amt, currentCompany.currency, currentCompany.currency_symbol)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {matchedAccounts.length === 0 && matchedParties.length === 0 && matchedTransactions.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  No accounts, parties, or transactions matching &ldquo;<span className="font-semibold text-slate-700 dark:text-slate-300">{searchQuery}</span>&rdquo;
                </div>
              )}
            </div>
          </>
        )}
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

        {/* Quick Action Dropdown for All Screens (Desktop, Laptop, Tablet & Mobile) */}
        <div className="relative">
          <Button 
            size="sm" 
            variant="primary" 
            onClick={() => setIsQuickActionsOpen(prev => !prev)}
            className="text-xs py-1.5 px-2.5 sm:px-3 gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">New Entry</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${isQuickActionsOpen ? 'rotate-180' : ''}`} />
          </Button>

          {isQuickActionsOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
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
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <Link
                href="/reminders"
                onClick={() => setIsQuickActionsOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              >
                <FileText className="w-4 h-4" />
                <span>Payment Reminders</span>
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
              placeholder="Search parties, transactions, ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile Search Results */}
          {cleanQuery && (
            <div className="mt-2 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl p-1 text-xs">
              {matchedAccounts.map((a) => {
                const bal = getAccountBalance(a.id);
                return (
                  <div
                    key={a.id}
                    onClick={() => {
                      setSelectedStatementAccount(a);
                      setIsSearchVisibleMobile(false);
                    }}
                    className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-white dark:hover:bg-slate-900 rounded-lg"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{a.name}</p>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">{a.type} {a.bank_name ? `• ${a.bank_name}` : ''}</span>
                    </div>
                    <span className={`font-mono text-xs font-bold ${bal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(bal, currentCompany.currency, currentCompany.currency_symbol)}
                    </span>
                  </div>
                );
              })}

              {matchedParties.map((p) => {
                const bal = getPartyBalance(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedStatementParty(p);
                      setIsSearchVisibleMobile(false);
                    }}
                    className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-white dark:hover:bg-slate-900 rounded-lg"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                      <span className="text-[10px] text-slate-400">{p.type} • Click to view statement</span>
                    </div>
                    <span className={`font-mono text-xs font-bold ${bal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(bal, currentCompany.currency, currentCompany.currency_symbol)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Account Statement Modal */}
      {selectedStatementAccount && (
        <AccountStatementModal
          account={selectedStatementAccount}
          isOpen={Boolean(selectedStatementAccount)}
          onClose={() => setSelectedStatementAccount(null)}
        />
      )}

      {/* Party Statement Modal */}
      {selectedStatementParty && (
        <PartyStatementModal
          party={selectedStatementParty}
          isOpen={Boolean(selectedStatementParty)}
          onClose={() => setSelectedStatementParty(null)}
        />
      )}
    </header>
  );
}
