'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Eye, 
  Ban, 
  Trash2,
  FileSpreadsheet, 
  Printer, 
  CheckCircle2, 
  AlertCircle,
  Download
} from 'lucide-react';
import { Transaction, TransactionType } from '@/types/database';
import * as XLSX from 'xlsx';

export function TransactionsListView() {
  const { transactions, accounts, parties, currentCompany, voidTransaction, deleteTransaction, editTransaction } = useApp();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isVoidOpen, setIsVoidOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  // Edit form state
  const [editDate, setEditDate] = useState('');
  const [editNarration, setEditNarration] = useState('');
  const [editRef, setEditRef] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (typeFilter !== 'all' && tx.transaction_type !== typeFilter) return false;
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
      if (accountFilter !== 'all' && !tx.entries?.some(e => e.account_id === accountFilter)) return false;
      if (fromDate && tx.transaction_date < fromDate) return false;
      if (toDate && tx.transaction_date > toDate) return false;

      if (search) {
        const q = search.toLowerCase();
        const matchesNo = tx.transaction_no.toLowerCase().includes(q);
        const matchesRef = tx.reference_no?.toLowerCase().includes(q);
        const matchesUtr = tx.utr_no?.toLowerCase().includes(q);
        const matchesCheque = tx.cheque_no?.toLowerCase().includes(q);
        const matchesNarr = tx.narration?.toLowerCase().includes(q);
        return Boolean(matchesNo || matchesRef || matchesUtr || matchesCheque || matchesNarr);
      }

      return true;
    });
  }, [transactions, typeFilter, statusFilter, accountFilter, fromDate, toDate, search]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = filteredTransactions.slice((page - 1) * pageSize, page * pageSize);

  const openDetail = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsDetailOpen(true);
  };

  const openVoidDialog = (tx: Transaction) => {
    setSelectedTx(tx);
    setVoidReason('');
    setIsVoidOpen(true);
  };

  const handleConfirmVoid = () => {
    if (!selectedTx) return;
    if (!voidReason.trim()) {
      setNotification({ type: 'error', message: 'Please provide a void reason for compliance audit trail.' });
      return;
    }

    const res = voidTransaction(selectedTx.id, voidReason.trim());
    if (res.success) {
      setNotification({ type: 'success', message: `Transaction ${selectedTx.transaction_no} has been voided.` });
      setIsVoidOpen(false);
      setIsDetailOpen(false);
    } else {
      setNotification({ type: 'error', message: res.error || 'Failed to void transaction.' });
    }
  };

  const openDeleteDialog = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedTx) return;

    const res = deleteTransaction(selectedTx.id);
    if (res.success) {
      setNotification({ type: 'success', message: `Transaction ${selectedTx.transaction_no} has been permanently deleted.` });
      setIsDeleteOpen(false);
      setIsDetailOpen(false);
    } else {
      setNotification({ type: 'error', message: res.error || 'Failed to delete transaction.' });
    }
  };

  const openEditDialog = (tx: Transaction) => {
    setSelectedTx(tx);
    setEditDate(tx.transaction_date);
    setEditNarration(tx.narration || '');
    setEditRef(tx.reference_no || '');
    setIsEditOpen(true);
  };

  const handleConfirmEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;

    const res = editTransaction(selectedTx.id, {
      date: editDate,
      narration: editNarration,
      referenceNo: editRef,
    });

    if (res.success) {
      setNotification({ type: 'success', message: `Transaction ${selectedTx.transaction_no} updated successfully.` });
      setIsEditOpen(false);
      setIsDetailOpen(false);
    } else {
      setNotification({ type: 'error', message: res.error || 'Failed to update transaction.' });
    }
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    const exportData = filteredTransactions.map(tx => {
      const amt = tx.entries?.reduce((max, e) => Math.max(max, e.debit || 0), 0) || 0;
      const acc = accounts.find(a => a.id === tx.entries?.[0]?.account_id)?.name || '-';
      const party = tx.entries?.find(e => e.party_id)?.party_id 
        ? parties.find(p => p.id === tx.entries?.find(e => e.party_id)?.party_id)?.name 
        : '-';

      return {
        'Transaction No': tx.transaction_no,
        'Date': tx.transaction_date,
        'Type': tx.transaction_type.toUpperCase(),
        'Account': acc,
        'Party': party,
        'Amount': amt,
        'Reference No': tx.reference_no || '',
        'UTR / Cheque': tx.utr_no || tx.cheque_no || '',
        'Status': tx.status.toUpperCase(),
        'Narration': tx.narration || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, `Transactions_${currentCompany.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="font-bold text-xs">Dismiss</button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Transaction Register
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of all receipts, payments, and contra entries
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleExportExcel} variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Export Excel
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm" className="gap-1.5 text-xs">
            <Printer className="w-3.5 h-3.5" />
            Print Register
          </Button>
          <Link href="/transactions/transfer">
            <Button size="sm" className="gap-1.5 text-xs">
              + New Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Search</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tx No, Narration, Ref, UTR..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="cash_receipt">Cash Receipt</option>
                <option value="cash_payment">Cash Payment</option>
                <option value="bank_receipt">Bank Receipt</option>
                <option value="bank_payment">Bank Payment</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            {/* Account Filter */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Account</label>
              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="all">All Accounts</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>Showing {filteredTransactions.length} records matching criteria</span>
            {(typeFilter !== 'all' || accountFilter !== 'all' || fromDate || toDate || search) && (
              <button
                onClick={() => {
                  setTypeFilter('all');
                  setAccountFilter('all');
                  setStatusFilter('all');
                  setFromDate('');
                  setToDate('');
                  setSearch('');
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table & Mobile Cards */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Tx Number</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Primary Account</th>
                  <th className="px-4 py-3">Reference / UTR</th>
                  <th className="px-4 py-3">Narration</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                      No matching transactions found.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map(tx => {
                    const amt = tx.entries?.reduce((max, e) => Math.max(max, e.debit || 0), 0) || 0;
                    const firstAcc = accounts.find(a => a.id === tx.entries?.[0]?.account_id);
                    const isVoided = tx.status === 'voided';

                    const badgeStyle: Record<string, string> = {
                      cash_receipt: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      bank_receipt: 'bg-teal-50 text-teal-700 border-teal-200',
                      cash_payment: 'bg-rose-50 text-rose-700 border-rose-200',
                      bank_payment: 'bg-amber-50 text-amber-700 border-amber-200',
                      transfer: 'bg-blue-50 text-blue-700 border-blue-200',
                    };

                    return (
                      <tr 
                        key={tx.id} 
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          isVoided ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/40' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {tx.transaction_no}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(tx.transaction_date)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeStyle[tx.transaction_type] || 'bg-slate-100'}`}>
                            {tx.transaction_type.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          {firstAcc?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {tx.reference_no || tx.utr_no || tx.cheque_no || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                          {tx.narration || '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {formatCurrency(amt, currentCompany.currency, currentCompany.currency_symbol)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!isVoided ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 line-through">
                              <Ban className="w-3.5 h-3.5" />
                              Voided
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => openDetail(tx)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer"
                            title="View Ledger Breakdown"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!isVoided && (
                            <button
                              onClick={() => openVoidDialog(tx)}
                              className="p-1 text-amber-500 hover:text-amber-700 rounded hover:bg-amber-50 dark:hover:bg-amber-900/30 cursor-pointer"
                              title="Void Financial Transaction"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openDeleteDialog(tx)}
                            className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 dark:hover:bg-rose-900/30 cursor-pointer"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (< md screens) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedTransactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No matching transactions found.
              </div>
            ) : (
              paginatedTransactions.map(tx => {
                const amt = tx.entries?.reduce((max, e) => Math.max(max, e.debit || 0), 0) || 0;
                const firstAcc = accounts.find(a => a.id === tx.entries?.[0]?.account_id);
                const isVoided = tx.status === 'voided';

                const badgeStyle: Record<string, string> = {
                  cash_receipt: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  bank_receipt: 'bg-teal-50 text-teal-700 border-teal-200',
                  cash_payment: 'bg-rose-50 text-rose-700 border-rose-200',
                  bank_payment: 'bg-amber-50 text-amber-700 border-amber-200',
                  transfer: 'bg-blue-50 text-blue-700 border-blue-200',
                };

                return (
                  <div 
                    key={tx.id} 
                    className={`p-4 space-y-2.5 transition-colors ${
                      isVoided ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/40' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                            {tx.transaction_no}
                          </span>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${badgeStyle[tx.transaction_type] || 'bg-slate-100'}`}>
                            {tx.transaction_type.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(tx.transaction_date)}</p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {formatCurrency(amt, currentCompany.currency, currentCompany.currency_symbol)}
                        </span>
                        <div>
                          {!isVoided ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-500 line-through">
                              <Ban className="w-3 h-3" /> Voided
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg space-y-1">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span className="text-[11px] text-slate-400">Account:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{firstAcc?.name || '-'}</span>
                      </div>
                      {(tx.reference_no || tx.utr_no || tx.cheque_no) && (
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span className="text-[11px] text-slate-400">Ref / UTR:</span>
                          <span className="font-mono text-[11px]">{tx.reference_no || tx.utr_no || tx.cheque_no}</span>
                        </div>
                      )}
                      {tx.narration && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-0.5">
                          &ldquo;{tx.narration}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-1 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetail(tx)}
                        className="text-xs py-1 px-2.5 gap-1 text-blue-600 dark:text-blue-400"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </Button>
                      {!isVoided && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openVoidDialog(tx)}
                          className="text-xs py-1 px-2.5 gap-1 text-amber-600 hover:text-amber-700"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Void</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDeleteDialog(tx)}
                        className="text-xs py-1 px-2.5 gap-1 text-rose-600 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail & Double-Entry Breakdown Modal */}
      {selectedTx && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Transaction ${selectedTx.transaction_no}`}
          description={`Double-entry ledger posting breakdown & audit record`}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(selectedTx.transaction_date)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Type</span>
                <span className="font-semibold uppercase text-blue-600">{selectedTx.transaction_type.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
                <span className={`font-semibold uppercase ${selectedTx.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedTx.status}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reference</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedTx.reference_no || '-'}</span>
              </div>
            </div>

            {/* Narration */}
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Narration</span>
              <p className="p-2.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                {selectedTx.narration || 'No narrative recorded.'}
              </p>
            </div>

            {/* Double-entry table */}
            <div>
              <span className="text-slate-700 dark:text-slate-300 block text-xs font-semibold mb-1.5">
                Double-Entry Accounting Postings (Debit = Credit)
              </span>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="p-2.5">Account / Ledger Head</th>
                      <th className="p-2.5 text-right">Debit (Dr)</th>
                      <th className="p-2.5 text-right">Credit (Cr)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    {selectedTx.entries?.map((e, idx) => {
                      const acc = accounts.find(a => a.id === e.account_id);
                      const party = e.party_id ? parties.find(p => p.id === e.party_id)?.name : null;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                            {acc?.name || 'General Account'}
                            {party && <span className="text-slate-400 ml-1">({party})</span>}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                            {e.debit > 0 ? formatCurrency(e.debit, currentCompany.currency, currentCompany.currency_symbol) : '-'}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                            {e.credit > 0 ? formatCurrency(e.credit, currentCompany.currency, currentCompany.currency_symbol) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Void Details if voided */}
            {selectedTx.status === 'voided' && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-rose-900">VOID RECORD AUDIT:</p>
                <p>Reason: {selectedTx.void_reason || 'Administrative void'}</p>
                <p className="text-[11px] text-rose-600">Voided at: {formatDate(selectedTx.voided_at || selectedTx.updated_at)}</p>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex gap-2">
                {selectedTx.status === 'active' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(selectedTx)}
                    >
                      Edit Narration / Date
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openVoidDialog(selectedTx)}
                      className="text-amber-600 border-amber-300 hover:bg-amber-50"
                    >
                      Void Transaction
                    </Button>
                  </>
                )}
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={() => openDeleteDialog(selectedTx)}
                >
                  Delete Entry
                </Button>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Void Modal */}
      {selectedTx && (
        <Modal
          isOpen={isVoidOpen}
          onClose={() => setIsVoidOpen(false)}
          title="Void Financial Transaction"
          description="Are you sure you want to void this transaction? This action will reverse balances across all linked accounts."
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs">
              <p className="font-bold">CAUTION: Permanent Audit Trail</p>
              <p className="mt-0.5">
                Voiding will remove this entry from active balance calculations while preserving full audit history.
              </p>
            </div>

            <Input
              label="Reason for Voiding"
              required
              placeholder="e.g. Inadvertent duplicate entry, bounced cheque, incorrect party"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsVoidOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmVoid}>
                Confirm & Void Transaction
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Delete Modal */}
      {selectedTx && (
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          title={`Delete Transaction ${selectedTx.transaction_no}`}
          description="Are you sure you want to permanently delete this transaction record?"
        >
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
              <p className="font-bold">WARNING: Permanent Deletion</p>
              <p className="mt-0.5">
                This transaction record will be completely removed from the register.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
                Delete Permanently
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {selectedTx && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Edit Transaction ${selectedTx.transaction_no}`}
          description="Update metadata and audit narrative"
        >
          <form onSubmit={handleConfirmEdit} className="space-y-4">
            <Input
              label="Transaction Date"
              type="date"
              required
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
            <Input
              label="Reference / Voucher Number"
              value={editRef}
              onChange={(e) => setEditRef(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Narration
              </label>
              <textarea
                rows={3}
                required
                value={editNarration}
                onChange={(e) => setEditNarration(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
