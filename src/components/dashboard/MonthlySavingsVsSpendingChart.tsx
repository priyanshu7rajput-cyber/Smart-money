'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip,
  Cell
} from 'recharts';

export function MonthlySavingsVsSpendingChart() {
  const { transactions, currentCompany } = useApp();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const months = [
    { key: '01', name: 'January', color: '#c084fc' }, // violet-400
    { key: '02', name: 'February', color: '#a855f7' }, // purple-500
    { key: '03', name: 'March', color: '#f8fafc' }, // white / light
    { key: '04', name: 'April', color: '#93c5fd' }, // light blue
    { key: '05', name: 'May', color: '#22d3ee' }, // cyan
    { key: '06', name: 'June', color: '#06b6d4' }, // teal / cyan
    { key: '07', name: 'July', color: '#14b8a6' }, // teal
    { key: '08', name: 'August', color: '#10b981' }, // emerald
    { key: '09', name: 'September', color: '#6366f1' }, // indigo
    { key: '10', name: 'October', color: '#8b5cf6' }, // purple
    { key: '11', name: 'November', color: '#3b82f6' }, // blue
    { key: '12', name: 'December', color: '#1d4ed8' }, // dark blue
  ];

  // Calculate 100% dynamic data from live transactions for the current year
  const monthlyData = months.map((m) => {
    let dynamicReceipts = 0;
    let dynamicPayments = 0;

    transactions
      .filter(t => {
        if (t.status !== 'active' || !t.transaction_date) return false;
        // Match year and month (e.g. 2026-09 or current year)
        const d = t.transaction_date;
        return d.startsWith(`${selectedYear}-${m.key}`) || d.includes(`-${m.key}-`);
      })
      .forEach(tx => {
        // Calculate total amount from entries or tx.amount
        let amt = tx.amount || 0;
        if (!amt && tx.entries && tx.entries.length > 0) {
          amt = tx.entries.reduce((max, e) => Math.max(max, e.debit || 0, e.credit || 0), 0);
        }
        
        if (tx.transaction_type.includes('receipt')) {
          dynamicReceipts += amt;
        } else if (tx.transaction_type.includes('payment')) {
          dynamicPayments += amt;
        }
      });

    // Pure dynamic calculation based on real transactions:
    // Spending = Total Payments for the month
    // Savings = Total Receipts for the month (or net savings if payments exist)
    const spending = dynamicPayments;
    const savings = dynamicReceipts > 0 ? (dynamicPayments > 0 ? Math.max(0, dynamicReceipts - dynamicPayments) : dynamicReceipts) : 0;

    return {
      month: m.name,
      shortMonth: m.name.substring(0, 3),
      savings: savings,
      spending: spending,
      color: m.color,
    };
  });

  // Custom top label renderer on bars matching the reference design
  const renderBarTopLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (!value) return null;
    return (
      <text
        x={x + width / 2}
        y={y - 8}
        fill="#94a3b8"
        textAnchor="middle"
        fontSize={10}
        fontFamily="monospace"
        fontWeight="600"
      >
        {value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : value}
      </text>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#09090b] border border-slate-800 text-white shadow-2xl p-6 md:p-8">
      {/* Ambient background glow effects matching the uploaded mockup */}
      <div className="absolute -top-16 -left-16 w-56 h-56 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-16 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 left-1/3 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Title: Monthly Savings VS Spending */}
      <div className="relative z-10 text-center mb-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          <span className="text-white drop-shadow-sm">Monthly Savings</span>
          <span className="px-3 py-0.5 rounded-xl bg-white/10 text-slate-200 border border-white/15 text-lg sm:text-2xl font-black uppercase tracking-wider backdrop-blur-md">
            VS
          </span>
          <span className="bg-gradient-to-r from-purple-300 via-purple-200 to-indigo-300 bg-clip-text text-transparent drop-shadow-sm">
            Spending
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg mx-auto font-medium">
          Comprehensive cash preservation analytics & expenditure flow for {currentCompany.name}
        </p>
      </div>

      {/* Dual Comparative Panel Wrapper */}
      <div className="relative z-10 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-4 sm:p-6 shadow-inner">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative">
          {/* Subtle center dividing separator on large screens */}
          <div className="hidden lg:block absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent -translate-x-1/2" />

          {/* LEFT PANEL: SAVINGS */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="px-8 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-500/25 border border-purple-400/30">
                Savings
              </div>
            </div>

            <div className="h-72 sm:h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis 
                    dataKey="shortMonth" 
                    tickLine={false} 
                    axisLine={{ stroke: '#3f3f46' }} 
                    tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 500 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={{ stroke: '#3f3f46' }} 
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 border border-slate-700 text-white p-2.5 rounded-xl shadow-2xl text-xs backdrop-blur-md">
                            <p className="font-bold text-slate-200">{d.month} Savings</p>
                            <p className="font-mono text-purple-300 font-bold text-sm mt-0.5">
                              {formatCurrency(d.savings, currentCompany.currency, currentCompany.currency_symbol)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="savings"
                    radius={[6, 6, 0, 0]}
                    label={renderBarTopLabel}
                    animationDuration={1200}
                  >
                    {monthlyData.map((entry, index) => (
                      <Cell 
                        key={`savings-cell-${index}`} 
                        fill={entry.color} 
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT PANEL: SPENDING */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="px-8 py-1.5 rounded-full bg-gradient-to-r from-purple-500/80 to-indigo-500/80 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
                Spending
              </div>
            </div>

            <div className="h-72 sm:h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 25, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis 
                    dataKey="shortMonth" 
                    tickLine={false} 
                    axisLine={{ stroke: '#3f3f46' }} 
                    tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 500 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={{ stroke: '#3f3f46' }} 
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 border border-slate-700 text-white p-2.5 rounded-xl shadow-2xl text-xs backdrop-blur-md">
                            <p className="font-bold text-slate-200">{d.month} Spending</p>
                            <p className="font-mono text-rose-300 font-bold text-sm mt-0.5">
                              {formatCurrency(d.spending, currentCompany.currency, currentCompany.currency_symbol)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="spending"
                    radius={[6, 6, 0, 0]}
                    label={renderBarTopLabel}
                    animationDuration={1200}
                  >
                    {monthlyData.map((entry, index) => (
                      <Cell 
                        key={`spending-cell-${index}`} 
                        fill={entry.color} 
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Unified Legend Bar matching the colors in the user's uploaded mockup */}
        <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-slate-300 font-medium">
          {months.map((m) => (
            <div key={m.key} className="flex items-center gap-1.5">
              <span 
                className="w-2.5 h-2.5 rounded-sm shrink-0 shadow-xs" 
                style={{ backgroundColor: m.color }} 
              />
              <span>{m.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
