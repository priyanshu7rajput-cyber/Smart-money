'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Account, Party } from '@/types/database';
import { formatCurrency, formatDate, maskAccountNumber } from '@/lib/utils';
import { 
  Wallet, 
  Landmark, 
  Calendar, 
  Printer, 
  Download, 
  ArrowDownLeft, 
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PartyStatementModal } from './PartyStatementModal';

interface AccountStatementModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AccountStatementModal({ account, isOpen, onClose }: AccountStatementModalProps) {
  const { currentCompany, accounts, parties, getAccountRunningLedger, getAccountBalance } = useApp();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(account);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewedParty, setViewedParty] = useState<Party | null>(null);

  React.useEffect(() => {
    if (account) setSelectedAccount(account);
  }, [account]);

  const activeAccount = selectedAccount || account;
  if (!activeAccount) return null;

  const ledger = getAccountRunningLedger(activeAccount.id, fromDate || undefined, toDate || undefined);
  const liveBal = getAccountBalance(activeAccount.id);
  const isCash = activeAccount.type === 'cash';

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const exportRows = [
      {
        'Date': fromDate || 'Start',
        'Transaction No': 'OPENING',
        'Type': '-',
        'Party / Description': 'Opening Balance Brought Forward',
        'Inflow (+) (₹)': 0,
        'Outflow (-) (₹)': 0,
        'Running Balance (₹)': ledger.openingBalance,
      },
      ...ledger.entries.map(e => ({
        'Date': e.date,
        'Transaction No': e.transactionNo,
        'Type': e.type.replace('_', ' ').toUpperCase(),
        'Party / Description': e.partyName ? `${e.partyName} - ${e.description || e.reference || ''}` : (e.description || e.reference || '-'),
        'Inflow (+) (₹)': e.debit || 0,
        'Outflow (-) (₹)': e.credit || 0,
        'Running Balance (₹)': e.balance,
      })),
      {
        'Date': toDate || 'End',
        'Transaction No': 'CLOSING',
        'Type': 'TOTAL',
        'Party / Description': 'Total Activity & Net Balance',
        'Inflow (+) (₹)': ledger.totalDebit,
        'Outflow (-) (₹)': ledger.totalCredit,
        'Running Balance (₹)': liveBal,
      }
    ];

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Account Statement');
    XLSX.writeFile(wb, `${activeAccount.name.replace(/\s+/g, '_')}_Statement.xlsx`);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${activeAccount.name} — Statement & Ledger`}
        description={`${isCash ? 'Cash Vault / Register' : activeAccount.bank_name || 'Bank Account'} • ${activeAccount.account_number ? maskAccountNumber(activeAccount.account_number) : 'Active Safe'}`}
        maxWidth="4xl"
      >
        <div className="space-y-4 sm:space-y-5">
          {/* Top Account Switcher Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 sm:p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
                {isCash ? <Wallet className="w-4 h-4 text-emerald-500" /> : <Landmark className="w-4 h-4 text-blue-500" />}
                Active Account:
              </span>
              <div className="relative flex-1 max-w-sm">
                <select
                  value={activeAccount.id}
                  onChange={(e) => {
                    const found = accounts.find(a => a.id === e.target.value);
                    if (found) {
                      setSelectedAccount(found);
                      setFromDate('');
                      setToDate('');
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type.toUpperCase()}) {a.bank_name ? `• ${a.bank_name}` : ''}
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

          {/* Quick Stats Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Opening Bal</span>
              <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                {formatCurrency(ledger.openingBalance, currentCompany.currency, currentCompany.currency_symbol)}
              </span>
            </div>
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-800/50">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block tracking-wider flex items-center gap-0.5 truncate">
                <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" /> Total Inflow (+)
              </span>
              <span className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 block truncate">
                {formatCurrency(ledger.totalDebit, currentCompany.currency, currentCompany.currency_symbol)}
              </span>
            </div>
            <div className="bg-rose-50/70 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200/60 dark:border-rose-800/50">
              <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block tracking-wider flex items-center gap-0.5 truncate">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" /> Total Outflow (-)
              </span>
              <span className="text-sm font-mono font-bold text-rose-700 dark:text-rose-300 mt-0.5 block truncate">
                {formatCurrency(ledger.totalCredit, currentCompany.currency, currentCompany.currency_symbol)}
              </span>
            </div>
            <div className="bg-blue-50/70 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200/60 dark:border-blue-800/50">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block tracking-wider">Net Balance</span>
              <span className={`text-sm font-mono font-bold mt-0.5 block truncate ${liveBal >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-600'}`}>
                {formatCurrency(liveBal, currentCompany.currency, currentCompany.currency_symbol)}
              </span>
            </div>
          </div>

          {/* Date Filter & Export Toolbar */}
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

          {/* Desktop Running Ledger Table View */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 whitespace-nowrap">Tx No</th>
                    <th className="px-4 py-3 whitespace-nowrap">Type</th>
                    <th className="px-4 py-3">Party / Particulars</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap text-emerald-600 dark:text-emerald-400">Inflow (+)</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap text-rose-600 dark:text-rose-400">Outflow (-)</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap font-bold">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {/* Opening Balance Row */}
                  <tr className="bg-slate-50/70 dark:bg-slate-800/40 italic text-slate-600 dark:text-slate-400 font-medium">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-mono">{fromDate ? formatDate(fromDate) : 'Start'}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-500">OPENING</td>
                    <td className="px-4 py-3 font-semibold">—</td>
                    <td className="px-4 py-3 text-slate-500">Opening Balance Brought Forward</td>
                    <td className="px-4 py-3 text-right font-mono">—</td>
                    <td className="px-4 py-3 text-right font-mono">—</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatCurrency(ledger.openingBalance, currentCompany.currency, currentCompany.currency_symbol)}
                    </td>
                  </tr>

                  {ledger.entries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-xs">
                        No transactions recorded for this account in the selected period.
                      </td>
                    </tr>
                  ) : (
                    ledger.entries.map((item, idx) => {
                      const isReceipt = item.type === 'cash_receipt' || item.type === 'bank_receipt';
                      const isPayment = item.type === 'cash_payment' || item.type === 'bank_payment';

                      return (
                        <tr key={item.transactionId || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                            {formatDate(item.date)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono font-semibold text-blue-600 dark:text-blue-400">
                            {item.transactionNo}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isReceipt 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300' 
                                : isPayment
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300'
                            }`}>
                              {item.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[240px]">
                            {item.partyName ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const p = parties.find(party => party.name.toLowerCase() === (item.partyName || '').toLowerCase());
                                  if (p) setViewedParty(p);
                                }}
                                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-left truncate cursor-pointer group"
                                title={`View statement for ${item.partyName}`}
                              >
                                <span className="truncate">{item.partyName}</span>
                                <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ) : (
                              <span className="text-slate-400 italic">—</span>
                            )}
                            <div className="text-[11px] text-slate-500 truncate mt-0.5" title={item.description || item.reference}>
                              {item.description || item.reference || 'No narration'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {item.debit > 0 ? `+${formatCurrency(item.debit, currentCompany.currency, currentCompany.currency_symbol)}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            {item.credit > 0 ? `-${formatCurrency(item.credit, currentCompany.currency, currentCompany.currency_symbol)}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {formatCurrency(item.balance, currentCompany.currency, currentCompany.currency_symbol)}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Summary Footer Row */}
                  <tr className="bg-slate-100/90 dark:bg-slate-800/90 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                    <td colSpan={4} className="px-4 py-3 text-slate-900 dark:text-slate-100">
                      Total Activity & Net Balance
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      +{formatCurrency(ledger.totalDebit, currentCompany.currency, currentCompany.currency_symbol)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      -{formatCurrency(ledger.totalCredit, currentCompany.currency, currentCompany.currency_symbol)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-base font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {formatCurrency(liveBal, currentCompany.currency, currentCompany.currency_symbol)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View (< sm) */}
          <div className="sm:hidden space-y-2.5 max-h-[400px] overflow-y-auto pr-0.5">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
              <div>
                <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  OPENING
                </span>
                <p className="text-[11px] text-slate-500 mt-1">Starting Balance</p>
              </div>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(ledger.openingBalance, currentCompany.currency, currentCompany.currency_symbol)}
              </span>
            </div>

            {ledger.entries.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                No transactions recorded for this period.
              </div>
            ) : (
              ledger.entries.map((item, idx) => {
                const isReceipt = item.type === 'cash_receipt' || item.type === 'bank_receipt';
                const isPayment = item.type === 'cash_payment' || item.type === 'bank_payment';

                return (
                  <div key={item.transactionId || idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                            {item.transactionNo}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            isReceipt 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : isPayment
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {item.type.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          {formatDate(item.date)} {item.partyName ? `• ${item.partyName}` : ''}
                        </span>
                      </div>

                      <div className="text-right font-mono">
                        {item.debit > 0 ? (
                          <span className="text-xs font-bold text-emerald-600">
                            +{formatCurrency(item.debit, currentCompany.currency, currentCompany.currency_symbol)}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-rose-600">
                            -{formatCurrency(item.credit, currentCompany.currency, currentCompany.currency_symbol)}
                          </span>
                        )}
                      </div>
                    </div>

                    {(item.description || item.reference) && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 truncate">
                        {item.description || item.reference}
                      </p>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <span className="text-slate-400">Balance:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.balance, currentCompany.currency, currentCompany.currency_symbol)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* Linked Party Statement Modal */}
      {viewedParty && (
        <PartyStatementModal
          party={viewedParty}
          isOpen={Boolean(viewedParty)}
          onClose={() => setViewedParty(null)}
        />
      )}
    </>
  );
}
