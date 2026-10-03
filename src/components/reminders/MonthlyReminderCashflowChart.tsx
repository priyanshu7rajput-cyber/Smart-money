'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PaymentReminder } from '@/types/database';
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
import { ArrowDownLeft, ArrowUpRight, TrendingUp, Sparkles } from 'lucide-react';

interface MonthlyReminderChartProps {
  reminders: PaymentReminder[];
  selectedMonth: string;
  onSelectMonth?: (monthKey: string) => void;
}

export function MonthlyReminderCashflowChart({ reminders, selectedMonth, onSelectMonth }: MonthlyReminderChartProps) {
  const { currentCompany } = useApp();
  const [activeMetric, setActiveMetric] = useState<'both' | 'to_collect' | 'to_pay'>('both');
  
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

  // Calculate monthly to_collect (lene hai) and to_pay (dene hai) from reminders
  const monthlyData = months.map((m) => {
    const monthPrefix = `${selectedYear}-${m.key}`;
    let toCollect = 0;
    let toPay = 0;
    let collectCount = 0;
    let payCount = 0;

    reminders.forEach((r) => {
      if (!r.due_date) return;
      // Match year and month
      if (r.due_date.startsWith(monthPrefix) || r.due_date.includes(`-${m.key}-`)) {
        const amt = Number(r.amount) || 0;
        if (r.reminder_type === 'to_collect') {
          toCollect += amt;
          collectCount++;
        } else if (r.reminder_type === 'to_pay') {
          toPay += amt;
          payCount++;
        }
      }
    });

    const isSelected = selectedMonth === monthPrefix || (selectedMonth.endsWith(`-${m.key}`));

    return {
      monthKey: monthPrefix,
      month: m.name,
      shortMonth: m.name.substring(0, 3),
      toCollect,
      toPay,
      collectCount,
      payCount,
      net: toCollect - toPay,
      color: m.color,
      isSelected,
    };
  });

  // Calculate totals for active year
  const totalYearCollect = monthlyData.reduce((sum, d) => sum + d.toCollect, 0);
  const totalYearPay = monthlyData.reduce((sum, d) => sum + d.toPay, 0);

  // Custom top label renderer on bars matching the reference design
  const renderBarTopLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (!value || value === 0) return null;
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
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#09090b] border border-slate-800 text-white shadow-2xl p-4 sm:p-6 md:p-8">
      {/* Ambient background glow effects matching the uploaded mockup */}
      <div className="absolute -top-16 -left-16 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-16 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 left-1/3 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Title Banner */}
      <div className="relative z-10 text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
          <span className="text-emerald-400 drop-shadow-sm flex items-center gap-2">
            <ArrowDownLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            To Collect
          </span>
          <span className="px-2.5 py-0.5 rounded-lg sm:rounded-xl bg-white/10 text-slate-200 border border-white/15 text-sm sm:text-2xl font-black uppercase tracking-wider backdrop-blur-md">
            VS
          </span>
          <span className="text-rose-400 drop-shadow-sm flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 sm:w-8 sm:h-8" />
            To Pay
          </span>
        </h2>
        <p className="text-[11px] sm:text-sm text-slate-400 mt-1.5 sm:mt-2 max-w-xl mx-auto font-medium px-2">
          Monthly breakdown of upcoming scheduled receivables and vendor payment obligations for {currentCompany.name}
        </p>
      </div>

      {/* Dual Comparative Panel Wrapper */}
      <div className="relative z-10 rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-3 sm:p-6 shadow-inner">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 relative">
          {/* Subtle center dividing separator on large screens */}
          <div className="hidden lg:block absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent -translate-x-1/2" />

          {/* LEFT PANEL: TO COLLECT */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col items-center gap-1.5">
              <div className="px-6 sm:px-8 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-500/25 border border-emerald-400/30 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4" />
                <span>To Collect</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono font-medium">
                Annual Pipeline: <strong className="text-emerald-400">{formatCurrency(totalYearCollect, currentCompany.currency)}</strong>
              </span>
            </div>

            <div className="h-56 sm:h-72 md:h-80 w-full pt-2 sm:pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 4, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis 
                    dataKey="shortMonth" 
                    tickLine={false} 
                    axisLine={{ stroke: '#3f3f46' }} 
                    tick={{ fill: '#a1a1aa', fontSize: 9, fontWeight: 500 }}
                    interval={0}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={{ stroke: '#3f3f46' }} 
                    tick={{ fill: '#71717a', fontSize: 9 }}
                    tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
                    width={35}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 border border-emerald-500/40 text-white p-2.5 sm:p-3 rounded-xl shadow-2xl text-xs backdrop-blur-md">
                            <p className="font-bold text-slate-200 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                              {d.month} Collection Target
                            </p>
                            <p className="font-mono text-emerald-400 font-bold text-sm mt-1">
                              {formatCurrency(d.toCollect, currentCompany.currency)}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {d.collectCount} reminder{d.collectCount === 1 ? '' : 's'} scheduled
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="toCollect"
                    radius={[4, 4, 0, 0]}
                    label={renderBarTopLabel}
                    animationDuration={1200}
                    onClick={(data: any) => {
                      if (onSelectMonth && data?.monthKey) {
                        onSelectMonth(data.monthKey);
                      }
                    }}
                  >
                    {monthlyData.map((entry, index) => (
                      <Cell 
                        key={`collect-cell-${index}`} 
                        fill={entry.color} 
                        opacity={entry.isSelected ? 1 : (entry.toCollect > 0 ? 0.9 : 0.25)}
                        stroke={entry.isSelected ? '#ffffff' : undefined}
                        strokeWidth={entry.isSelected ? 2 : 0}
                        className="hover:opacity-100 transition-all cursor-pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT PANEL: TO PAY */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col items-center gap-1.5">
              <div className="px-6 sm:px-8 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-rose-500/25 border border-rose-400/30 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" />
                <span>To Pay</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono font-medium">
                Annual Obligations: <strong className="text-rose-400">{formatCurrency(totalYearPay, currentCompany.currency)}</strong>
              </span>
            </div>

            <div className="h-56 sm:h-72 md:h-80 w-full pt-2 sm:pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 4, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis 
                    dataKey="shortMonth" 
                    tickLine={false} 
                    axisLine={{ stroke: '#3f3f46' }} 
                    tick={{ fill: '#a1a1aa', fontSize: 9, fontWeight: 500 }}
                    interval={0}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={{ stroke: '#3f3f46' }} 
                    tick={{ fill: '#71717a', fontSize: 9 }}
                    tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
                    width={35}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 border border-rose-500/40 text-white p-2.5 sm:p-3 rounded-xl shadow-2xl text-xs backdrop-blur-md">
                            <p className="font-bold text-slate-200 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                              {d.month} Payable Dues
                            </p>
                            <p className="font-mono text-rose-400 font-bold text-sm mt-1">
                              {formatCurrency(d.toPay, currentCompany.currency)}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {d.payCount} bill{d.payCount === 1 ? '' : 's'} scheduled
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="toPay"
                    radius={[4, 4, 0, 0]}
                    label={renderBarTopLabel}
                    animationDuration={1200}
                    onClick={(data: any) => {
                      if (onSelectMonth && data?.monthKey) {
                        onSelectMonth(data.monthKey);
                      }
                    }}
                  >
                    {monthlyData.map((entry, index) => (
                      <Cell 
                        key={`pay-cell-${index}`} 
                        fill={entry.color} 
                        opacity={entry.isSelected ? 1 : (entry.toPay > 0 ? 0.9 : 0.25)}
                        stroke={entry.isSelected ? '#ffffff' : undefined}
                        strokeWidth={entry.isSelected ? 2 : 0}
                        className="hover:opacity-100 transition-all cursor-pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Month Pills Legend & Quick Filter Selector */}
        <div className="mt-5 sm:mt-8 pt-3 sm:pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-300 font-medium">
          <button
            onClick={() => onSelectMonth && onSelectMonth('all')}
            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              selectedMonth === 'all'
                ? 'bg-white text-slate-950 font-bold shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-slate-400'
            }`}
          >
            All Months
          </button>
          {months.map((m) => {
            const monthKey = `${selectedYear}-${m.key}`;
            const isSelected = selectedMonth === monthKey || (selectedMonth.endsWith(`-${m.key}`));
            return (
              <button
                key={m.key}
                onClick={() => onSelectMonth && onSelectMonth(monthKey)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-white/20 text-white font-bold border border-white/30 shadow-xs' 
                    : 'bg-white/5 hover:bg-white/10 text-slate-400'
                }`}
              >
                <span 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: m.color }} 
                />
                <span>{m.name.substring(0, 3)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
