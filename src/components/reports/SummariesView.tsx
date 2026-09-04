'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight, Printer, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export function SummariesView() {
  const { transactions, accounts, categories, currentCompany } = useApp();

  const activeTxs = transactions.filter(t => t.status === 'active');
  const receipts = activeTxs.filter(t => t.transaction_type.includes('receipt'));
  const payments = activeTxs.filter(t => t.transaction_type.includes('payment'));

  const totalReceipts = receipts.reduce((sum, tx) => sum + (tx.entries?.reduce((max, e) => Math.max(max, e.debit || 0), 0) || 0), 0);
  const totalPayments = payments.reduce((sum, tx) => sum + (tx.entries?.reduce((max, e) => Math.max(max, e.debit || 0), 0) || 0), 0);

  const handleExport = () => {
    const data = [
      ...receipts.map(r => ({
        'Category': 'Receipt (Inflow)',
        'Date': r.transaction_date,
        'Tx No': r.transaction_no,
        'Amount': r.entries?.reduce((max, e) => Math.max(max, e.debit || 0), 0) || 0,
        'Narration': r.narration || '',
      })),
      ...payments.map(p => ({
        'Category': 'Payment (Outflow)',
        'Date': p.transaction_date,
        'Tx No': p.transaction_no,
        'Amount': p.entries?.reduce((max, e) => Math.max(max, e.debit || 0), 0) || 0,
        'Narration': p.narration || '',
      }))
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');
    XLSX.writeFile(wb, `Receipts_Payments_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Receipts & Payments Summary
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated financial turnover for {currentCompany.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Export Excel
          </Button>
          <Button onClick={() => window.print()} size="sm" className="gap-1.5 text-xs">
            <Printer className="w-3.5 h-3.5" />
            Print Summary
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receipts Column */}
        <Card>
          <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              Receipts Breakdown ({receipts.length})
            </CardTitle>
            <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
              {formatCurrency(totalReceipts, currentCompany.currency, currentCompany.currency_symbol)}
            </span>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {receipts.map(tx => {
              const amt = tx.entries?.reduce((max, e) => Math.max(max, e.debit || 0), 0) || 0;
              return (
                <div key={tx.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-blue-600">{tx.transaction_no}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">{formatDate(tx.transaction_date)}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5">{tx.narration || 'No narrative'}</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">
                    +{formatCurrency(amt, currentCompany.currency, currentCompany.currency_symbol)}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Payments Column */}
        <Card>
          <CardHeader className="bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              Payments Breakdown ({payments.length})
            </CardTitle>
            <span className="font-mono font-bold text-sm text-rose-700 dark:text-rose-400">
              {formatCurrency(totalPayments, currentCompany.currency, currentCompany.currency_symbol)}
            </span>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {payments.map(tx => {
              const amt = tx.entries?.reduce((max, e) => Math.max(max, e.debit || 0), 0) || 0;
              return (
                <div key={tx.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-blue-600">{tx.transaction_no}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">{formatDate(tx.transaction_date)}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5">{tx.narration || 'No narrative'}</p>
                  </div>
                  <span className="font-mono font-bold text-rose-600">
                    -{formatCurrency(amt, currentCompany.currency, currentCompany.currency_symbol)}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
