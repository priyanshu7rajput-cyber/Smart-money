'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Sector, 
  Tooltip 
} from 'recharts';

export function SegmentedDonutChart() {
  const { accounts, currentCompany, getAccountBalance } = useApp();
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Collect active accounts with positive balance or proportional values
  const accountsWithBalances = accounts
    .filter(a => a.status === 'active')
    .map(acc => ({
      name: acc.name,
      type: acc.type,
      balance: Math.max(0, getAccountBalance(acc.id)),
    }))
    .filter(a => a.balance > 0);

  const totalBal = accountsWithBalances.reduce((sum, a) => sum + a.balance, 0);

  // Elegant pastel-to-vibrant color palette matching the user's reference donut:
  // Red/coral primary hero arc, warm yellow/cream, light pink, soft lavender, light periwinkle
  const SEGMENT_COLORS = [
    '#e11d48', // 0: Bold Coral/Red (matches '38' hero slice with badge)
    '#fed7aa', // 1: Warm Cream/Peach (matches '10,9')
    '#fce7f3', // 2: Soft Light Pink (matches '7,4')
    '#ede9fe', // 3: Soft Lavender (matches '4,1')
    '#e0e7ff', // 4: Light Periwinkle (matches '2,7')
    '#0d9488', // 5: Teal fallback
    '#38bdf8', // 6: Sky Blue fallback
  ];

  const chartData = accountsWithBalances.length > 0 
    ? accountsWithBalances.map((item, idx) => {
        const pct = totalBal > 0 ? (item.balance / totalBal) * 100 : 0;
        return {
          name: item.name,
          value: item.balance,
          percentage: Number(pct.toFixed(1)),
          type: item.type,
          color: SEGMENT_COLORS[idx % SEGMENT_COLORS.length],
        };
      })
    : [
        { name: 'HDFC Corporate Bank', value: 1040000, percentage: 56.5, type: 'bank', color: '#e11d48' },
        { name: 'ICICI Treasury Bank', value: 370000, percentage: 20.1, type: 'bank', color: '#fed7aa' },
        { name: 'SBI Overdraft Bank', value: 150000, percentage: 8.2, type: 'bank', color: '#fce7f3' },
        { name: 'Main Cash Register', value: 185000, percentage: 10.1, type: 'cash', color: '#ede9fe' },
        { name: 'Petty Cash Box', value: 95000, percentage: 5.2, type: 'cash', color: '#e0e7ff' },
      ];

  const currentActive = chartData[activeIndex] || chartData[0];

  // Custom rounded slice renderer with inside percentage text and dark badge
  const renderCustomSlice = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      index,
    } = props;

    const RADIAN = Math.PI / 180;
    // Midpoint radius for label placement
    const midRadius = innerRadius + (outerRadius - innerRadius) * 0.52;
    const midAngle = (startAngle + endAngle) / 2;
    const x = cx + midRadius * Math.cos(-midAngle * RADIAN);
    const y = cy + midRadius * Math.sin(-midAngle * RADIAN);

    const isPrimaryHero = index === 0;
    const isHovered = index === activeIndex;

    return (
      <g className="transition-all duration-300">
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={isHovered ? outerRadius + 4 : outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          cornerRadius={10} // Rounded segment edges matching the user's uploaded mockup
          className="cursor-pointer transition-all duration-200"
          onClick={() => setActiveIndex(index)}
        />

        {/* Value Label inside slice */}
        {isPrimaryHero ? (
          // Black pill badge inside the red slice (matching the '38' black pill in image)
          <g>
            <rect
              x={x - 14}
              y={y - 12}
              width={28}
              height={24}
              rx={6}
              fill="#000000"
              className="drop-shadow-md"
            />
            <text
              x={x}
              y={y + 4}
              textAnchor="middle"
              fill="#ffffff"
              fontSize={11}
              fontWeight="bold"
              fontFamily="monospace"
            >
              {Math.round(payload.percentage)}
            </text>
          </g>
        ) : (
          // Clean dark numeric percentage inside the slice (matching 10,9 / 7,4 / 4,1 / 2,7 in image)
          <text
            x={x}
            y={y + 4}
            textAnchor="middle"
            fill="#1e293b"
            fontSize={11}
            fontWeight="bold"
            fontFamily="monospace"
          >
            {payload.percentage > 4 ? String(payload.percentage).replace('.', ',') : ''}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-2">
      {/* Left List of Accounts with clean indicator dots */}
      <div className="space-y-3 w-full sm:w-5/12 text-xs">
        <div className="space-y-1 pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Selected Account</span>
          <p className="text-base font-bold text-slate-900 dark:text-slate-100">{currentActive.name}</p>
          <p className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
            {formatCurrency(currentActive.value, currentCompany.currency, currentCompany.currency_symbol)}
          </p>
          <span className="inline-block text-[10px] font-semibold text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
            {currentActive.type} • {currentActive.percentage}% allocation
          </span>
        </div>

        <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
          {chartData.map((item, idx) => (
            <div
              key={item.name}
              onClick={() => setActiveIndex(idx)}
              className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                idx === activeIndex 
                  ? 'bg-slate-100 dark:bg-slate-800 font-semibold' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-300 dark:border-slate-700"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-[11px]">{item.name}</span>
              </div>
              <span className="font-mono text-[11px] shrink-0 font-bold ml-2">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Rounded Segment Donut Chart */}
      <div className="w-full sm:w-7/12 h-64 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={95}
              paddingAngle={6} // Distinct visible gaps between segments like reference
              dataKey="value"
              shape={renderCustomSlice}
              onMouseEnter={(_, index) => setActiveIndex(index)}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-2 rounded-lg shadow-xl text-xs border border-slate-800">
                      <p className="font-bold">{d.name}</p>
                      <p className="font-mono text-rose-400 font-bold">
                        {formatCurrency(d.value, currentCompany.currency, currentCompany.currency_symbol)}
                      </p>
                      <p className="text-[10px] text-slate-400">{d.percentage}% of liquid capital</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label inside donut hole */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total</span>
          <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
            {currentCompany.currency_symbol} {(totalBal / 100000).toFixed(1)}L
          </span>
        </div>
      </div>
    </div>
  );
}
