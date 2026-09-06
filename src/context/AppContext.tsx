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
  TransactionType,
  UserProfile
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
  customPartyRoles: string[];
  addPartyRole: (role: string) => void;
  addParty: (party: Omit<Party, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => { success: boolean; party?: Party; error?: string };
  updateParty: (id: string, updates: Partial<Party>) => { success: boolean; error?: string };

  // Theme support
  theme: 'light' | 'dark';
  toggleTheme: () => void;

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
  deleteTransaction: (id: string) => { success: boolean; error?: string };
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

  // Authentication
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password?: string, fullName?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentCompany, setCurrentCompany] = useState<Company>(DEMO_COMPANY);
  const [companies] = useState<Company[]>(DEMO_COMPANIES);
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [customPartyRoles, setCustomPartyRoles] = useState<string[]>(['Customer', 'Supplier / Vendor', 'Other Entity']);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smartmoney_theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const addPartyRole = (role: string) => {
    const trimmed = role.trim();
    if (!trimmed) return;
    setCustomPartyRoles(prev => {
      if (prev.some(r => r.toLowerCase() === trimmed.toLowerCase())) return prev;
      const updated = [...prev, trimmed];
      if (typeof window !== 'undefined' && currentUser) {
        const storagePrefix = currentUser.id === 'usr-admin-01' ? 'cashflow_demo_' : `cashflow_${currentUser.id}_`;
        localStorage.setItem(`${storagePrefix}party_roles`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const loadUserDataForProfile = (user: UserProfile) => {
    setCurrentUser(user);
    if (typeof window === 'undefined') return;

    localStorage.setItem('cashflow_user', JSON.stringify(user));
    const isDemoAdmin = user.id === 'usr-admin-01' || user.email?.toLowerCase() === 'admin@apex.corp';
    const storagePrefix = isDemoAdmin ? 'cashflow_demo_' : `cashflow_${user.id}_`;

    const savedRoles = localStorage.getItem(`${storagePrefix}party_roles`);
    if (savedRoles) {
      setCustomPartyRoles(JSON.parse(savedRoles));
    } else {
      setCustomPartyRoles(['Customer', 'Supplier / Vendor', 'Other Entity']);
    }

    // Initialize or load user company entity
    if (!isDemoAdmin) {
      const userCompanyName = user.name ? `${user.name}'s Account` : (user.email ? `${user.email.split('@')[0]}'s Treasury` : 'My Financial Entity');
      const userCompany: Company = {
        id: `comp-${user.id}`,
        name: userCompanyName,
        tax_id: 'Primary Account',
        currency: 'INR',
        currency_symbol: '₹',
        financial_year_start: '2026-04-01',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setCurrentCompany(userCompany);
    } else {
      setCurrentCompany(DEMO_COMPANY);
    }

    const savedAccounts = localStorage.getItem(`${storagePrefix}accounts`);
    if (savedAccounts !== null) {
      setAccounts(JSON.parse(savedAccounts));
    } else {
      setAccounts(isDemoAdmin ? INITIAL_ACCOUNTS : []);
    }

    const savedParties = localStorage.getItem(`${storagePrefix}parties`);
    if (savedParties !== null) {
      setParties(JSON.parse(savedParties));
    } else {
      setParties(isDemoAdmin ? INITIAL_PARTIES : []);
    }

    const savedCategories = localStorage.getItem(`${storagePrefix}categories`);
    if (savedCategories !== null) {
      setCategories(JSON.parse(savedCategories));
    } else {
      setCategories(INITIAL_CATEGORIES);
    }

    const savedTransactions = localStorage.getItem(`${storagePrefix}transactions`);
    if (savedTransactions !== null) {
      setTransactions(JSON.parse(savedTransactions));
    } else {
      setTransactions(isDemoAdmin ? INITIAL_TRANSACTIONS : []);
    }

    const savedLogs = localStorage.getItem(`${storagePrefix}audit_logs`);
    if (savedLogs !== null) {
      setAuditLogs(JSON.parse(savedLogs));
    } else {
      setAuditLogs(isDemoAdmin ? INITIAL_AUDIT_LOGS : []);
    }
  };

  // Hydrate from localStorage client-side once mounted to prevent SSR hydration mismatch
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('smartmoney_theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        // Default to dark theme
        document.documentElement.classList.add('dark');
      }

      const savedUserStr = localStorage.getItem('cashflow_user');
      if (savedUserStr) {
        const user: UserProfile = JSON.parse(savedUserStr);
        loadUserDataForProfile(user);
      } else {
        // Fallback default admin state so accounts and graphs work out-of-the-box
        const defaultUser: UserProfile = {
          id: 'usr-admin-01',
          name: 'Anit Rajput',
          email: 'admin@apex.corp',
          role: 'owner',
        };
        loadUserDataForProfile(defaultUser);
      }
    } catch (e) {
      console.error('Failed to load local storage state', e);
      setAccounts([]);
      setParties([]);
      setCategories(INITIAL_CATEGORIES);
      setTransactions([]);
      setAuditLogs([]);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const login = async (email: string, password?: string) => {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid corporate email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // Fallback for registered demo accounts if Supabase user not yet confirmed
        if (email.toLowerCase() === 'admin@apex.corp' && password === 'admin123') {
          const demoUser: UserProfile = {
            id: 'usr-admin-01',
            name: 'Anit Rajput',
            email: 'admin@apex.corp',
            role: 'owner',
          };
          loadUserDataForProfile(demoUser);
          return { success: true };
        }
        return { success: false, error: error.message || 'Invalid credentials' };
      }

      if (data.user) {
        const loggedUser: UserProfile = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || email.split('@')[0].toUpperCase(),
          email: data.user.email || email,
          role: 'accountant',
        };
        loadUserDataForProfile(loggedUser);
        return { success: true };
      }

      return { success: false, error: 'User record not found.' };
    } catch (err: any) {
      // If network fails, check demo admin account credentials
      if (email.toLowerCase() === 'admin@apex.corp' && password === 'admin123') {
        const demoUser: UserProfile = {
          id: 'usr-admin-01',
          name: 'Anit Rajput',
          email: 'admin@apex.corp',
          role: 'owner',
        };
        loadUserDataForProfile(demoUser);
        return { success: true };
      }
      return { success: false, error: err.message || 'Authentication failed' };
    }
  };

  const signUp = async (email: string, password?: string, fullName?: string) => {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid corporate email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session && data.user) {
        const loggedUser: UserProfile = {
          id: data.user.id,
          name: fullName || data.user.user_metadata?.full_name || email.split('@')[0].toUpperCase(),
          email: data.user.email || email,
          role: 'owner',
        };
        loadUserDataForProfile(loggedUser);
        return { success: true };
      }

      return {
        success: true,
        message: 'Account registered successfully! Please sign in with your credentials.',
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    } finally {
      setCurrentUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cashflow_user');
        window.location.href = '/login';
      }
    }
  };

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Persist state changes only after client hydration is complete
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined' && currentUser) {
      const storagePrefix = currentUser.id === 'usr-admin-01' ? 'cashflow_demo_' : `cashflow_${currentUser.id}_`;
      localStorage.setItem(`${storagePrefix}accounts`, JSON.stringify(accounts));
    }
  }, [accounts, isHydrated, currentUser]);

  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined' && currentUser) {
      const storagePrefix = currentUser.id === 'usr-admin-01' ? 'cashflow_demo_' : `cashflow_${currentUser.id}_`;
      localStorage.setItem(`${storagePrefix}parties`, JSON.stringify(parties));
    }
  }, [parties, isHydrated, currentUser]);

  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined' && currentUser) {
      const storagePrefix = currentUser.id === 'usr-admin-01' ? 'cashflow_demo_' : `cashflow_${currentUser.id}_`;
      localStorage.setItem(`${storagePrefix}categories`, JSON.stringify(categories));
    }
  }, [categories, isHydrated, currentUser]);

  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined' && currentUser) {
      const storagePrefix = currentUser.id === 'usr-admin-01' ? 'cashflow_demo_' : `cashflow_${currentUser.id}_`;
      localStorage.setItem(`${storagePrefix}transactions`, JSON.stringify(transactions));
    }
  }, [transactions, isHydrated, currentUser]);

  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined' && currentUser) {
      const storagePrefix = currentUser.id === 'usr-admin-01' ? 'cashflow_demo_' : `cashflow_${currentUser.id}_`;
      localStorage.setItem(`${storagePrefix}audit_logs`, JSON.stringify(auditLogs));
    }
  }, [auditLogs, isHydrated, currentUser]);

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
    let balance = acc ? (acc.opening_balance_type === 'debit' ? acc.opening_balance : -acc.opening_balance) : 0;

    // Filter active company transactions
    transactions
      .filter(tx => (tx.company_id === currentCompany.id || !tx.company_id) && tx.status === 'active')
      .forEach(tx => {
        if (!tx.entries || tx.entries.length === 0) return;

        if (tx.transaction_type === 'cash_receipt' || tx.transaction_type === 'bank_receipt') {
          // In receipts, the asset account is debited (+ balance) on the primary leg (without party_id/category_id)
          // or we check the entry where account_id matches and debit > 0
          const debitEntry = tx.entries.find(e => e.account_id === accountId && (e.debit || 0) > 0);
          if (debitEntry) {
            balance += debitEntry.debit;
          }
        } else if (tx.transaction_type === 'cash_payment' || tx.transaction_type === 'bank_payment') {
          // In payments, the asset account is credited (- balance)
          const creditEntry = tx.entries.find(e => e.account_id === accountId && (e.credit || 0) > 0);
          if (creditEntry) {
            balance -= creditEntry.credit;
          }
        } else if (tx.transaction_type === 'transfer') {
          // In transfer, destination account is debited (+), source account is credited (-)
          tx.entries.forEach(entry => {
            if (entry.account_id === accountId) {
              balance += (entry.debit || 0) - (entry.credit || 0);
            }
          });
        }
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
    return { success: true, party: newParty };
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

  // Delete Transaction (Permanent removal)
  const deleteTransaction = (id: string) => {
    const target = transactions.find(t => t.id === id && t.company_id === currentCompany.id);
    if (!target) return { success: false, error: 'Transaction not found' };

    setTransactions(prev => prev.filter(t => t.id !== id));

    // Audit log
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      company_id: currentCompany.id,
      action: 'DELETE',
      module: 'TRANSACTION',
      record_id: id,
      old_data: { transaction_no: target.transaction_no, type: target.transaction_type, status: target.status },
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

    const companyAccounts = accounts.filter(a => (a.company_id === currentCompany.id || !a.company_id) && a.status === 'active');
    
    // If no filtered accounts, fallback to all accounts
    const targetAccounts = companyAccounts.length > 0 ? companyAccounts : accounts;

    targetAccounts.forEach(a => {
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
      .filter(tx => (tx.company_id === currentCompany.id || !tx.company_id) && tx.status === 'active')
      .forEach(tx => {
        // Calculate amount of transaction
        let amount = tx.amount || 0;
        if (!amount && tx.entries && tx.entries.length > 0) {
          amount = tx.entries.reduce((max, e) => Math.max(max, e.debit || 0, e.credit || 0), 0);
        }

        const isToday = tx.transaction_date === todayStr;
        const isThisMonth = tx.transaction_date?.startsWith(currentYearMonth) || tx.transaction_date?.includes(`-${currentYearMonth.split('-')[1]}-`);

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
        accounts: accounts.filter(a => a.company_id === currentCompany.id).length > 0 ? accounts.filter(a => a.company_id === currentCompany.id) : accounts,
        parties: parties.filter(p => p.company_id === currentCompany.id).length > 0 ? parties.filter(p => p.company_id === currentCompany.id) : parties,
        customPartyRoles,
        addPartyRole,
        theme,
        toggleTheme,
        categories: categories.filter(c => c.company_id === currentCompany.id).length > 0 ? categories.filter(c => c.company_id === currentCompany.id) : categories,
        transactions: transactions.filter(t => t.company_id === currentCompany.id).length > 0 ? transactions.filter(t => t.company_id === currentCompany.id) : transactions,
        auditLogs: auditLogs.filter(l => l.company_id === currentCompany.id).length > 0 ? auditLogs.filter(l => l.company_id === currentCompany.id) : auditLogs,
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
        deleteTransaction,
        editTransaction,
        getAccountBalance,
        getAccountRunningLedger,
        getDashboardMetrics,
        getCashVsBankData,
        getTransactionTimelineData,
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isHydrated,
        login,
        signUp,
        logout,
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
