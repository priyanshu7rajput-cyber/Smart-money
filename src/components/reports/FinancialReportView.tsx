'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Printer, Download, BookOpen, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface FinancialReportProps {
  reportType: 'cash_book' | 'bank_book' | 'ledger' | 'day_book';
}

export function FinancialReportView({ reportType }: FinancialReportProps) {
  const { 
    accounts, 
    transactions, 
    currentCompany, 
    getAccountRunningLedger 
  } = useApp();

  const isCashBook = reportType === 'cash_book';
  const isBankBook = reportType === 'bank_book';
  const isDayBook = reportType === 'day_book';

  const relevantAccounts = accounts.filter(a => {
    if (isCashBook) return a.type === 'cash';
    if (isBankBook) return a.type === 'bank';
    return true;
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string>(relevantAccounts[0]?.id || '');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  React.useEffect(() => {
    if (relevantAccounts.length > 0 && !relevantAccounts.some(a => a.id === selectedAccountId)) {
      setSelectedAccountId(relevantAccounts[0].id);
    }
  }, [reportType, accounts, relevantAccounts, selectedAccountId]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  // Calculate Ledger Data
  const ledgerData = selectedAccountId
    ? getAccountRunningLedger(selectedAccountId, fromDate, toDate)
    : { openingBalance: 0, entries: [], totalDebit: 0, totalCredit: 0, closingBalance: 0 };

  // Calculate Day Book Data (all transactions chronologically)
  const dayBookEntries = React.useMemo(() => {
    if (!isDayBook) return [];
    return [...transactions]
      .filter(tx => {
        if (tx.status !== 'active') return false;
        if (fromDate && tx.transaction_date < fromDate) return false;
        if (toDate && tx.transaction_date > toDate) return false;
        return true;
      })
      .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());
  }, [isDayBook, transactions, fromDate, toDate]);

  const getReportTitle = () => {
    switch (reportType) {
      case 'cash_book': return 'Cash Book Statement';
      case 'bank_book': return 'Bank Book Statement';
      case 'ledger': return 'Account Ledger & Running Balance';
      case 'day_book': return 'Day Book (Chronological Journal)';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const title = getReportTitle();
    let exportRows: any[] = [];

    if (isDayBook) {
      exportRows = dayBookEntries.map(tx => {
        const amt = tx.entries?.reduce((max, e) => Math.max(max, e.debit || 0), 0) || 0;
        const firstAcc = accounts.find(a => a.id === tx.entries?.[0]?.account_id)?.name || '-';
        return {
          'Date': tx.transaction_date,
          'Transaction No': tx.transaction_no,
          'Type': tx.transaction_type.toUpperCase(),
          'Account': firstAcc,
          'Reference': tx.reference_no || '',
          'Amount': amt,
          'Narration': tx.narration || '',
        };
      });
    } else {
      exportRows = [
        {
          'Date': fromDate || 'Start',
          'Transaction No': 'OPENING',
          'Particulars / Narration': 'Opening Balance Brought Forward',
          'Debit': ledgerData.openingBalance > 0 ? ledgerData.openingBalance : 0,
          'Credit': ledgerData.openingBalance < 0 ? Math.abs(ledgerData.openingBalance) : 0,
          'Running Balance': ledgerData.openingBalance,
        },
        ...ledgerData.entries.map(e => ({
          'Date': e.date,
          'Transaction No': e.transactionNo,
          'Particulars / Narration': e.description,
          'Reference': e.reference || '',
          'Debit': e.debit || 0,
          'Credit': e.credit || 0,
          'Running Balance': e.balance,
        })),
        {
          'Date': toDate || 'End',
          'Transaction No': 'CLOSING',
          'Particulars / Narration': 'Total & Closing Balance Carried Down',
          'Debit': ledgerData.totalDebit,
          'Credit': ledgerData.totalCredit,
          'Running Balance': ledgerData.closingBalance,
        }
      ];
    }

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Print/Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            {getReportTitle()}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Entity: <strong className="text-slate-700 dark:text-slate-300">{currentCompany.name}</strong> • Currency: {currentCompany.currency} ({currentCompany.currency_symbol})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleExportExcel} variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Export Excel
          </Button>
          <Button onClick={handlePrint} size="sm" className="gap-1.5 text-xs">
            <Printer className="w-3.5 h-3.5" />
            Print / PDF Statement
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="no-print">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {!isDayBook && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Account
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full h-9.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                >
                  {relevantAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-9.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-9.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Printable Statement View */}
      <Card className="print:shadow-none print:border-none">
        {/* Print Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{currentCompany.name}</h3>
              <p className="text-xs text-slate-500">{currentCompany.tax_id || 'GST Registered Company'}</p>
              <p className="text-xs font-semibold text-blue-600 mt-1 uppercase tracking-wider">{getReportTitle()}</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>Period: <strong>{fromDate ? formatDate(fromDate) : 'Start'}</strong> to <strong>{toDate ? formatDate(toDate) : 'Present'}</strong></p>
              <p>Generated: <strong>{new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}</strong></p>
              {selectedAccount && !isDayBook && (
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  Account: {selectedAccount.name} ({selectedAccount.type.toUpperCase()})
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ledger or Day Book Table */}
        <CardContent className="p-0">
          {!isDayBook ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Tx Number</th>
                    <th className="px-4 py-3">Particulars / Narration</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3 text-right">
                      {isCashBook ? 'Receipt (Dr)' : isBankBook ? 'Deposit (Dr)' : 'Debit (Dr)'}
                    </th>
                    <th className="px-4 py-3 text-right">
                      {isCashBook ? 'Payment (Cr)' : isBankBook ? 'Withdrawal (Cr)' : 'Credit (Cr)'}
                    </th>
                    <th className="px-4 py-3 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Opening Balance Row */}
                  <tr className="bg-slate-50/70 dark:bg-slate-800/30 font-semibold">
                    <td className="px-4 py-2.5 text-slate-500">{fromDate ? formatDate(fromDate) : '-'}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-400">-</td>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                      Opening Balance Brought Forward
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">-</td>
                    <td className="px-4 py-2.5 text-right font-mono text-emerald-600">
                      {ledgerData.openingBalance > 0 ? formatCurrency(ledgerData.openingBalance, currentCompany.currency, currentCompany.currency_symbol) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-rose-600">
                      {ledgerData.openingBalance < 0 ? formatCurrency(Math.abs(ledgerData.openingBalance), currentCompany.currency, currentCompany.currency_symbol) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(ledgerData.openingBalance, currentCompany.currency, currentCompany.currency_symbol)}
                    </td>
                  </tr>

                  {/* Transaction Rows */}
                  {ledgerData.entries.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {formatDate(row.date)}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {row.transactionNo}
                      </td>
                      <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                        {row.description}
                        {row.partyName && <span className="text-slate-400 text-[11px] block">Party: {row.partyName}</span>}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">
                        {row.reference || '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-600">
                        {row.debit > 0 ? formatCurrency(row.debit, currentCompany.currency, currentCompany.currency_symbol) : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-rose-600">
                        {row.credit > 0 ? formatCurrency(row.credit, currentCompany.currency, currentCompany.currency_symbol) : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(row.balance, currentCompany.currency, currentCompany.currency_symbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Statement Totals Footer */}
                <tfoot className="bg-slate-100/90 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-t-2 border-slate-300 dark:border-slate-600">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-wider text-xs">
                      Period Total Debits & Credits:
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600 text-sm">
                      {formatCurrency(ledgerData.totalDebit, currentCompany.currency, currentCompany.currency_symbol)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-rose-600 text-sm">
                      {formatCurrency(ledgerData.totalCredit, currentCompany.currency, currentCompany.currency_symbol)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-blue-600 text-sm">
                      {formatCurrency(ledgerData.closingBalance, currentCompany.currency, currentCompany.currency_symbol)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            /* Day Book View */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Tx Number</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Primary Account</th>
                    <th className="px-4 py-3">Narration</th>
                    <th className="px-4 py-3 text-right">Debit (Inflow)</th>
                    <th className="px-4 py-3 text-right">Credit (Outflow)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dayBookEntries.map(tx => {
                    const amt = tx.entries?.reduce((max, e) => Math.max(max, e.debit || 0), 0) || 0;
                    const firstAcc = accounts.find(a => a.id === tx.entries?.[0]?.account_id)?.name || '-';
                    const isReceipt = tx.transaction_type.includes('receipt');

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-2.5 text-slate-600">{formatDate(tx.transaction_date)}</td>
                        <td className="px-4 py-2.5 font-mono font-semibold text-blue-600">{tx.transaction_no}</td>
                        <td className="px-4 py-2.5 uppercase font-semibold text-[10px] text-slate-500">
                          {tx.transaction_type.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{firstAcc}</td>
                        <td className="px-4 py-2.5 text-slate-600 truncate max-w-[200px]">{tx.narration || '-'}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-600">
                          {isReceipt ? formatCurrency(amt, currentCompany.currency, currentCompany.currency_symbol) : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-600">
                          {!isReceipt ? formatCurrency(amt, currentCompany.currency, currentCompany.currency_symbol) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
