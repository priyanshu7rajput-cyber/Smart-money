'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  Wallet, 
  Landmark, 
  Scale, 
  Lock, 
  BarChart3, 
  CheckCircle2, 
  Sparkles, 
  FileSpreadsheet, 
  Users, 
  ArrowDownLeft, 
  ArrowUpRight,
  ChevronRight,
  Menu,
  X,
  Zap,
  RefreshCw,
  Clock,
  Shield,
  Layers,
  ChevronDown,
  Building2,
  Receipt,
  FileCheck2,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingHomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'receipts' | 'payments' | 'contra'>('all');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const mockTxData = [
    { id: 'CR-000412', party: 'Alpha Corp Retail (Cust 570)', category: 'Direct Sales', type: 'receipt', typeLabel: 'CASH RECEIPT', amount: '₹ 45,000.00', status: 'Reconciled', time: '10 mins ago' },
    { id: 'BP-000189', party: 'HDFC Bank → Vendor Solutions', category: 'Vendor Settlement', type: 'payment', typeLabel: 'BANK PAYMENT', amount: '₹ 1,28,400.00', status: 'Verified', time: '35 mins ago' },
    { id: 'TR-000094', party: 'Store Main Vault → ICICI Current A/C', category: 'Contra Cash Deposit', type: 'contra', typeLabel: 'CONTRA TRANSFER', amount: '₹ 75,000.00', status: 'Balanced', time: '1 hr ago' },
    { id: 'CP-000305', party: 'Office Logistics & Utilities', category: 'Office Overhead', type: 'payment', typeLabel: 'CASH PAYMENT', amount: '₹ 4,850.00', status: 'Audited', time: '2 hrs ago' },
    { id: 'BR-000067', party: 'Global Gateway Stripe → Bank A/C', category: 'Client Remittance', type: 'receipt', typeLabel: 'BANK RECEIPT', amount: '₹ 2,40,000.00', status: 'Reconciled', time: '4 hrs ago' },
  ];

  const filteredTx = activeTab === 'all' 
    ? mockTxData 
    : mockTxData.filter(t => t.type === (activeTab === 'receipts' ? 'receipt' : activeTab === 'payments' ? 'payment' : 'contra'));

  const faqs = [
    {
      q: 'How does the atomic double-entry bookkeeping engine protect against imbalances?',
      a: 'Every single receipt, payment, or contra transfer automatically creates balancing debit and credit entries simultaneously in a single database transaction. Ledgers can never drift out of balance.'
    },
    {
      q: 'Can multiple branches or legal entities be isolated?',
      a: 'Yes. With native multi-company architecture and Row-Level Security (RLS), your data, chart of accounts, users, and audit logs are strictly partitioned per workspace.'
    },
    {
      q: 'Does it support export to Excel, CSV, and printer-ready PDF reports?',
      a: 'Yes. Generate one-click Day Books, Cash Books, Bank Ledgers, and Party Account Summaries with customizable date filters and instant export.'
    },
    {
      q: 'Can I track voided or deleted entries for audit compliance?',
      a: 'Every modification, void action, or deletion requires an audit reason and is timestamped with immutable history logs accessible to authorized auditors.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white flex flex-col relative overflow-x-hidden font-sans">
      {/* Dynamic ambient background glow and subtle grid */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[550px] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[500px] -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-[900px] -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/25 border border-blue-400/30 group-hover:scale-105 transition-transform">
              CF
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-base sm:text-lg text-white block leading-tight">
                CashFlow <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Manager</span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-semibold block">
                Enterprise Treasury
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-blue-400 transition-colors">Core Features</a>
            <a href="#preview" className="hover:text-blue-400 transition-colors">Live Dashboard</a>
            <a href="#security" className="hover:text-blue-400 transition-colors">Security & Audit</a>
            <a href="#faq" className="hover:text-blue-400 transition-colors">FAQ</a>
          </nav>

          {/* Action buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm" className="border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs px-4 h-9 font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 text-xs px-4 h-9 font-semibold">
                <span>Launch App</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu drop panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-300 pb-3 border-b border-slate-800">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-slate-900 hover:text-blue-400 transition-colors"
              >
                Core Features
              </a>
              <a 
                href="#preview" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-slate-900 hover:text-blue-400 transition-colors"
              >
                Live Dashboard
              </a>
              <a 
                href="#security" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-slate-900 hover:text-blue-400 transition-colors"
              >
                Security & Audit
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-slate-900 hover:text-blue-400 transition-colors"
              >
                FAQ
              </a>
            </nav>
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button variant="outline" className="w-full justify-center border-slate-800 bg-slate-900 text-slate-200">
                  Sign In
                </Button>
              </Link>
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button className="w-full justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-600/30">
                  <span>Enter Workspace</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Release badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-950/40 text-blue-400 text-xs font-semibold mb-6 sm:mb-8 backdrop-blur-md shadow-inner shadow-blue-500/10">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Double-Entry Precision • Enterprise Treasury Suite</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl leading-[1.12]">
          Total Financial Clarity for <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
            Modern Enterprise Treasuries
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 sm:mt-6 text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl font-normal leading-relaxed px-2">
          Manage cash drawers, bank accounts, contra transfers, and vendor/customer balances with zero drift. Built with atomic double-entry bookkeeping and tamper-resistant audit logs.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 w-full sm:w-auto px-4">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-xl shadow-blue-600/25 px-8 py-3.5 text-sm sm:text-base flex items-center justify-center gap-2 rounded-xl">
              <span>Launch Treasury Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-800 bg-slate-900/70 hover:bg-slate-800 text-slate-200 font-semibold px-8 py-3.5 text-sm sm:text-base rounded-xl">
              Sign In to Organization
            </Button>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Supabase RLS Protected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-blue-400" />
            <span>Real-time Live Sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-purple-400" />
            <span>Always Balanced (Debit = Credit)</span>
          </div>
        </div>

        {/* Interactive Floating Mockup Preview Card */}
        <div id="preview" className="mt-12 sm:mt-16 w-full max-w-5xl rounded-2xl sm:rounded-3xl border border-slate-800/90 bg-slate-900/60 p-2 sm:p-4 shadow-2xl backdrop-blur-2xl relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-indigo-600/5 to-emerald-600/10 rounded-2xl sm:rounded-3xl pointer-events-none" />
          
          <div className="rounded-xl sm:rounded-2xl border border-slate-800/80 bg-slate-950 p-3 sm:p-6 overflow-hidden text-left">
            {/* Mockup Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] sm:text-xs font-mono text-slate-400 ml-2 truncate">
                  cashflow.app/workspace/ledger-live
                </span>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Realtime Engine Online
                </span>
              </div>
            </div>

            {/* Dashboard metrics mock grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Total Liquid Balance</span>
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white">₹ 14,85,420.00</div>
                <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <TrendingUp className="w-3 h-3" /> +12.4% vs last period
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Cash & Bank Inflow</span>
                  <ArrowDownLeft className="w-4 h-4 text-teal-400" />
                </div>
                <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white">₹ 8,92,100.00</div>
                <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
                  <Receipt className="w-3 h-3 text-slate-400" /> 148 verified transactions
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Disbursements & Transfers</span>
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white">₹ 3,45,680.00</div>
                <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Double-entry balanced
                </div>
              </div>
            </div>

            {/* Filter Tabs for interactive preview */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-[11px] font-medium overflow-x-auto">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-md transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  All Entries
                </button>
                <button
                  onClick={() => setActiveTab('receipts')}
                  className={`px-3 py-1 rounded-md transition-all whitespace-nowrap ${activeTab === 'receipts' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  Receipts
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`px-3 py-1 rounded-md transition-all whitespace-nowrap ${activeTab === 'payments' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  Payments
                </button>
                <button
                  onClick={() => setActiveTab('contra')}
                  className={`px-3 py-1 rounded-md transition-all whitespace-nowrap ${activeTab === 'contra' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  Contra
                </button>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                <Clock className="w-3 h-3" /> Live Feed
              </span>
            </div>

            {/* Responsive Ledger Table / Cards */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden text-xs">
              {/* Desktop Header */}
              <div className="hidden md:grid grid-cols-12 p-3 bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider font-mono">
                <div className="col-span-2">Tx Number</div>
                <div className="col-span-4">Counterparty / Ledger</div>
                <div className="col-span-3">Type & Status</div>
                <div className="col-span-3 text-right">Amount</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-800/60">
                {filteredTx.map((tx) => (
                  <div key={tx.id} className="p-3 hover:bg-slate-800/30 transition-colors">
                    {/* Desktop View */}
                    <div className="hidden md:grid grid-cols-12 items-center">
                      <div className="col-span-2">
                        <span className="text-blue-400 font-mono font-bold">{tx.id}</span>
                        <div className="text-[10px] text-slate-500">{tx.time}</div>
                      </div>
                      <div className="col-span-4">
                        <div className="font-semibold text-slate-200">{tx.party}</div>
                        <div className="text-[11px] text-slate-400">{tx.category}</div>
                      </div>
                      <div className="col-span-3 flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          tx.type === 'receipt' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' :
                          tx.type === 'payment' ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60' :
                          'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60'
                        }`}>
                          {tx.typeLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{tx.status}</span>
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="font-mono font-bold text-white text-sm">{tx.amount}</span>
                      </div>
                    </div>

                    {/* Mobile View Card */}
                    <div className="md:hidden flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-400 font-mono font-bold text-xs">{tx.id}</span>
                        <span className="font-mono font-bold text-white">{tx.amount}</span>
                      </div>
                      <div className="text-slate-200 font-medium text-xs">{tx.party}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span className={`font-semibold px-1.5 py-0.5 rounded ${
                          tx.type === 'receipt' ? 'bg-emerald-950 text-emerald-300' :
                          tx.type === 'payment' ? 'bg-amber-950 text-amber-300' :
                          'bg-indigo-950 text-indigo-300'
                        }`}>
                          {tx.typeLabel}
                        </span>
                        <span>{tx.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats counter band */}
      <section className="border-y border-slate-800/80 bg-slate-900/40 py-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-2xl sm:text-4xl font-black font-mono text-white">100%</div>
              <div className="text-xs text-slate-400 font-medium">Double-Entry Balanced</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-4xl font-black font-mono text-blue-400">0 ms</div>
              <div className="text-xs text-slate-400 font-medium">Drift Between Accounts</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-4xl font-black font-mono text-emerald-400">RLS</div>
              <div className="text-xs text-slate-400 font-medium">Database-Level Isolation</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-4xl font-black font-mono text-purple-400">1-Click</div>
              <div className="text-xs text-slate-400 font-medium">Auditor Excel & PDF Exports</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Section */}
      <section id="features" className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-950/30 text-blue-400 text-xs font-semibold mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>Architected For Scale</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Built for Enterprise Accuracy & Unbreakable Books
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
              Every financial transaction enforces strict debit and credit balancing with automated party ledger tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md hover:border-blue-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition-transform">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                Atomic Double-Entry Engine
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Receipts, payments, and contra transfers generate balanced debit and credit entries across cash registers and bank accounts simultaneously.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                Immutable Audit Trail
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Full compliance logging for edits, void actions with mandatory audit reasons, deletion archives, and user timestamps.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md hover:border-purple-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                Real-Time Financial Reports
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Instant Day Book, Cash Book, Bank Book, and Comprehensive Financial Summary with 1-click Excel export and printable registers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Multi-Tenant Isolation */}
      <section id="security" className="py-20 sm:py-28 border-t border-slate-800/80 bg-slate-950/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-xs font-semibold mb-4">
                <Lock className="w-3.5 h-3.5" />
                <span>Enterprise Data Isolation</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Row-Level Security & Encrypted Multi-Company Workspaces
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed">
                Your financial records are strictly isolated using Supabase Row-Level Security (RLS). Manage subsidiaries, distinct legal companies, and customizable party roles under a single unified dashboard.
              </p>
              
              <div className="mt-6 space-y-3.5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-slate-300">
                    End-to-end encrypted session authentication and password recovery
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-slate-300">
                    Multi-tab live cloud synchronization via Supabase Realtime channels
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-slate-300">
                    Audit logs recording user identity, action type, IP context, and timestamps
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/25">
                    Launch Treasury Workspace
                  </Button>
                </Link>
              </div>
            </div>

            <div className="p-5 sm:p-7 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Company & Entity Switching</h4>
                    <p className="text-[11px] sm:text-xs text-slate-400">Switch between organizations with zero data leakage</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 whitespace-nowrap">
                  RLS Isolated
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-800/60 text-purple-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Dynamic Parties & Ledgers</h4>
                    <p className="text-[11px] sm:text-xs text-slate-400">Customers, Suppliers, Lenders, Borrowers & Custom Roles</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 whitespace-nowrap">
                  Auto-Reconciled
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Compliance Export Suite</h4>
                    <p className="text-[11px] sm:text-xs text-slate-400">Ready for auditor reviews, tax filings, and banking records</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 whitespace-nowrap">
                  XLSX / PDF
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 border-t border-slate-800/80 bg-slate-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Frequently Asked Questions</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">Everything you need to know about CashFlow Manager</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 hover:bg-slate-800/40"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-200">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-blue-400' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-400 border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="py-16 sm:py-20 border-t border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-center px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-950/40 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready in under 2 minutes</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Take Full Control of Your Cash & Bank Books Today
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Experience double-entry accounting software designed for speed, clarity, compliance, and multi-tenant reliability.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 py-3 rounded-xl shadow-xl shadow-blue-600/30 text-sm">
                <span>Launch Treasury Now</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-800 bg-slate-900/70 text-slate-300 hover:text-white px-8 py-3 rounded-xl text-sm">
                Sign In With Existing Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              CF
            </div>
            <span className="font-bold text-slate-300">CashFlow Manager</span>
            <span className="hidden sm:inline">— Enterprise Treasury & Double-Entry Accounting</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-slate-400 font-medium">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/transactions" className="hover:text-white transition-colors">Transactions</Link>
            <Link href="/reports" className="hover:text-white transition-colors">Reports</Link>
            <Link href="/login" className="hover:text-white transition-colors">Security & Login</Link>
          </div>
          <p>© {new Date().getFullYear()} CashFlow Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
