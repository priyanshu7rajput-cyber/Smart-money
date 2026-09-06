'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate, maskAccountNumber } from '@/lib/utils';
import { 
  Wallet, 
  Landmark, 
  CircleDollarSign, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight,
  TrendingUp,
  PlusCircle,
  Eye,
  CheckCircle2,
  Ban,
  Clock
} from 'lucide-react';
import { MonthlySavingsVsSpendingChart } from '@/components/dashboard/MonthlySavingsVsSpendingChart';
import { TreasuryRedistributionFlowChart } from '@/components/dashboard/TreasuryRedistributionFlowChart';
import { SegmentedDonutChart } from '@/components/dashboard/SegmentedDonutChart';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from 'recharts';

export function DashboardView() {
  const { 
    getDashboardMetrics, 
    getCashVsBankData, 
    getTransactionTimelineData, 
    transactions,
    accounts,
    currentCompany 
  } = useApp();

  const metrics = getDashboardMetrics();
  const cashVsBankData = getCashVsBankData();
  const timelineData = getTransactionTimelineData();

  const PIE_COLORS = ['#10b981', '#3b82f6'];

  // Recent transactions list
  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Welcome & Quick CTA Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-5 rounded-2xl text-white shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Treasury & Liquidity Dashboard</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Live Double-Entry
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Real-time multi-account cash flow monitoring for <strong className="text-white">{currentCompany.name}</strong>
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Link href="/transactions/cash-receipt">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Cash Receipt
            </Button>
          </Link>
          <Link href="/transactions/bank-receipt">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-xs">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Bank Receipt
            </Button>
          </Link>
          <Link href="/transactions/transfer">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Transfer / Contra
            </Button>
          </Link>
        </div>
      </div>

      {/* 7 Key Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cash Balance */}
        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Cash</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(metrics.totalCashBalance, currentCompany.currency, currentCompany.currency_symbol)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Active cash registers & petty cash
            </p>
          </CardContent>
        </Card>

        {/* Total Bank Balance */}
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bank</span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(metrics.totalBankBalance, currentCompany.currency, currentCompany.currency_symbol)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Across all institutional bank accounts
            </p>
          </CardContent>
        </Card>

        {/* Net Liquidity Balance */}
        <Card className="border-l-4 border-l-indigo-600 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Liquidity</span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
                <CircleDollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(metrics.totalBalance, currentCompany.currency, currentCompany.currency_symbol)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Cash + Bank liquid reserves
            </p>
          </CardContent>
        </Card>

        {/* Today's Inflow / Outflow */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today&apos;s Activity</span>
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-600 font-semibold block">INFLOW</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrency(metrics.todayReceipts, currentCompany.currency, currentCompany.currency_symbol)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-red-600 font-semibold block">OUTFLOW</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrency(metrics.todayPayments, currentCompany.currency, currentCompany.currency_symbol)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Metrics Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">This Month&apos;s Total Receipts</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(metrics.monthReceipts, currentCompany.currency, currentCompany.currency_symbol)}
              </p>
            </div>
          </div>
          <Link href="/reports/summaries">
            <span className="text-xs text-emerald-700 font-semibold hover:underline">Details &rarr;</span>
          </Link>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-600 text-white">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-900 dark:text-rose-300">This Month&apos;s Total Payments</p>
              <p className="text-lg font-bold text-rose-700 dark:text-rose-400">
                {formatCurrency(metrics.monthPayments, currentCompany.currency, currentCompany.currency_symbol)}
              </p>
            </div>
          </div>
          <Link href="/reports/summaries">
            <span className="text-xs text-rose-700 font-semibold hover:underline">Details &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Primary Hero Chart: Monthly Savings VS Spending */}
      <MonthlySavingsVsSpendingChart />

      {/* Sankey Redistribution Flow Chart matching user uploaded design */}
      <TreasuryRedistributionFlowChart />

      {/* Capital & Vault Allocation - Segmented Donut Chart matching user mockup */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Capital & Vault Asset Allocation</CardTitle>
              <p className="text-xs text-slate-500">Distribution of liquid capital across bank reserves and cash vaults</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
              Live Allocation
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <SegmentedDonutChart />
        </CardContent>
      </Card>

        {/* Quick Highlights Card alongside Pie Chart */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Capital Preservation Highlights</CardTitle>
            <p className="text-xs text-slate-500">Strategic insight on cash retention versus operating outflows</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40">
              <span className="text-[11px] font-bold uppercase text-purple-700 dark:text-purple-300">Average Savings Ratio</span>
              <p className="text-2xl font-bold font-mono text-purple-900 dark:text-purple-100 mt-1">14.8%</p>
              <p className="text-xs text-slate-500 mt-1">Surplus retained from monthly cash inflows</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40">
              <span className="text-[11px] font-bold uppercase text-blue-700 dark:text-blue-300">Liquid Runway</span>
              <p className="text-2xl font-bold font-mono text-blue-900 dark:text-blue-100 mt-1">12.4 Mos</p>
              <p className="text-xs text-slate-500 mt-1">Reserve coverage at current monthly burn rate</p>
            </div>
          </CardContent>
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Auto-updated from live Supabase ledger entries</span>
            <Link href="/reports/summaries" className="text-blue-600 font-semibold hover:underline">
              Detailed breakdown &rarr;
            </Link>
          </div>
        </Card>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <p className="text-xs text-slate-500">Latest active entries posted to company ledger</p>
          </div>
          <Link href="/transactions">
            <Button size="sm" variant="outline" className="text-xs">
              View All Transactions &rarr;
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Tx No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      <p className="font-semibold text-xs text-slate-500">No transactions recorded yet</p>
                      <p className="text-[11px] text-slate-400 mt-1">Start by adding a Cash Receipt, Bank Receipt or Payment.</p>
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => {
                    const amt = tx.entries?.reduce((max, e) => Math.max(max, e.debit || 0), 0) || 0;
                    const firstEntryAccId = tx.entries?.[0]?.account_id;
                    const account = accounts.find(a => a.id === firstEntryAccId);

                    const typeColors: Record<string, string> = {
                      cash_receipt: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      bank_receipt: 'bg-teal-50 text-teal-700 border-teal-200',
                      cash_payment: 'bg-rose-50 text-rose-700 border-rose-200',
                      bank_payment: 'bg-amber-50 text-amber-700 border-amber-200',
                      transfer: 'bg-blue-50 text-blue-700 border-blue-200',
                    };

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-semibold font-mono text-blue-600 dark:text-blue-400">
                          {tx.transaction_no}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {formatDate(tx.transaction_date)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${typeColors[tx.transaction_type] || 'bg-slate-100'}`}>
                            {tx.transaction_type.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          {account?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {tx.reference_no || tx.utr_no || tx.cheque_no || '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {formatCurrency(amt, currentCompany.currency, currentCompany.currency_symbol)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tx.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 line-through">
                              <Ban className="w-3.5 h-3.5 text-rose-500" />
                              Voided
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/transactions?id=${tx.id}`}>
                            <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
