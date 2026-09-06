'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TransactionType, PartyType } from '@/types/database';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, AlertCircle, CheckCircle2, Paperclip, Plus, UserPlus } from 'lucide-react';

interface TransactionFormProps {
  type: TransactionType;
}

export function TransactionForm({ type }: TransactionFormProps) {
  const router = useRouter();
  const { 
    accounts, 
    parties, 
    customPartyRoles,
    addPartyRole,
    categories, 
    createTransaction, 
    getAccountBalance,
    addParty,
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

  // Quick Inline Add Party Modal State
  const [isNewPartyOpen, setIsNewPartyOpen] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyRole, setNewPartyRole] = useState<string>(
    type.includes('receipt') ? 'Customer' : (type.includes('payment') ? 'Supplier / Vendor' : 'Customer')
  );
  const [isCustomRoleInput, setIsCustomRoleInput] = useState(false);
  const [customRoleText, setCustomRoleText] = useState('');
  const [newPartyOpeningBal, setNewPartyOpeningBal] = useState('0');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyEmail, setNewPartyEmail] = useState('');
  const [newPartyAddress, setNewPartyAddress] = useState('');
  const [partyError, setPartyError] = useState<string | null>(null);

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

  const handleCreateParty = (e: React.FormEvent) => {
    e.preventDefault();
    setPartyError(null);

    if (!newPartyName.trim()) {
      setPartyError('Party name is required.');
      return;
    }

    const res = addParty({
      name: newPartyName.trim(),
      type: newPartyRole,
      phone: newPartyPhone.trim() || undefined,
      email: newPartyEmail.trim() || undefined,
      address: newPartyAddress.trim() || undefined,
      opening_balance: parseFloat(newPartyOpeningBal) || 0,
      status: 'active',
    });

    if (res.success && res.party) {
      setPartyId(res.party.id);
      setIsNewPartyOpen(false);
      setNewPartyName('');
      setNewPartyPhone('');
      setNewPartyEmail('');
      setNewPartyAddress('');
      setNewPartyOpeningBal('0');
    } else {
      setPartyError(res.error || 'Failed to create party');
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
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Transaction Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                />
              </div>

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
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Party (Customer / Vendor)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setPartyError(null);
                        setNewPartyName('');
                        setNewPartyRole(type.includes('receipt') ? 'customer' : 'supplier');
                        setNewPartyPhone('');
                        setNewPartyEmail('');
                        setNewPartyAddress('');
                        setNewPartyOpeningBal('0');
                        setIsNewPartyOpen(true);
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Party</span>
                    </button>
                  </div>
                  <select
                    value={partyId}
                    onChange={(e) => setPartyId(e.target.value)}
                    className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">None / Walk-in / Direct</option>
                    {parties.map(p => {
                      const displayRole = p.type.toLowerCase() === 'customer' 
                        ? 'Customer' 
                        : p.type.toLowerCase() === 'supplier' 
                        ? 'Supplier / Vendor' 
                        : p.type;
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} ({displayRole})
                        </option>
                      );
                    })}
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
                      .filter(c => {
                        if (c.status !== 'active') return false;
                        if (type.includes('receipt')) return c.type === 'income';
                        if (type.includes('payment')) return c.type === 'expense';
                        return true;
                      })
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Reference / Voucher Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-9018, REC-021"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            {/* Bank Specific Details */}
            {isBankForm && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Banking Settlement References
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      UTR / Transfer ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HDFCR20260901..."
                      value={utrNo}
                      onChange={(e) => setUtrNo(e.target.value)}
                      className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Cheque / Instrument No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 000492"
                      value={chequeNo}
                      onChange={(e) => setChequeNo(e.target.value)}
                      className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Cheque Date
                    </label>
                    <input
                      type="date"
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                      className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Narration Description */}
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

      {/* Inline Quick Add Party Modal */}
      <Modal
        isOpen={isNewPartyOpen}
        onClose={() => setIsNewPartyOpen(false)}
        title="Add New Party"
        description="Register a new customer, supplier or entity directly"
        maxWidth="md"
      >
        <form onSubmit={handleCreateParty} className="space-y-4">
          {partyError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{partyError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Party Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Corp Ltd"
              value={newPartyName}
              onChange={(e) => setNewPartyName(e.target.value)}
              className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Party Role <span className="text-red-500">*</span>
                </label>
                {!isCustomRoleInput ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomRoleInput(true);
                      setCustomRoleText('');
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Role</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCustomRoleInput(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {!isCustomRoleInput ? (
                <select
                  value={newPartyRole}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsCustomRoleInput(true);
                      setCustomRoleText('');
                    } else {
                      setNewPartyRole(e.target.value);
                    }
                  }}
                  className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  {customPartyRoles.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  <option value="__add_new__">+ Add New Custom Role...</option>
                </select>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Agent, Partner, Distributor"
                    value={customRoleText}
                    onChange={(e) => setCustomRoleText(e.target.value)}
                    className="flex h-9.5 w-full rounded-lg border border-blue-500 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (customRoleText.trim()) {
                        addPartyRole(customRoleText.trim());
                        setNewPartyRole(customRoleText.trim());
                        setIsCustomRoleInput(false);
                      }
                    }}
                    className="text-xs px-2.5"
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Opening Balance
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={newPartyOpeningBal}
                onChange={(e) => setNewPartyOpeningBal(e.target.value)}
                className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={newPartyPhone}
                onChange={(e) => setNewPartyPhone(e.target.value)}
                className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <input
                type="email"
                placeholder="contact@entity.com"
                value={newPartyEmail}
                onChange={(e) => setNewPartyEmail(e.target.value)}
                className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Registered Address
            </label>
            <input
              type="text"
              placeholder="Street address, city, state"
              value={newPartyAddress}
              onChange={(e) => setNewPartyAddress(e.target.value)}
              className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewPartyOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Party
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
