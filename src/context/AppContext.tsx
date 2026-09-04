'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Company, 
  Account, 
  Party, 
  Category, 
  Transaction, 
  AuditLog, 
  DashboardMetrics,
  TransactionType
} from '@/types/database';
import { 
  DEMO_COMPANY, 
  DEMO_COMPANIES, 
  INITIAL_ACCOUNTS, 
  INITIAL_PARTIES, 
  INITIAL_CATEGORIES, 
  INITIAL_TRANSACTIONS, 
  INITIAL_AUDIT_LOGS 
} from '@/lib/initial-data';

interface AppContextType {
  currentCompany: Company;
  companies: Company[];
  accounts: Account[];
  parties: Party[];
  categories: Category[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setCompany: (companyId: string) => void;
  
  // Account operations
  addAccount: (account: Omit<Account, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => { success: boolean; error?: string };
  updateAccount: (id: string, updates: Partial<Account>) => { success: boolean; error?: string };
  deactivateAccount: (id: string) => { success: boolean; error?: string };
  deleteAccount: (id: string) => { success: boolean; error?: string };

  // Party operations
  addParty: (party: Omit<Party, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => { success: boolean; error?: string };
  updateParty: (id: string, updates: Partial<Party>) => { success: boolean; error?: string };

  // Category operations
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => { success: boolean; error?: string };

  // Transaction operations (Double-entry engine)
  createTransaction: (data: {
    type: TransactionType;
    date: string;
    amount: number;
    accountId: string;
    toAccountId?: string;
    partyId?: string;
    categoryId?: string;
    referenceNo?: string;
    utrNo?: string;
    chequeNo?: string;
    chequeDate?: string;
    narration: string;
  }) => { success: boolean; transactionNo?: string; error?: string };

  voidTransaction: (id: string, reason: string) => { success: boolean; error?: string };
  editTransaction: (id: string, data: {
    date: string;
    referenceNo?: string;
    utrNo?: string;
    chequeNo?: string;
    chequeDate?: string;
    narration: string;
  }) => { success: boolean; error?: string };

  // Financial reporting & ledger calculation helpers
  getAccountBalance: (accountId: string) => number;
  getAccountRunningLedger: (accountId: string, fromDate?: string, toDate?: string) => {
    openingBalance: number;
    entries: Array<{
      date: string;
      transactionNo: string;
      transactionId: string;
      type: TransactionType;
      description: string;
      reference?: string;
      partyName?: string;
      debit: number;
      credit: number;
      balance: number;
    }>;
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
  };
  getDashboardMetrics: () => DashboardMetrics;
  getCashVsBankData: () => Array<{ name: string; value: number }>;
  getTransactionTimelineData: () => Array<{ date: string; receipts: number; payments: number }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentCompany, setCurrentCompany] = useState<Company>(DEMO_COMPANY);
  const [companies] = useState<Company[]>(DEMO_COMPANIES);
  
  const [accounts, setAccounts] = useState<Account[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cashflow_accounts');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return INITIAL_ACCOUNTS;
  });

  const [parties, setParties] = useState<Party[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cashflow_parties');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return INITIAL_PARTIES;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cashflow_categories');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return INITIAL_CATEGORIES;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cashflow_transactions');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cashflow_audit_logs');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Persist state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cashflow_accounts', JSON.stringify(accounts));
    }
  }, [accounts]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cashflow_parties', JSON.stringify(parties));
    }
  }, [parties]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cashflow_categories', JSON.stringify(categories));
    }
  }, [categories]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cashflow_transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cashflow_audit_logs', JSON.stringify(auditLogs));
    }
  }, [auditLogs]);

  // Company Switcher
  const setCompany = (companyId: string) => {
    const selected = companies.find(c => c.id === companyId);
    if (selected) {
      setCurrentCompany(selected);
      // Reset filters/searches on company switch
      setSearchQuery('');
    }
  };

  // Balance Calculation Helper for single account
  const getAccountBalance = (accountId: string): number => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return 0;

    let balance = acc.opening_balance_type === 'debit' ? acc.opening_balance : -acc.opening_balance;

    // Filter active company transactions
    transactions
      .filter(tx => tx.company_id === currentCompany.id && tx.status === 'active')
      .forEach(tx => {
        tx.entries?.forEach(entry => {
          if (entry.account_id === accountId) {
            // For asset accounts (Cash & Bank):
            // Debit increases balance, Credit decreases balance
            balance += (entry.debit || 0) - (entry.credit || 0);
          }
        });
      });

    return balance;
  };

  // Add Account
  const addAccount = (accountData: Omit<Account, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
    const newAccount: Account = {
      ...accountData,
      id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      company_id: currentCompany.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setAccounts(prev => [newAccount, ...prev]);

    // Audit log
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      company_id: currentCompany.id,
      action: 'CREATE',
      module: 'ACCOUNT',
      record_id: newAccount.id,
      new_data: { name: newAccount.name, type: newAccount.type, opening_balance: newAccount.opening_balance },
      created_at: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);

    return { success: true };
  };

  // Update Account
  const updateAccount = (id: string, updates: Partial<Account>) => {
    const target = accounts.find(a => a.id === id);
    if (!target) return { success: false, error: 'Account not found' };

    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      company_id: currentCompany.id,
      action: 'UPDATE',
      module: 'ACCOUNT',
      record_id: id,
      old_data: { name: target.name, status: target.status },
      new_data: updates,
      created_at: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);

    return { success: true };
  };

  // Deactivate Account
  const deactivateAccount = (id: string) => {
    return updateAccount(id, { status: 'inactive' });
  };

  // Delete Account (Strict check: cannot delete if transactions linked)
  const deleteAccount = (id: string) => {
    const hasTransactions = transactions.some(tx => 
      tx.company_id === currentCompany.id && 
      tx.entries?.some(e => e.account_id === id)
    );

    if (hasTransactions) {
      return { 
        success: false, 
        error: 'This account cannot be deleted because transactions are linked to it. You can deactivate it instead.' 
      };
    }

    setAccounts(prev => prev.filter(a => a.id !== id));
    return { success: true };
  };

  // Party operations
  const addParty = (partyData: Omit<Party, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
    const newParty: Party = {
      ...partyData,
      id: `pty-${Date.now()}`,
      company_id: currentCompany.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setParties(prev => [newParty, ...prev]);
    return { success: true };
  };

  const updateParty = (id: string, updates: Partial<Party>) => {
    setParties(prev => prev.map(p => p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));
    return { success: true };
  };

  // Category operations
  const addCategory = (catData: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
    const exists = categories.some(c => 
      c.company_id === currentCompany.id && 
      c.name.toLowerCase() === catData.name.toLowerCase() && 
      c.type === catData.type
    );
    if (exists) {
      return { success: false, error: 'A category with this name and type already exists.' };
    }

    const newCat: Category = {
      ...catData,
      id: `cat-${Date.now()}`,
      company_id: currentCompany.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCategories(prev => [newCat, ...prev]);
    return { success: true };
  };

  // Atomic Double-Entry Transaction Creation
  const createTransaction = (data: {
    type: TransactionType;
    date: string;
    amount: number;
    accountId: string;
    toAccountId?: string;
    partyId?: string;
    categoryId?: string;
    referenceNo?: string;
    utrNo?: string;
    chequeNo?: string;
    chequeDate?: string;
    narration: string;
  }) => {
    if (data.amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0.' };
    }

    const sourceAccount = accounts.find(a => a.id === data.accountId);
    if (!sourceAccount || sourceAccount.status !== 'active') {
      return { success: false, error: 'Selected account is invalid or inactive.' };
    }

    // Prefix mapping
    let prefix = 'TX';
    if (data.type === 'cash_receipt') prefix = 'CR';
    else if (data.type === 'cash_payment') prefix = 'CP';
    else if (data.type === 'bank_receipt') prefix = 'BR';
    else if (data.type === 'bank_payment') prefix = 'BP';
    else if (data.type === 'transfer') prefix = 'TR';

    // Generate safe sequential number
    const count = transactions.filter(t => t.company_id === currentCompany.id && t.transaction_type === data.type).length + 1;
    const transactionNo = `${prefix}-${String(count).padStart(6, '0')}`;
    const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Prepare double-entry lines
    const entries: any[] = [];

    if (data.type === 'cash_receipt' || data.type === 'bank_receipt') {
      // Receipt: Asset (Cash/Bank) Debited, Party/Income Credited
      entries.push({
        id: `te-${Date.now()}-1`,
        transaction_id: txId,
        company_id: currentCompany.id,
        account_id: data.accountId,
        debit: data.amount,
        credit: 0
      });
      entries.push({
        id: `te-${Date.now()}-2`,
        transaction_id: txId,
        company_id: currentCompany.id,
        account_id: data.accountId,
        party_id: data.partyId || null,
        category_id: data.categoryId || null,
        debit: 0,
        credit: data.amount
      });
    } else if (data.type === 'cash_payment' || data.type === 'bank_payment') {
      // Payment: Party/Expense Debited, Asset (Cash/Bank) Credited
      entries.push({
        id: `te-${Date.now()}-1`,
        transaction_id: txId,
        company_id: currentCompany.id,
        account_id: data.accountId,
        party_id: data.partyId || null,
        category_id: data.categoryId || null,
        debit: data.amount,
        credit: 0
      });
      entries.push({
        id: `te-${Date.now()}-2`,
        transaction_id: txId,
        company_id: currentCompany.id,
        account_id: data.accountId,
        debit: 0,
        credit: data.amount
      });
    } else if (data.type === 'transfer') {
      if (!data.toAccountId) {
        return { success: false, error: 'Destination account is required for transfers.' };
      }
      if (data.accountId === data.toAccountId) {
        return { success: false, error: 'Source and destination accounts cannot be identical.' };
      }
      const destAccount = accounts.find(a => a.id === data.toAccountId);
      if (!destAccount || destAccount.status !== 'active') {
        return { success: false, error: 'Destination account is invalid or inactive.' };
      }

      // Transfer: Destination Debited (receives money), Source Credited (gives money)
      entries.push({
        id: `te-${Date.now()}-1`,
        transaction_id: txId,
        company_id: currentCompany.id,
        account_id: data.toAccountId,
        debit: data.amount,
        credit: 0
      });
      entries.push({
        id: `te-${Date.now()}-2`,
        transaction_id: txId,
        company_id: currentCompany.id,
        account_id: data.accountId,
        debit: 0,
        credit: data.amount
      });
    }

    const newTransaction: Transaction = {
      id: txId,
      company_id: currentCompany.id,
      transaction_no: transactionNo,
      transaction_type: data.type,
      transaction_date: data.date,
      reference_no: data.referenceNo,
      utr_no: data.utrNo,
      cheque_no: data.chequeNo,
      cheque_date: data.chequeDate,
      narration: data.narration,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      entries
    };

    setTransactions(prev => [newTransaction, ...prev]);

    // Audit log
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      company_id: currentCompany.id,
      action: 'CREATE',
      module: 'TRANSACTION',
      record_id: txId,
      new_data: {
        transaction_no: transactionNo,
        amount: data.amount,
        type: data.type,
        account: sourceAccount.name
      },
      created_at: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);

    return { success: true, transactionNo };
  };

  // Void Transaction
  const voidTransaction = (id: string, reason: string) => {
    const target = transactions.find(t => t.id === id && t.company_id === currentCompany.id);
    if (!target) return { success: false, error: 'Transaction not found' };
    if (target.status === 'voided') return { success: false, error: 'Transaction is already voided' };

    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'voided',
          void_reason: reason,
          voided_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    }));

    // Audit log
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      company_id: currentCompany.id,
      action: 'VOID',
      module: 'TRANSACTION',
      record_id: id,
      old_data: { status: 'active', transaction_no: target.transaction_no },
      new_data: { status: 'voided', void_reason: reason },
      created_at: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);

    return { success: true };
  };

  // Edit Transaction metadata
  const editTransaction = (id: string, data: {
    date: string;
    referenceNo?: string;
    utrNo?: string;
    chequeNo?: string;
    chequeDate?: string;
    narration: string;
  }) => {
    const target = transactions.find(t => t.id === id && t.company_id === currentCompany.id);
    if (!target) return { success: false, error: 'Transaction not found' };
    if (target.status === 'voided') return { success: false, error: 'Voided transactions cannot be edited' };

    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          transaction_date: data.date,
          reference_no: data.referenceNo,
          utr_no: data.utrNo,
          cheque_no: data.chequeNo,
          cheque_date: data.chequeDate,
          narration: data.narration,
          updated_at: new Date().toISOString()
        };
      }
      return t;
    }));

    // Audit log
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      company_id: currentCompany.id,
      action: 'UPDATE',
      module: 'TRANSACTION',
      record_id: id,
      old_data: { narration: target.narration, date: target.transaction_date },
      new_data: data,
      created_at: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);

    return { success: true };
  };

  // Calculate Account Running Ledger
  const getAccountRunningLedger = (accountId: string, fromDate?: string, toDate?: string) => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) {
      return { openingBalance: 0, entries: [], totalDebit: 0, totalCredit: 0, closingBalance: 0 };
    }

    let runningBal = acc.opening_balance_type === 'debit' ? acc.opening_balance : -acc.opening_balance;
    let periodOpening = runningBal;

    // Sort active company transactions chronologically
    const sorted = [...transactions]
      .filter(tx => tx.company_id === currentCompany.id && tx.status === 'active')
      .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

    const resultEntries: any[] = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const tx of sorted) {
      const entry = tx.entries?.find(e => e.account_id === accountId);
      if (!entry) continue;

      const isBeforeFromDate = fromDate && tx.transaction_date < fromDate;
      const isAfterToDate = toDate && tx.transaction_date > toDate;

      const d = entry.debit || 0;
      const c = entry.credit || 0;
      runningBal += d - c;

      if (isBeforeFromDate) {
        // Accumulate into period opening balance
        periodOpening = runningBal;
        continue;
      }

      if (isAfterToDate) {
        continue;
      }

      totalDebit += d;
      totalCredit += c;

      const party = tx.entries?.find(e => e.party_id)?.party_id 
        ? parties.find(p => p.id === tx.entries?.find(e => e.party_id)?.party_id)?.name 
        : undefined;

      resultEntries.push({
        date: tx.transaction_date,
        transactionNo: tx.transaction_no,
        transactionId: tx.id,
        type: tx.transaction_type,
        description: tx.narration || tx.transaction_type.replace('_', ' ').toUpperCase(),
        reference: tx.reference_no || tx.utr_no || tx.cheque_no,
        partyName: party,
        debit: d,
        credit: c,
        balance: runningBal
      });
    }

    return {
      openingBalance: fromDate ? periodOpening : (acc.opening_balance_type === 'debit' ? acc.opening_balance : -acc.opening_balance),
      entries: resultEntries,
      totalDebit,
      totalCredit,
      closingBalance: runningBal
    };
  };

  // Dashboard Metrics
  const getDashboardMetrics = (): DashboardMetrics => {
    let cashBal = 0;
    let bankBal = 0;

    accounts.filter(a => a.company_id === currentCompany.id && a.status === 'active').forEach(a => {
      const bal = getAccountBalance(a.id);
      if (a.type === 'cash') cashBal += bal;
      else bankBal += bal;
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const currentYearMonth = todayStr.substring(0, 7);

    let todayReceipts = 0;
    let todayPayments = 0;
    let monthReceipts = 0;
    let monthPayments = 0;

    transactions
      .filter(tx => tx.company_id === currentCompany.id && tx.status === 'active')
      .forEach(tx => {
        // Calculate amount of transaction
        const amount = tx.entries?.reduce((max, e) => Math.max(max, e.debit || 0), 0) || 0;

        const isToday = tx.transaction_date === todayStr;
        const isThisMonth = tx.transaction_date.startsWith(currentYearMonth);

        if (tx.transaction_type === 'cash_receipt' || tx.transaction_type === 'bank_receipt') {
          if (isToday) todayReceipts += amount;
          if (isThisMonth) monthReceipts += amount;
        } else if (tx.transaction_type === 'cash_payment' || tx.transaction_type === 'bank_payment') {
          if (isToday) todayPayments += amount;
          if (isThisMonth) monthPayments += amount;
        }
      });

    return {
      totalCashBalance: cashBal,
      totalBankBalance: bankBal,
      totalBalance: cashBal + bankBal,
      todayReceipts,
      todayPayments,
      monthReceipts,
      monthPayments,
    };
  };

  // Chart data: Cash vs Bank breakdown
  const getCashVsBankData = () => {
    const metrics = getDashboardMetrics();
    return [
      { name: 'Total Cash', value: Math.max(0, metrics.totalCashBalance) },
      { name: 'Total Bank', value: Math.max(0, metrics.totalBankBalance) },
    ];
  };

  // Chart data: Transaction volume timeline
  const getTransactionTimelineData = () => {
    const datesMap: Record<string, { receipts: number; payments: number }> = {};

    // Group last 7 distinct transaction dates or default dates
    transactions
      .filter(tx => tx.company_id === currentCompany.id && tx.status === 'active')
      .forEach(tx => {
        const d = tx.transaction_date;
        if (!datesMap[d]) datesMap[d] = { receipts: 0, payments: 0 };
        const amt = tx.entries?.reduce((max, e) => Math.max(max, e.debit || 0), 0) || 0;
        if (tx.transaction_type.includes('receipt')) {
          datesMap[d].receipts += amt;
        } else if (tx.transaction_type.includes('payment')) {
          datesMap[d].payments += amt;
        }
      });

    const sortedDates = Object.keys(datesMap).sort();
    return sortedDates.map(date => ({
      date,
      receipts: datesMap[date].receipts,
      payments: datesMap[date].payments,
    }));
  };

  return (
    <AppContext.Provider
      value={{
        currentCompany,
        companies,
        accounts: accounts.filter(a => a.company_id === currentCompany.id),
        parties: parties.filter(p => p.company_id === currentCompany.id),
        categories: categories.filter(c => c.company_id === currentCompany.id),
        transactions: transactions.filter(t => t.company_id === currentCompany.id),
        auditLogs: auditLogs.filter(l => l.company_id === currentCompany.id),
        searchQuery,
        setSearchQuery,
        setCompany,
        addAccount,
        updateAccount,
        deactivateAccount,
        deleteAccount,
        addParty,
        updateParty,
        addCategory,
        createTransaction,
        voidTransaction,
        editTransaction,
        getAccountBalance,
        getAccountRunningLedger,
        getDashboardMetrics,
        getCashVsBankData,
        getTransactionTimelineData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
