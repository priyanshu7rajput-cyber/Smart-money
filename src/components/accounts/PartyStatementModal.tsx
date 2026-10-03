'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Party } from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Printer, 
  Download, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calendar,
  Filter,
  FileSpreadsheet,
  Building2,
  Receipt
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface PartyStatementModalProps {
  party: Party | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PartyStatementModal({ party, isOpen, onClose }: PartyStatementModalProps) {
  const { currentCompany, parties, getPartyRunningStatement, getPartyBalance } = useApp();
  const [selectedParty, setSelectedParty] = useState<Party | null>(party);
  const [partySearch, setPartySearch] = useState('');
  const [isSwitchingParty, setIsSwitchingParty] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Keep internal selectedParty in sync if prop changes
  React.useEffect(() => {
    if (party) setSelectedParty(party);
  }, [party]);

  const activeParty = selectedParty || party;
  if (!activeParty) return null;

  const statement = getPartyRunningStatement(activeParty.id, fromDate, toDate);
  const currentNetBalance = getPartyBalance(activeParty.id);

  const filteredParties = parties.filter(p => {
    if (!partySearch.trim()) return true;
    const q = partySearch.toLowerCase().replace(/\s+/g, '');
    return p.name.toLowerCase().replace(/\s+/g, '').includes(q) || (p.phone && p.phone.includes(q)) || p.type.toLowerCase().includes(q);
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const exportRows = [
      {
        'Date': fromDate || 'Start',
        'Transaction No': 'OPENING',
        'Particulars': 'Opening Balance Brought Forward',
        'Account': '-',
        'Reference': '-',
        'Debit (₹)': statement.openingBalance > 0 ? statement.openingBalance : 0,
        'Credit (₹)': statement.openingBalance < 0 ? Math.abs(statement.openingBalance) : 0,
        'Running Balance (₹)': statement.openingBalance,
      },
      ...statement.entries.map(e => ({
        'Date': e.date,
        'Transaction No': e.transactionNo,
        'Particulars': e.description,
        'Account': e.accountName || '-',
        'Reference': e.reference || '-',
        'Debit (₹)': e.debit || 0,
        'Credit (₹)': e.credit || 0,
        'Running Balance (₹)': e.balance,
      })),
      {
        'Date': toDate || 'End',
        'Transaction No': 'CLOSING',
        'Particulars': 'Total & Closing Net Balance',
        'Account': '-',
        'Reference': '-',
        'Debit (₹)': statement.totalDebit,
        'Credit (₹)': statement.totalCredit,
        'Running Balance (₹)': statement.closingBalance,
      }
    ];

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Party Statement');
    XLSX.writeFile(wb, `${activeParty.name.replace(/\s+/g, '_')}_Statement.xlsx`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${activeParty.name} - Statement & Ledger`}
      description={`Complete date-wise transaction history and running ledger for ${activeParty.type}`}
      maxWidth="4xl"
    >
      <div className="space-y-4 sm:space-y-5">
        {/* Top Party Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 sm:p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
              <Users className="w-4 h-4 text-blue-500" />
              Active Party:
            </span>
            <div className="relative flex-1 max-w-sm">
              <select
                value={activeParty.id}
                onChange={(e) => {
                  const found = parties.find(p => p.id === e.target.value);
                  if (found) {
                    setSelectedParty(found);
                    setFromDate('');
                    setToDate('');
                  }
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {parties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 gap-1 border-slate-300 dark:border-slate-700"
            >
              ← Back / Close
            </Button>
          </div>
        </div>

        {/* Top Party Profile & Summary Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white border border-slate-700/80 shadow-lg relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/90 text-white flex items-center justify-center font-bold text-base shadow-md shadow-blue-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{activeParty.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {activeParty.type}
                    </span>
                    <span className="text-[11px] text-slate-400">ID: {activeParty.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
                {activeParty.phone && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {activeParty.phone}
                  </span>
                )}
                {activeParty.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {activeParty.email}
                  </span>
                )}
                {activeParty.address && (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {activeParty.address}
                  </span>
                )}
              </div>
            </div>

            {/* Balances Box */}
            <div className="grid grid-cols-2 sm:flex items-center gap-3 border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Opening Bal</span>
                <span className="text-sm font-bold font-mono text-slate-200">
                  {formatCurrency(activeParty.opening_balance, currentCompany.currency, currentCompany.currency_symbol)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-right shadow-inner">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">Current Balance</span>
                <span className={`text-base font-extrabold font-mono ${currentNetBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(currentNetBalance, currentCompany.currency, currentCompany.currency_symbol)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Date Filter & Export Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => { setFromDate(''); setToDate(''); }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold px-1"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button size="sm" variant="outline" onClick={handleExportExcel} className="text-xs gap-1.5 h-8 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export Excel</span>
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint} className="text-xs gap-1.5 h-8 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
              <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Print</span>
            </Button>
          </div>
        </div>

        {/* Date-wise Running Statement Table (Desktop View) */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Date</th>
                <th className="px-4 py-3 whitespace-nowrap">Tx No</th>
                <th className="px-4 py-3 whitespace-nowrap">Type / Account</th>
                <th className="px-4 py-3">Description & Reference</th>
                <th className="px-4 py-3 text-right whitespace-nowrap text-rose-600 dark:text-rose-400">Debit (Paid/Out)</th>
                <th className="px-4 py-3 text-right whitespace-nowrap text-emerald-600 dark:text-emerald-400">Credit (Recv/In)</th>
                <th className="px-4 py-3 text-right whitespace-nowrap font-bold">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {/* Opening Balance Row */}
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 font-medium text-slate-600 dark:text-slate-400">
                <td className="px-4 py-3 whitespace-nowrap font-mono">{fromDate ? formatDate(fromDate) : 'Start'}</td>
                <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-500">OPENING</td>
                <td className="px-4 py-3 font-semibold">—</td>
                <td className="px-4 py-3 italic text-slate-500">Opening Balance Brought Forward</td>
                <td className="px-4 py-3 text-right font-mono">
                  {statement.openingBalance > 0 ? formatCurrency(statement.openingBalance, currentCompany.currency, currentCompany.currency_symbol) : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {statement.openingBalance < 0 ? formatCurrency(Math.abs(statement.openingBalance), currentCompany.currency, currentCompany.currency_symbol) : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(statement.openingBalance, currentCompany.currency, currentCompany.currency_symbol)}
                </td>
              </tr>

              {/* Transactions Rows */}
              {statement.entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-xs">
                    No transactions recorded for this party in the selected period.
                  </td>
                </tr>
              ) : (
                statement.entries.map((entry) => {
                  const isReceipt = entry.type.includes('receipt');
                  const isPayment = entry.type.includes('payment');

                  return (
                    <tr key={entry.transactionId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {entry.transactionNo}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isReceipt
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                              : isPayment
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                              : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                          }`}>
                            {entry.type.replace('_', ' ')}
                          </span>
                          {entry.accountName && (
                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                              ({entry.accountName})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{entry.description}</p>
                          {entry.reference && (
                            <span className="text-[10px] font-mono text-slate-400 block truncate">
                              Ref: {entry.reference}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {entry.debit > 0 ? formatCurrency(entry.debit, currentCompany.currency, currentCompany.currency_symbol) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {entry.credit > 0 ? formatCurrency(entry.credit, currentCompany.currency, currentCompany.currency_symbol) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatCurrency(entry.balance, currentCompany.currency, currentCompany.currency_symbol)}
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Total & Closing Summary Row */}
              <tr className="bg-slate-100/90 dark:bg-slate-800/90 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                <td colSpan={4} className="px-4 py-3 text-slate-900 dark:text-slate-100">
                  Total Activity & Closing Net Balance
                </td>
                <td className="px-4 py-3 text-right font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">
                  {formatCurrency(statement.totalDebit, currentCompany.currency, currentCompany.currency_symbol)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  {formatCurrency(statement.totalCredit, currentCompany.currency, currentCompany.currency_symbol)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-base font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  {formatCurrency(statement.closingBalance, currentCompany.currency, currentCompany.currency_symbol)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile Statement Card List (< sm) */}
        <div className="sm:hidden space-y-2.5 max-h-[420px] overflow-y-auto pr-0.5">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
            <div>
              <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                OPENING
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Starting Balance</p>
            </div>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {formatCurrency(statement.openingBalance, currentCompany.currency, currentCompany.currency_symbol)}
            </span>
          </div>

          {statement.entries.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              No transactions recorded for this period.
            </div>
          ) : (
            statement.entries.map((entry) => {
              const isReceipt = entry.type.includes('receipt');
              return (
                <div 
                  key={entry.transactionId} 
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          {entry.transactionNo}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          isReceipt 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {entry.type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                        {formatDate(entry.date)} {entry.accountName ? `• ${entry.accountName}` : ''}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      {entry.credit > 0 ? (
                        <span className="text-xs font-bold text-emerald-600">
                          +{formatCurrency(entry.credit, currentCompany.currency, currentCompany.currency_symbol)}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-600">
                          -{formatCurrency(entry.debit, currentCompany.currency, currentCompany.currency_symbol)}
                        </span>
                      )}
                    </div>
                  </div>

                  {entry.description && (
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {entry.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="text-slate-400">Balance:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(entry.balance, currentCompany.currency, currentCompany.currency_symbol)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
