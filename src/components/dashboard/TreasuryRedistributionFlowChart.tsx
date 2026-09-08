'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import { 
  ArrowLeftRight, 
  MoreHorizontal, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

interface SankeyFlow {
  id: string;
  sourceCategory: string;
  targetProgram: string;
  amount: number;
  sourcePercent: number;
  targetPercent: number;
  color: string;
  d: string;
  labelY: number;
  withdrawalPct: string;
  depositingPct: string;
}

export function TreasuryRedistributionFlowChart() {
  const { currentCompany } = useApp();
  const [activeFlowId, setActiveFlowId] = useState<string | null>('flow-env');

  // Programs & categories matching the financial redistribution motif
  const programs = [
    { name: 'Community services', color: '#6366f1' }, // indigo
    { name: 'Healthcare area', color: '#818cf8' }, // light indigo / violet
    { name: 'Environment & Tech', color: '#14b8a6' }, // teal
    { name: 'Economic justice', color: '#38bdf8' }, // light blue
    { name: 'Learning and education', color: '#86efac' }, // mint / emerald
  ];

  // SVG dimensions
  const svgWidth = 560;
  const svgHeight = 280;

  // Flows path coordinates connecting left pillars (54% top, 46% bottom) to right pillars (58% top, 24% middle, 18% bottom)
  // Left side: X = 50. Top pillar: Y 10 to 140. Bottom pillar: Y 160 to 270.
  // Right side: X = 510. Top pillar: Y 10 to 150. Middle pillar: Y 165 to 225. Bottom pillar: Y 235 to 275.
  const flows: SankeyFlow[] = [
    {
      id: 'flow-comm',
      sourceCategory: 'Operating Vault Reserves',
      targetProgram: 'Community services',
      amount: 162.3,
      sourcePercent: 54,
      targetPercent: 61,
      color: '#475569',
      d: 'M 50,20 C 260,20 300,30 510,30 L 510,75 C 300,75 260,60 50,60 Z',
      labelY: 35,
      withdrawalPct: '-12%',
      depositingPct: '+52%',
    },
    {
      id: 'flow-env',
      sourceCategory: 'Operating Vault Reserves',
      targetProgram: 'Environment & Tech',
      amount: 37.4,
      sourcePercent: 54,
      targetPercent: 41,
      color: '#0d9488', // Highlighted teal flow exactly like the user's image
      d: 'M 50,75 C 220,75 320,180 510,185 L 510,210 C 320,205 220,95 50,95 Z',
      labelY: 90,
      withdrawalPct: '-9%',
      depositingPct: '+41%',
    },
    {
      id: 'flow-econ',
      sourceCategory: 'Operating Vault Reserves',
      targetProgram: 'Healthcare area',
      amount: 127.1,
      sourcePercent: 54,
      targetPercent: 39,
      color: '#334155',
      d: 'M 50,105 C 240,105 310,110 510,110 L 510,145 C 310,145 240,135 50,135 Z',
      labelY: 120,
      withdrawalPct: '-15%',
      depositingPct: '+36%',
    },
    {
      id: 'flow-learn',
      sourceCategory: 'Strategic Reserve Funds',
      targetProgram: 'Learning and education',
      amount: 45.3,
      sourcePercent: 46,
      targetPercent: 59,
      color: '#1e293b',
      d: 'M 50,175 C 230,175 320,245 510,250 L 510,270 C 320,265 230,195 50,195 Z',
      labelY: 185,
      withdrawalPct: '-8%',
      depositingPct: '+48%',
    },
    {
      id: 'flow-infra',
      sourceCategory: 'Strategic Reserve Funds',
      targetProgram: 'Economic justice',
      amount: 32.9,
      sourcePercent: 46,
      targetPercent: 52,
      color: '#1e293b',
      d: 'M 50,215 C 240,215 310,225 510,228 L 510,240 C 310,237 240,227 50,227 Z',
      labelY: 220,
      withdrawalPct: '-6%',
      depositingPct: '+28%',
    }
  ];

  const activeFlow = flows.find(f => f.id === activeFlowId) || flows[1];

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#121316] border border-slate-800/90 text-white shadow-2xl p-4 sm:p-6 md:p-8">
      {/* Header bar matching the user mockup */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <button className="text-slate-400 hover:text-white p-1 rounded-md shrink-0">
            <Layers className="w-5 h-5" />
          </button>
          <div className="flex items-baseline gap-1.5 sm:gap-2 truncate">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
              Redistribution by program
            </h3>
            <span className="text-slate-400 text-xs sm:text-sm font-semibold shrink-0">/ {currentCompany.currency_symbol}M</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <button className="p-1.5 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:text-white hover:bg-white/5 rounded-lg transition-colors bg-white/5 text-slate-200">
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 -mt-2 sm:-mt-3 mb-5 sm:mb-6">
        Strategic grant-making and fund redistribution approach ensuring capital reaches active programs
      </p>

      {/* Main Content Layout: Left KPI Column + Center/Right Interactive Sankey Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Big KPIs & Program Legend */}
        <div className="lg:col-span-4 space-y-6">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
              429.43
            </div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Redistributed</div>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
              487.28
            </div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Total amount</div>
          </div>

          {/* Color Dots Legend */}
          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            {programs.map(p => (
              <div key={p.name} className="flex items-center gap-2.5 text-xs text-slate-300">
                <span 
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
                  style={{ backgroundColor: p.color }}
                />
                <span className="truncate">{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Area: Interactive Sankey Flow Diagram */}
        <div className="lg:col-span-8 relative flex justify-center">
          <div className="relative w-full max-w-[620px]">
            {/* SVG Canvas for Flow Bands */}
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                {/* Custom Gradient for Active Flow */}
                <linearGradient id="tealFlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.95" />
                </linearGradient>
                <linearGradient id="purpleFlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3730a3" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="mutedFlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#334155" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#1e293b" stopOpacity="0.5" />
                </linearGradient>
              </defs>

              {/* Render Background Flow Ribbon Paths */}
              {flows.map(flow => {
                const isSelected = flow.id === activeFlowId;
                return (
                  <path
                    key={flow.id}
                    d={flow.d}
                    fill={isSelected ? 'url(#tealFlowGradient)' : flow.id === 'flow-comm' ? 'url(#purpleFlowGradient)' : 'url(#mutedFlowGradient)'}
                    className={`transition-all duration-300 cursor-pointer ${
                      isSelected 
                        ? 'opacity-100 filter drop-shadow(0 4px 12px rgba(20, 184, 166, 0.4))' 
                        : 'opacity-60 hover:opacity-90'
                    }`}
                    onClick={() => setActiveFlowId(flow.id)}
                  />
                );
              })}

              {/* Source Flow Amounts Along Left Ribbon Paths */}
              <text x="65" y="30" fill="#94a3b8" fontSize="11" fontFamily="monospace">$162,3M</text>
              <text 
                x="65" 
                y="90" 
                fill="#ffffff" 
                fontSize="12" 
                fontWeight="bold" 
                fontFamily="monospace"
                className="drop-shadow-sm"
              >
                $37.4M
              </text>
              <text x="65" y="125" fill="#64748b" fontSize="10" fontFamily="monospace">$34.5M</text>
              <text x="65" y="145" fill="#64748b" fontSize="10" fontFamily="monospace">$127.1M</text>
              
              <text x="65" y="200" fill="#94a3b8" fontSize="11" fontFamily="monospace">$45,3M</text>
              <text x="65" y="250" fill="#64748b" fontSize="10" fontFamily="monospace">$32,9M</text>

              {/* Target Side Percentages (Right) */}
              <text x="445" y="32" fill="#94a3b8" fontSize="11">61%</text>
              <text x="445" y="120" fill="#64748b" fontSize="11">39%</text>
              <text x="445" y="185" fill="#14b8a6" fontSize="12" fontWeight="bold">41%</text>
              <text x="445" y="220" fill="#64748b" fontSize="11">59%</text>
              <text x="445" y="245" fill="#64748b" fontSize="11">48%</text>
              <text x="445" y="270" fill="#64748b" fontSize="11">52%</text>

              {/* Left Pillar 1: Top (54%) */}
              <g className="cursor-pointer" onClick={() => setActiveFlowId('flow-env')}>
                <rect 
                  x="12" 
                  y="10" 
                  width="36" 
                  height="135" 
                  rx="6" 
                  fill="#5f6f8f" 
                  className="hover:opacity-90 transition-opacity shadow-md"
                />
                <text x="30" y="28" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">54%</text>
              </g>

              {/* Left Pillar 2: Bottom (46%) */}
              <g className="cursor-pointer" onClick={() => setActiveFlowId('flow-learn')}>
                <rect 
                  x="12" 
                  y="155" 
                  width="36" 
                  height="115" 
                  rx="6" 
                  fill="#86efac" 
                  className="hover:opacity-90 transition-opacity shadow-md"
                />
                <text x="30" y="175" fill="#065f46" fontSize="11" fontWeight="bold" textAnchor="middle">46%</text>
              </g>

              {/* Right Pillar 1: Top Program (58%) */}
              <g className="cursor-pointer" onClick={() => setActiveFlowId('flow-comm')}>
                <rect 
                  x="512" 
                  y="10" 
                  width="36" 
                  height="145" 
                  rx="6" 
                  fill="#93a5fc" 
                  className="hover:opacity-90 transition-opacity shadow-md"
                />
                <text x="530" y="28" fill="#1e1b4b" fontSize="11" fontWeight="bold" textAnchor="middle">58%</text>
              </g>

              {/* Right Pillar 2: Middle Program (24% Teal) */}
              <g className="cursor-pointer" onClick={() => setActiveFlowId('flow-env')}>
                <rect 
                  x="512" 
                  y="165" 
                  width="36" 
                  height="60" 
                  rx="6" 
                  fill="#2dd4bf" 
                  className="hover:opacity-90 transition-opacity shadow-md"
                />
                <text x="530" y="182" fill="#042f2e" fontSize="11" fontWeight="bold" textAnchor="middle">24%</text>
              </g>

              {/* Right Pillar 3: Bottom Program (18% Light Blue) */}
              <g className="cursor-pointer" onClick={() => setActiveFlowId('flow-infra')}>
                <rect 
                  x="512" 
                  y="235" 
                  width="36" 
                  height="45" 
                  rx="6" 
                  fill="#93c5fd" 
                  className="hover:opacity-90 transition-opacity shadow-md"
                />
                <text x="530" y="252" fill="#0f172a" fontSize="11" fontWeight="bold" textAnchor="middle">18%</text>
              </g>
            </svg>

            {/* Interactive Callout Tooltip matching the user's mockup floating over the flow */}
            <div 
              className="absolute left-[54%] top-[24%] -translate-x-1/2 z-20 bg-[#1e2025]/95 border border-white/15 rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[150px] transition-all animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                  <span className="text-slate-300 font-medium">{activeFlow.withdrawalPct} (withdrawal)</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold font-mono text-white pl-4 text-sm">
                  <span>⌄</span>
                  <span>${activeFlow.amount}M</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                  <span className="text-teal-300 font-semibold">{activeFlow.depositingPct} (depositing)</span>
                </div>
              </div>
              {/* Tooltip triangle tail */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1e2025] border-r border-b border-white/15 rotate-45" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
