'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, maskAccountNumber } from '@/lib/utils';
import { Wallet, Landmark, Plus, Search, CheckCircle2, AlertCircle, ShieldAlert, PowerOff } from 'lucide-react';
import { Account, AccountType, BalanceType } from '@/types/database';

interface AccountsViewProps {
  initialType?: 'all' | 'cash' | 'bank';
}

export function AccountsView({ initialType = 'all' }: AccountsViewProps) {
  const { accounts, currentCompany, addAccount, updateAccount, deactivateAccount, deleteAccount, getAccountBalance } = useApp();
  const [filterType, setFilterType] = useState<'all' | 'cash' | 'bank'>(initialType);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<AccountType>('cash');
  const [formBankName, setFormBankName] = useState('');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formIfsc, setFormIfsc] = useState('');
  const [formBranch, setFormBranch] = useState('');
  const [formOpeningBalance, setFormOpeningBalance] = useState<string>('0');
  const [formOpeningBalanceType, setFormOpeningBalanceType] = useState<BalanceType>('debit');
  const [formDescription, setFormDescription] = useState('');

  const filteredAccounts = accounts.filter(acc => {
    if (filterType !== 'all' && acc.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        acc.name.toLowerCase().includes(q) ||
        (acc.bank_name && acc.bank_name.toLowerCase().includes(q)) ||
        (acc.account_number && acc.account_number.includes(q))
      );
    }
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsedBal = parseFloat(formOpeningBalance);
    if (isNaN(parsedBal) || parsedBal < 0) {
      setErrorMessage('Please enter a valid opening balance (>= 0).');
      return;
    }

    if (!formName.trim()) {
      setErrorMessage('Account name is required.');
      return;
    }

    if (formType === 'bank' && !formBankName.trim()) {
      setErrorMessage('Bank Name is required for Bank accounts.');
      return;
    }

    const res = addAccount({
      name: formName.trim(),
      type: formType,
      bank_name: formType === 'bank' ? formBankName.trim() : undefined,
      account_number: formType === 'bank' ? formAccountNumber.trim() : undefined,
      ifsc: formType === 'bank' ? formIfsc.trim().toUpperCase() : undefined,
      branch: formType === 'bank' ? formBranch.trim() : undefined,
      opening_balance: parsedBal,
      opening_balance_type: formOpeningBalanceType,
      description: formDescription.trim(),
      status: 'active'
    });

    if (res.success) {
      setSuccessMessage(`Account "${formName}" created successfully.`);
      setIsCreateOpen(false);
      // Reset form
      setFormName('');
      setFormBankName('');
      setFormAccountNumber('');
      setFormIfsc('');
      setFormBranch('');
      setFormOpeningBalance('0');
      setFormDescription('');
    } else {
      setErrorMessage(res.error || 'Failed to create account.');
    }
  };

  const handleDelete = (id: string, name: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const confirm = window.confirm(`Are you sure you want to delete or deactivate "${name}"?`);
    if (!confirm) return;

    const res = deleteAccount(id);
    if (!res.success) {
      setErrorMessage(res.error || 'Cannot delete account.');
    } else {
      setSuccessMessage(`Account "${name}" deleted successfully.`);
    }
  };

  const handleDeactivate = (id: string) => {
    deactivateAccount(id);
    setSuccessMessage('Account deactivated successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Account Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Cash Registers and Institutional Bank Accounts
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5 text-xs">
          <Plus className="w-4 h-4" />
          Add New Account
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All ({accounts.length})
          </button>
          <button
            onClick={() => setFilterType('cash')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'cash'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Cash ({accounts.filter(a => a.type === 'cash').length})
          </button>
          <button
            onClick={() => setFilterType('bank')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'bank'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Bank ({accounts.filter(a => a.type === 'bank').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.map((acc) => {
          const liveBalance = getAccountBalance(acc.id);
          const isCash = acc.type === 'cash';

          return (
            <Card key={acc.id} className="relative flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${isCash ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40'}`}>
                      {isCash ? <Wallet className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{acc.name}</h4>
                      <p className="text-[11px] text-slate-500 capitalize">{isCash ? 'Cash Vault' : acc.bank_name || 'Bank Account'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    acc.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {acc.status.toUpperCase()}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="py-4 space-y-3">
                {acc.type === 'bank' && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">A/C Number:</span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                        {maskAccountNumber(acc.account_number)}
                      </span>
                    </div>
                    {acc.ifsc && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">IFSC Code:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{acc.ifsc}</span>
                      </div>
                    )}
                    {acc.branch && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Branch:</span>
                        <span className="text-slate-700 dark:text-slate-300">{acc.branch}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-end justify-between pt-1">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Calculated Balance</span>
                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                      {formatCurrency(liveBalance, currentCompany.currency, currentCompany.currency_symbol)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Opening Balance</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                      {formatCurrency(acc.opening_balance, currentCompany.currency, currentCompany.currency_symbol)}
                    </span>
                  </div>
                </div>
              </CardContent>

              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px] truncate max-w-[150px]">
                  {acc.description || 'No description'}
                </span>
                <div className="flex items-center gap-2">
                  {acc.status === 'active' && (
                    <button 
                      onClick={() => handleDeactivate(acc.id)}
                      className="text-amber-600 hover:text-amber-700 font-medium text-[11px]"
                      title="Deactivate account"
                    >
                      Deactivate
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(acc.id, acc.name)}
                    className="text-rose-600 hover:text-rose-700 font-medium text-[11px]"
                    title="Delete account"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredAccounts.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No accounts found</p>
          <p className="text-xs text-slate-500 mt-1">Try changing search filters or create a new account.</p>
        </div>
      )}

      {/* Add Account Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Account"
        description="Add a new cash safe or corporate bank account"
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Account Display Name"
              required
              placeholder="e.g. Main Cash Vault / Axis Bank"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as AccountType)}
                className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
              >
                <option value="cash">Cash Account</option>
                <option value="bank">Bank Account</option>
              </select>
            </div>
          </div>

          {formType === 'bank' && (
            <div className="space-y-4 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Bank Name"
                  required
                  placeholder="e.g. HDFC Bank, State Bank of India"
                  value={formBankName}
                  onChange={(e) => setFormBankName(e.target.value)}
                />
                <Input
                  label="Bank Account Number"
                  placeholder="e.g. 50200012345678"
                  value={formAccountNumber}
                  onChange={(e) => setFormAccountNumber(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="IFSC Code"
                  placeholder="e.g. HDFC0001234"
                  value={formIfsc}
                  onChange={(e) => setFormIfsc(e.target.value)}
                />
                <Input
                  label="Branch Office"
                  placeholder="e.g. Nariman Point, Mumbai"
                  value={formBranch}
                  onChange={(e) => setFormBranch(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Opening Balance"
              type="number"
              step="any"
              min="0"
              required
              value={formOpeningBalance}
              onChange={(e) => setFormOpeningBalance(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Opening Balance Type
              </label>
              <select
                value={formOpeningBalanceType}
                onChange={(e) => setFormOpeningBalanceType(e.target.value as BalanceType)}
                className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
              >
                <option value="debit">Debit (Asset / Positive)</option>
                <option value="credit">Credit (Liability / Overdraft)</option>
              </select>
            </div>
          </div>

          <Input
            label="Description / Purpose"
            placeholder="e.g. For daily operations and client remittances"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" variant="primary">
              Save Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
