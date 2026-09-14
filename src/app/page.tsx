'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  Wallet, 
  Landmark, 
  Scale, 
  Lock, 
  Layers, 
  BarChart3, 
  CheckCircle2, 
  Sparkles, 
  FileSpreadsheet, 
  Users, 
  ArrowDownLeft, 
  ArrowUpRight,
  ChevronRight,
  Globe2,
  PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingHomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white flex flex-col relative overflow-hidden font-sans">
      {/* Dynamic ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-[600px] -left-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/25 border border-blue-400/30">
              CF
            </div>
            <div>
              <span className="font-black tracking-tight text-lg text-white block leading-tight">
                CashFlow <span className="text-blue-400">Manager</span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-semibold">
                Enterprise Treasury
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-blue-400 transition-colors">Key Features</a>
            <a href="#architecture" className="hover:text-blue-400 transition-colors">Double-Entry Core</a>
            <a href="#security" className="hover:text-blue-400 transition-colors">Security & Audit</a>
            <a href="#pricing" className="hover:text-blue-400 transition-colors">Platform</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm" className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-xs px-4">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 text-xs px-4">
                <span>Launch App</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-950/40 text-blue-400 text-xs font-medium mb-8 backdrop-blur-md animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Enterprise Double-Entry Accounting</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl leading-[1.1]">
          Total Financial Clarity for <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">Modern Treasuries</span>
        </h1>

        <p className="mt-6 text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl font-normal leading-relaxed">
          Manage cash drawers, bank transfers, parties, and contra entries with audit-grade double-entry ledger precision. Designed for enterprises, CFOs, and growing organizations.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-xl shadow-blue-600/25 px-8 py-3 text-sm flex items-center justify-center gap-2">
              <span>Enter Workspace Dashboard</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-semibold px-8 py-3 text-sm">
              Create Enterprise Account
            </Button>
          </Link>
        </div>

        {/* Floating Mockup Preview Card */}
        <div className="mt-16 w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/70 p-2 sm:p-4 shadow-2xl backdrop-blur-xl relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-indigo-600/5 to-emerald-600/10 rounded-2xl pointer-events-none" />
          
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-6 overflow-hidden">
            {/* Top Mockup Header Bar */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-500 ml-2">cashflow.treasury.app/dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync Active
                </span>
              </div>
            </div>

            {/* Dashboard metrics mock grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Total Liquid Balance</span>
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2 text-2xl font-bold font-mono text-white">₹ 14,85,420.00</div>
                <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <TrendingUp className="w-3 h-3" /> +12.4% vs last cycle
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Total Cash Receipts</span>
                  <ArrowDownLeft className="w-4 h-4 text-teal-400" />
                </div>
                <div className="mt-2 text-2xl font-bold font-mono text-white">₹ 8,92,100.00</div>
                <div className="mt-1 text-[11px] text-slate-400">148 verified entries</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Bank & Contra Payments</span>
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-2 text-2xl font-bold font-mono text-white">₹ 3,45,680.00</div>
                <div className="mt-1 text-[11px] text-slate-400">Balanced debit = credit</div>
              </div>
            </div>

            {/* Mock ledger row table */}
            <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden text-left text-xs font-mono">
              <div className="grid grid-cols-4 p-2.5 bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 text-[11px]">
                <div>Tx Number</div>
                <div>Counterparty / Account</div>
                <div>Type</div>
                <div className="text-right">Amount</div>
              </div>
              <div className="divide-y divide-slate-800/50">
                <div className="grid grid-cols-4 p-2.5 text-slate-300 items-center">
                  <span className="text-blue-400 font-bold">CR-000008</span>
                  <span className="font-sans text-slate-200">Personal Cash • Customer 570</span>
                  <span className="text-emerald-400 font-sans text-[10px] font-semibold">CASH RECEIPT</span>
                  <span className="text-right font-bold text-white">₹ 2,000.00</span>
                </div>
                <div className="grid grid-cols-4 p-2.5 text-slate-300 items-center">
                  <span className="text-blue-400 font-bold">BP-000002</span>
                  <span className="font-sans text-slate-200">HDFC Bank → Vendor Payment</span>
                  <span className="text-amber-400 font-sans text-[10px] font-semibold">BANK PAYMENT</span>
                  <span className="text-right font-bold text-white">₹ 15,400.00</span>
                </div>
                <div className="grid grid-cols-4 p-2.5 text-slate-300 items-center">
                  <span className="text-blue-400 font-bold">TR-000001</span>
                  <span className="font-sans text-slate-200">Main Cash → HDFC Bank</span>
                  <span className="text-indigo-400 font-sans text-[10px] font-semibold">CONTRA TRANSFER</span>
                  <span className="text-right font-bold text-white">₹ 50,000.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Section */}
      <section id="features" className="py-20 border-t border-slate-800/80 bg-slate-900/30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-mono tracking-widest text-blue-400 font-bold">Treasury Architecture</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-white">
              Built for Enterprise Accuracy & Unbreakable Books
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Every financial transaction enforces equal debit and credit balancing with complete audit trails.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Atomic Double-Entry Engine</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Receipts, payments, and contra transfers generate balanced debit & credit entries across cash registers and bank ledgers simultaneously.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Immutable Audit Trail</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Full compliance logging for edits, void actions with mandatory audit reasons, deletion records, and timestamps.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Real-Time Financial Reports</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Instant Day Book, Cash Book, Bank Book, and Comprehensive Financial Summary with 1-click Excel export and printable registers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Multi-Tenant Isolation */}
      <section id="security" className="py-20 border-t border-slate-800/80 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-xs font-semibold mb-4">
                <Lock className="w-3.5 h-3.5" />
                <span>Enterprise Data Isolation</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Row-Level Security & Encrypted Multi-Company Workspaces
              </h2>
              <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                Your financial records are isolated with Supabase Row-Level Security (RLS). Manage multiple subsidiaries, distinct legal entities, and custom party roles under a single unified dashboard.
              </p>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-300">End-to-end encrypted session authentication and recovery</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-300">Multi-tab live cloud synchronization via Supabase Realtime</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-300">Offline resilient caching for uninterrupted operations</span>
                </div>
              </div>

              <div className="mt-8">
                <Link href="/dashboard">
                  <Button className="bg-blue-600 hover:bg-blue-500 text-xs font-semibold px-6 py-2.5">
                    Launch Treasury Workspace
                  </Button>
                </Link>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Landmark className="w-5 h-5 text-blue-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Company & Entity Switching</h4>
                      <p className="text-[11px] text-slate-400">Switch between organizations with zero data overlap</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">RLS Isolated</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-purple-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Dynamic Parties & Ledgers</h4>
                      <p className="text-[11px] text-slate-400">Customers, Suppliers, Lenders, Borrowers & Custom Roles</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">Auto-Reconciled</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Compliance Export Suite</h4>
                      <p className="text-[11px] text-slate-400">Ready for auditor review, tax filings, and banking records</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">XLSX / PDF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="py-16 border-t border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-center px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Ready to Take Full Control of Your Cash & Bank?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Experience the double-entry accounting software designed for speed, clarity, and reliability.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 shadow-xl shadow-blue-600/30">
                <span>Launch Treasury Now</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="border-slate-800 text-slate-300 hover:text-white px-8">
                Sign In With Existing Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              CF
            </div>
            <span className="font-bold text-slate-300">CashFlow Manager</span>
            <span>— Enterprise Treasury & Double-Entry Accounting</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link>
            <Link href="/transactions" className="hover:text-slate-300 transition-colors">Transactions</Link>
            <Link href="/login" className="hover:text-slate-300 transition-colors">Security & Login</Link>
          </div>
          <p>© {new Date().getFullYear()} CashFlow Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
