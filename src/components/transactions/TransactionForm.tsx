'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TransactionType } from '@/types/database';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, AlertCircle, CheckCircle2, Paperclip } from 'lucide-react';

interface TransactionFormProps {
  type: TransactionType;
}

export function TransactionForm({ type }: TransactionFormProps) {
  const router = useRouter();
  const { 
    accounts, 
    parties, 
    categories, 
    createTransaction, 
    getAccountBalance,
    currentCompany 
  } = useApp();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [utrNo, setUtrNo] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [narration, setNarration] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter valid accounts by form type
  const isCashForm = type === 'cash_receipt' || type === 'cash_payment';
  const isBankForm = type === 'bank_receipt' || type === 'bank_payment';
  const isTransfer = type === 'transfer';

  const availableAccounts = accounts.filter(a => {
    if (a.status !== 'active') return false;
    if (isCashForm) return a.type === 'cash';
    if (isBankForm) return a.type === 'bank';
    return true; // Transfer allows both
  });

  // Default selection
  React.useEffect(() => {
    if (availableAccounts.length > 0 && !accountId) {
      setAccountId(availableAccounts[0].id);
    }
    if (isTransfer && accounts.length > 1 && !toAccountId) {
      const other = accounts.find(a => a.id !== availableAccounts[0]?.id && a.status === 'active');
      if (other) setToAccountId(other.id);
    }
  }, [availableAccounts, accountId, isTransfer, toAccountId, accounts]);

  const selectedAccountBalance = accountId ? getAccountBalance(accountId) : 0;

  const getTitle = () => {
    switch (type) {
      case 'cash_receipt': return 'Record Cash Receipt';
      case 'cash_payment': return 'Record Cash Payment';
      case 'bank_receipt': return 'Record Bank Receipt';
      case 'bank_payment': return 'Record Bank Payment';
      case 'transfer': return 'Contra / Inter-Account Transfer';
    }
  };

  const getSubTitle = () => {
    switch (type) {
      case 'cash_receipt': return 'Record incoming cash received from customer, sales, or capital.';
      case 'cash_payment': return 'Disburse cash with real-time balance validation.';
      case 'bank_receipt': return 'Record incoming direct bank credits, RTGS/NEFT, or deposited cheques.';
      case 'bank_payment': return 'Record wire transfers, cheque issuance, or institutional withdrawals.';
      case 'transfer': return 'Transfer funds between vaults and accounts atomically (Cash ⇄ Bank, Bank ⇄ Bank).';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setError('Amount is required and must be greater than 0.');
      return;
    }

    if (!accountId) {
      setError('Please select a primary account.');
      return;
    }

    if (isTransfer) {
      if (!toAccountId) {
        setError('Please select destination account.');
        return;
      }
      if (accountId === toAccountId) {
        setError('Source and destination accounts cannot be identical.');
        return;
      }
    }

    // Balance check for payments and transfers
    const isOutflow = type === 'cash_payment' || type === 'bank_payment' || type === 'transfer';
    if (isOutflow && selectedAccountBalance < parsedAmt) {
      const confirmNegative = window.confirm(
        `Warning: Selected account balance (${currentCompany.currency_symbol} ${selectedAccountBalance.toLocaleString()}) is less than transaction amount (${currentCompany.currency_symbol} ${parsedAmt.toLocaleString()}). Do you wish to allow overdraft?`
      );
      if (!confirmNegative) {
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = createTransaction({
        type,
        date,
        amount: parsedAmt,
        accountId,
        toAccountId: isTransfer ? toAccountId : undefined,
        partyId: partyId || undefined,
        categoryId: categoryId || undefined,
        referenceNo: referenceNo.trim() || undefined,
        utrNo: utrNo.trim() || undefined,
        chequeNo: chequeNo.trim() || undefined,
        chequeDate: chequeDate || undefined,
        narration: narration.trim() || (isTransfer ? 'Contra Fund Transfer' : `${type.replace('_', ' ').toUpperCase()}`),
      });

      if (res.success) {
        setSuccess(`Transaction ${res.transactionNo} posted successfully!`);
        setTimeout(() => {
          router.push('/transactions');
        }, 800);
      } else {
        setError(res.error || 'Failed to post transaction.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          {type.includes('receipt') && <ArrowDownLeft className="w-5 h-5 text-emerald-600" />}
          {type.includes('payment') && <ArrowUpRight className="w-5 h-5 text-rose-600" />}
          {type === 'transfer' && <ArrowLeftRight className="w-5 h-5 text-blue-600" />}
          {getTitle()}
        </h2>
        <p className="text-xs text-slate-500 mt-1">{getSubTitle()}</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Transaction Details</CardTitle>
              <span className="text-xs text-slate-500 font-mono">Company ID: {currentCompany.id.slice(0, 8)}</span>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            {/* Top Row: Date & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Transaction Date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Amount ({currentCompany.currency_symbol}) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    {currentCompany.currency_symbol}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-1.5 text-sm font-semibold font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Account Selection Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isTransfer ? 'Source Account (Withdraw From)' : 'Account'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                >
                  {availableAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type.toUpperCase()})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 flex justify-between">
                  <span>Current Balance:</span>
                  <strong className="font-mono text-slate-700 dark:text-slate-300">
                    {currentCompany.currency_symbol} {selectedAccountBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </p>
              </div>

              {isTransfer && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Destination Account (Deposit To) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Select Destination Account</option>
                    {accounts.filter(a => a.id !== accountId && a.status === 'active').map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  {toAccountId && (
                    <p className="text-[11px] text-slate-500 flex justify-between">
                      <span>Current Balance:</span>
                      <strong className="font-mono text-slate-700 dark:text-slate-300">
                        {currentCompany.currency_symbol} {getAccountBalance(toAccountId).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </p>
                  )}
                </div>
              )}

              {!isTransfer && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Party (Customer / Vendor)
                  </label>
                  <select
                    value={partyId}
                    onChange={(e) => setPartyId(e.target.value)}
                    className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">None / Walk-in / Direct</option>
                    {parties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Category and Reference Row */}
            {!isTransfer && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Ledger Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Select Category</option>
                    {categories
                      .filter(c => type.includes('receipt') ? c.type === 'income' : c.type === 'expense')
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <Input
                  label="Reference / Voucher Number"
                  placeholder="e.g. INV-9018, REC-021"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                />
              </div>
            )}

            {/* Bank Specific Fields (UTR, Cheque) */}
            {isBankForm && (
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-4">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">Banking Audit & Clearing Identifiers</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="UTR / IMPS / Ref No."
                    placeholder="e.g. HDFCR2026..."
                    value={utrNo}
                    onChange={(e) => setUtrNo(e.target.value)}
                  />
                  <Input
                    label="Cheque Number"
                    placeholder="e.g. 000492"
                    value={chequeNo}
                    onChange={(e) => setChequeNo(e.target.value)}
                  />
                  <Input
                    label="Cheque Clearing Date"
                    type="date"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Narration */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Narration / Description
              </label>
              <textarea
                rows={3}
                placeholder="Enter transaction narrative for ledger and audit logs..."
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Optional Attachment */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {attachmentName ? `Attached: ${attachmentName}` : 'Attach receipt, cheque scan or invoice (Optional)'}
                </span>
              </div>
              <label className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white dark:bg-slate-900 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600">
                Browse
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAttachmentName(e.target.files[0].name);
                    }
                  }} 
                />
              </label>
            </div>
          </CardContent>

          <CardFooter className="justify-between">
            <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" size="md" isLoading={isLoading} className="px-6">
              Post Transaction
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
