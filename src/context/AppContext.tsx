'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Company, 
  Account, 
  Party, 
  Category, 
  Transaction, 
  TransactionEntry,
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
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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
  updatePartyRole: (oldRole: string, newRole: string) => void;
  deletePartyRole: (role: string) => void;
  addParty: (party: Omit<Party, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => { success: boolean; party?: Party; error?: string };
  updateParty: (id: string, updates: Partial<Party>) => { success: boolean; error?: string };
  deleteParty: (id: string) => { success: boolean; error?: string };

  // Theme support
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Category operations
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => { success: boolean; error?: string };
  updateCategory: (id: string, updates: Partial<Category>) => { success: boolean; error?: string };
  deleteCategory: (id: string) => { success: boolean; error?: string };

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

  // Mobile navigation
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [companies, setCompanies] = useState<Company[]>([DEMO_COMPANY]);
  const [currentCompany, setCurrentCompany] = useState<Company>(DEMO_COMPANY);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [customPartyRoles, setCustomPartyRoles] = useState<string[]>(['Customer', 'Supplier / Vendor', 'Other Entity']);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

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

  const updatePartyRole = (oldRole: string, newRole: string) => {
    const trimmedNew = newRole.trim();
    if (!trimmedNew || !oldRole) return;
    setCustomPartyRoles(prev => {
      const updated = prev.map(r => r === oldRole ? trimmedNew : r);
      if (typeof window !== 'undefined' && currentUser) {
        const storagePrefix = currentUser.id === 'usr-admin-01' ? 'cashflow_demo_' : `cashflow_${currentUser.id}_`;
        localStorage.setItem(`${storagePrefix}party_roles`, JSON.stringify(updated));
      }
      return updated;
    });

    setParties(prev => prev.map(p => {
      if (p.type.toLowerCase() === oldRole.toLowerCase()) {
        return { ...p, type: trimmedNew, updated_at: new Date().toISOString() };
      }
      return p;
    }));
  };

  const deletePartyRole = (role: string) => {
    setCustomPartyRoles(prev => {
      const updated = prev.filter(r => r !== role);
      if (typeof window !== 'undefined' && currentUser) {
        const storagePrefix = currentUser.id === 'usr-admin-01' ? 'cashflow_demo_' : `cashflow_${currentUser.id}_`;
        localStorage.setItem(`${storagePrefix}party_roles`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Helper to ensure company row exists in DB before any child record insert
  const ensureCompanyExistsInDb = async (supabase: any, companyId: string, companyName: string, userId: string) => {
    try {
      await supabase.from('companies').upsert({
        id: companyId,
        name: companyName,
        tax_id: 'Primary Account',
        currency: 'INR',
        currency_symbol: '₹',
        financial_year_start: '2026-04-01',
      }, { onConflict: 'id' });

      await supabase.from('company_users').upsert({
        company_id: companyId,
        user_id: userId,
        role: 'owner',
      }, { onConflict: 'company_id,user_id' });
    } catch (e) {
      console.warn('Error verifying company in Supabase:', e);
    }
  };

  // Helper to sync Supabase Cloud Database for an authenticated user
  const syncSupabaseUserData = async (user: UserProfile) => {
    if (!isSupabaseConfigured || user.id === 'usr-admin-01') {
      return;
    }

    try {
      const supabase = createClient();
      const compName = user.name ? `${user.name}'s Organization` : (user.email ? `${user.email.split('@')[0]}'s Organization` : 'My Organization');

      // 1. Get or create Company for this user
      let companyId: string = user.id;
      let activeCompany: Company | null = null;

      // Check if user is linked in company_users
      const { data: userCompData } = await supabase
        .from('company_users')
        .select('company_id, role, companies (*)')
        .eq('user_id', user.id)
        .limit(1);

      if (userCompData && userCompData.length > 0 && userCompData[0].companies) {
        const c = Array.isArray(userCompData[0].companies) ? userCompData[0].companies[0] : userCompData[0].companies;
        companyId = c.id;
        activeCompany = {
          id: c.id,
          name: c.name || compName,
          tax_id: c.tax_id || '',
          currency: c.currency || 'INR',
          currency_symbol: c.currency_symbol || '₹',
          financial_year_start: c.financial_year_start || '2026-04-01',
          created_at: c.created_at || new Date().toISOString(),
          updated_at: c.updated_at || new Date().toISOString(),
        };
      } else {
        // Try RPC
        const { data: rpcData } = await supabase.rpc('provision_user_company', {
          p_company_name: compName,
        });

        if (rpcData && rpcData.company_id) {
          companyId = rpcData.company_id;
        } else {
          // Direct Upsert with user.id as deterministic company UUID
          companyId = user.id;
          await ensureCompanyExistsInDb(supabase, companyId, compName, user.id);
        }

        activeCompany = {
          id: companyId,
          name: compName,
          tax_id: 'Primary Account',
          currency: 'INR',
          currency_symbol: '₹',
          financial_year_start: '2026-04-01',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      setCurrentCompany(activeCompany);
      setCompanies([activeCompany]);
      localStorage.setItem(`cashflow_${user.id}_company`, JSON.stringify(activeCompany));

      // Ensure default categories exist in Supabase
      const { data: existingCats } = await supabase
        .from('categories')
        .select('id')
        .eq('company_id', companyId)
        .limit(1);

      if (!existingCats || existingCats.length === 0) {
        const initialCategoriesToInsert = INITIAL_CATEGORIES.map(cat => ({
          id: generateUUID(),
          company_id: companyId,
          name: cat.name,
          type: cat.type,
          description: cat.description || '',
          status: 'active',
        }));
        await supabase.from('categories').insert(initialCategoriesToInsert);
      }

      // 2. Fetch Accounts
      const { data: dbAccounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (dbAccounts) {
        const loadedAccounts = dbAccounts.map((a: any) => ({
          id: a.id,
          company_id: a.company_id,
          name: a.name,
          type: a.type,
          bank_name: a.bank_name || '',
          account_number: a.account_number || '',
          ifsc: a.ifsc || '',
          branch: a.branch || '',
          opening_balance: Number(a.opening_balance) || 0,
          opening_balance_type: a.opening_balance_type || 'debit',
          description: a.description || '',
          status: a.status || 'active',
          created_at: a.created_at,
          updated_at: a.updated_at,
        }));
        setAccounts(loadedAccounts);
        localStorage.setItem(`cashflow_${user.id}_accounts`, JSON.stringify(loadedAccounts));
      }

      // 3. Fetch Parties
      const { data: dbParties } = await supabase
        .from('parties')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (dbParties) {
        const loadedParties = dbParties.map((p: any) => ({
          id: p.id,
          company_id: p.company_id,
          name: p.name,
          type: p.type,
          phone: p.phone || '',
          email: p.email || '',
          address: p.address || '',
          opening_balance: Number(p.opening_balance) || 0,
          status: p.status || 'active',
          created_at: p.created_at,
          updated_at: p.updated_at,
        }));
        setParties(loadedParties);
        localStorage.setItem(`cashflow_${user.id}_parties`, JSON.stringify(loadedParties));
      }

      // 4. Fetch Categories
      const { data: dbCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true });

      if (dbCategories && dbCategories.length > 0) {
        const loadedCats = dbCategories.map((c: any) => ({
          id: c.id,
          company_id: c.company_id,
          name: c.name,
          type: c.type,
          description: c.description || '',
          status: c.status || 'active',
          created_at: c.created_at,
          updated_at: c.updated_at,
        }));
        setCategories(loadedCats);
        localStorage.setItem(`cashflow_${user.id}_categories`, JSON.stringify(loadedCats));
      }

      // 5. Fetch Transactions and Entries
      const { data: dbTransactions } = await supabase
        .from('transactions')
        .select(`
          *,
          entries:transaction_entries(*)
        `)
        .eq('company_id', companyId)
        .order('transaction_date', { ascending: false });

      if (dbTransactions) {
        const loadedTransactions = dbTransactions.map((t: any) => ({
          id: t.id,
          company_id: t.company_id,
          transaction_no: t.transaction_no,
          transaction_type: t.transaction_type,
          transaction_date: t.transaction_date,
          reference_no: t.reference_no || '',
          utr_no: t.utr_no || '',
          cheque_no: t.cheque_no || '',
          cheque_date: t.cheque_date || '',
          narration: t.narration || '',
          status: t.status || 'active',
          void_reason: t.void_reason || '',
          voided_by: t.voided_by || '',
          voided_at: t.voided_at || '',
          created_at: t.created_at,
          updated_at: t.updated_at,
          entries: (t.entries || []).map((e: any) => ({
            id: e.id,
            transaction_id: e.transaction_id,
            company_id: e.company_id,
            account_id: e.account_id,
            party_id: e.party_id,
            category_id: e.category_id,
            debit: Number(e.debit) || 0,
            credit: Number(e.credit) || 0,
            created_at: e.created_at,
          })),
        }));
        setTransactions(loadedTransactions);
        localStorage.setItem(`cashflow_${user.id}_transactions`, JSON.stringify(loadedTransactions));
      }

      // 6. Fetch Audit Logs
      const { data: dbLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (dbLogs) {
        const loadedLogs = dbLogs.map((l: any) => ({
          id: l.id,
          company_id: l.company_id,
          action: l.action,
          module: l.module,
          record_id: l.record_id,
          old_data: l.old_data,
          new_data: l.new_data,
          created_at: l.created_at,
        }));
        setAuditLogs(loadedLogs);
        localStorage.setItem(`cashflow_${user.id}_audit_logs`, JSON.stringify(loadedLogs));
      }
    } catch (err) {
      console.error('Failed to sync Supabase user data:', err);
    }
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

    if (isDemoAdmin) {
      setCurrentCompany(DEMO_COMPANY);
      setCompanies(DEMO_COMPANIES);
      const savedAccounts = localStorage.getItem(`${storagePrefix}accounts`);
      setAccounts(savedAccounts ? JSON.parse(savedAccounts) : INITIAL_ACCOUNTS);
      const savedParties = localStorage.getItem(`${storagePrefix}parties`);
      setParties(savedParties ? JSON.parse(savedParties) : INITIAL_PARTIES);
      const savedCategories = localStorage.getItem(`${storagePrefix}categories`);
      setCategories(savedCategories ? JSON.parse(savedCategories) : INITIAL_CATEGORIES);
      const savedTransactions = localStorage.getItem(`${storagePrefix}transactions`);
      setTransactions(savedTransactions ? JSON.parse(savedTransactions) : INITIAL_TRANSACTIONS);
      const savedLogs = localStorage.getItem(`${storagePrefix}audit_logs`);
      setAuditLogs(savedLogs ? JSON.parse(savedLogs) : INITIAL_AUDIT_LOGS);
    } else {
      // Check if we have a saved company for this user
      const savedCompStr = localStorage.getItem(`cashflow_${user.id}_company`);
      let userCompany: Company;
      if (savedCompStr) {
        try {
          userCompany = JSON.parse(savedCompStr);
        } catch {
          const userCompanyName = user.name ? `${user.name}'s Organization` : (user.email ? `${user.email.split('@')[0]}'s Organization` : 'My Organization');
          userCompany = {
            id: user.id,
            name: userCompanyName,
            tax_id: 'Primary Account',
            currency: 'INR',
            currency_symbol: '₹',
            financial_year_start: '2026-04-01',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      } else {
        const userCompanyName = user.name ? `${user.name}'s Organization` : (user.email ? `${user.email.split('@')[0]}'s Organization` : 'My Organization');
        userCompany = {
          id: user.id,
          name: userCompanyName,
          tax_id: 'Primary Account',
          currency: 'INR',
          currency_symbol: '₹',
          financial_year_start: '2026-04-01',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      setCurrentCompany(userCompany);
      setCompanies([userCompany]);

      // Load local cache immediately for fast render
      const savedAccounts = localStorage.getItem(`${storagePrefix}accounts`);
      setAccounts(savedAccounts ? JSON.parse(savedAccounts) : []);
      const savedParties = localStorage.getItem(`${storagePrefix}parties`);
      setParties(savedParties ? JSON.parse(savedParties) : []);
      const savedCategories = localStorage.getItem(`${storagePrefix}categories`);
      setCategories(savedCategories ? JSON.parse(savedCategories) : INITIAL_CATEGORIES);
      const savedTransactions = localStorage.getItem(`${storagePrefix}transactions`);
      setTransactions(savedTransactions ? JSON.parse(savedTransactions) : []);
      const savedLogs = localStorage.getItem(`${storagePrefix}audit_logs`);
      setAuditLogs(savedLogs ? JSON.parse(savedLogs) : []);

      // Trigger cloud sync
      syncSupabaseUserData(user);
    }
  };

  // Hydrate client-side once mounted and check active Supabase Auth session
  useEffect(() => {
    async function initAuthAndData() {
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
          document.documentElement.classList.add('dark');
        }

        // Check if there is an active Supabase user session
        if (isSupabaseConfigured) {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const loggedUser: UserProfile = {
              id: session.user.id,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0].toUpperCase() || 'User',
              email: session.user.email || '',
              role: 'owner',
            };
            loadUserDataForProfile(loggedUser);
            setIsHydrated(true);
            return;
          }
        }

        const savedUserStr = localStorage.getItem('cashflow_user');
        if (savedUserStr) {
          const user: UserProfile = JSON.parse(savedUserStr);
          loadUserDataForProfile(user);
        } else {
          const defaultUser: UserProfile = {
            id: 'usr-admin-01',
            name: 'Anit Rajput',
            email: 'admin@apex.corp',
            role: 'owner',
          };
          loadUserDataForProfile(defaultUser);
        }
      } catch (e) {
        console.error('Failed to initialize app state:', e);
      } finally {
        setIsHydrated(true);
      }
    }

    initAuthAndData();
  }, []);

  // Supabase Realtime Channel for Multi-Tab / Multi-Device Synchronization
  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser || currentUser.id === 'usr-admin-01') return;

    const supabase = createClient();
    const channel = supabase
      .channel(`realtime-sync-${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        syncSupabaseUserData(currentUser);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaction_entries' }, () => {
        syncSupabaseUserData(currentUser);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, () => {
        syncSupabaseUserData(currentUser);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parties' }, () => {
        syncSupabaseUserData(currentUser);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        syncSupabaseUserData(currentUser);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  const login = async (email: string, password?: string) => {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid corporate email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
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
          role: 'owner',
        };
        loadUserDataForProfile(loggedUser);
        await syncSupabaseUserData(loggedUser);
        return { success: true };
      }

      return { success: false, error: 'User record not found.' };
    } catch (err: any) {
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
        await syncSupabaseUserData(loggedUser);
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

  // Local storage caching for offline backup
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

  const setCompany = (companyId: string) => {
    const selected = companies.find(c => c.id === companyId);
    if (selected) {
      setCurrentCompany(selected);
      setSearchQuery('');
    }
  };

  const getAccountBalance = (accountId: string): number => {
    const acc = accounts.find(a => a.id === accountId);
    let balance = acc ? (acc.opening_balance_type === 'debit' ? acc.opening_balance : -acc.opening_balance) : 0;

    transactions
      .filter(tx => (tx.company_id === currentCompany.id || !tx.company_id) && tx.status === 'active')
      .forEach(tx => {
        if (!tx.entries || tx.entries.length === 0) return;

        if (tx.transaction_type === 'cash_receipt' || tx.transaction_type === 'bank_receipt') {
          const debitEntry = tx.entries.find(e => e.account_id === accountId && (e.debit || 0) > 0);
          if (debitEntry) {
            balance += debitEntry.debit;
          }
        } else if (tx.transaction_type === 'cash_payment' || tx.transaction_type === 'bank_payment') {
          const creditEntry = tx.entries.find(e => e.account_id === accountId && (e.credit || 0) > 0);
          if (creditEntry) {
            balance -= creditEntry.credit;
          }
        } else if (tx.transaction_type === 'transfer') {
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
    const newId = generateUUID();
    const newAccount: Account = {
      ...accountData,
      id: newId,
      company_id: currentCompany.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setAccounts(prev => [newAccount, ...prev]);

    // Database persistence
    if (isSupabaseConfigured && currentUser && currentUser.id !== 'usr-admin-01') {
      (async () => {
        try {
          const supabase = createClient();
          await ensureCompanyExistsInDb(supabase, currentCompany.id, currentCompany.name, currentUser.id);
          const { error } = await supabase.from('accounts').insert({
            id: newId,
            company_id: currentCompany.id,
            name: accountData.name,
            type: accountData.type,
            bank_name: accountData.bank_name || null,
            account_number: accountData.account_number || null,
            ifsc: accountData.ifsc || null,
            branch: accountData.branch || null,
            opening_balance: accountData.opening_balance || 0,
            opening_balance_type: accountData.opening_balance_type || 'debit',
            description: accountData.description || null,
            status: accountData.status || 'active',
          });
          if (error) {
            console.error('Supabase error on addAccount:', error.message, error.details, error.hint, error.code);
          }
        } catch (err: any) {
          console.error('Failed to insert account in Supabase:', err?.message || err);
        }
      })();
    }

    const log: AuditLog = {
      id: generateUUID(),
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

    if (isSupabaseConfigured && currentUser && currentUser.id !== 'usr-admin-01') {
      (async () => {
        try {
          const supabase = createClient();
          await ensureCompanyExistsInDb(supabase, currentCompany.id, currentCompany.name, currentUser.id);
          const { error } = await supabase.from('accounts').update({
            ...updates,
            updated_at: new Date().toISOString(),
          }).eq('id', id).eq('company_id', currentCompany.id);
          if (error) {
            console.error('Supabase error on updateAccount:', error);
          }
        } catch (err) {
          console.error('Failed to update account in Supabase:', err);
        }
      })();
    }

    const log: AuditLog = {
      id: generateUUID(),
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

  const deactivateAccount = (id: string) => {
    return updateAccount(id, { status: 'inactive' });
  };

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

    if (isSupabaseConfigured && currentUser && currentUser.id !== 'usr-admin-01') {
      (async () => {
        try {
          const supabase = createClient();
          await supabase.from('accounts').delete().eq('id', id).eq('company_id', currentCompany.id);
        } catch (err) {
          console.error('Failed to delete account in Supabase:', err);
        }
      })();
    }

    return { success: true };
  };

  // Party operations
  const addParty = (partyData: Omit<Party, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
    const newId = generateUUID();
    const newParty: Party = {
      ...partyData,
      id: newId,
      company_id: currentCompany.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setParties(prev => [newParty, ...prev]);

    if (isSupabaseConfigured && currentUser && currentUser.id !== 'usr-admin-01') {
      (async () => {
        try {
          const supabase = createClient();
          await ensureCompanyExistsInDb(supabase, currentCompany.id, currentCompany.name, currentUser.id);
          const lowerType = (partyData.type || '').toLowerCase();
          const dbPartyType = lowerType.includes('supp') || lowerType.includes('vend') ? 'supplier' : (lowerType.includes('cust') ? 'customer' : 'other');

          const { error } = await supabase.from('parties').insert({
            id: newId,
            company_id: currentCompany.id,
            name: partyData.name,
            type: dbPartyType,
            phone: partyData.phone || null,
            email: partyData.email || null,
            address: partyData.address || null,
            opening_balance: partyData.opening_balance || 0,
            status: partyData.status || 'active',
          });
          if (error) {
            console.error('Supabase error on addParty:', error.message, error.details, error.hint, error.code);
          }
        } catch (err: any) {
          console.error('Failed to insert party in Supabase:', err?.message || err);
        }
      })();
    }

    return { success: true, party: newParty };
  };

  const updateParty = (id: string, updates: Partial<Party>) => {
    setParties(prev => prev.map(p => p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));

    if (isSupabaseConfigured && currentUser && currentUser.id !== 'usr-admin-01') {
      (async () => {
        try {
          const supabase = createClient();
          await ensureCompanyExistsInDb(supabase, currentCompany.id, currentCompany.name, currentUser.id);
          const payload: any = { ...updates, updated_at: new Date().toISOString() };
          if (updates.type) {
            const lowerType = updates.type.toLowerCase();
            payload.type = lowerType.includes('supp') || lowerType.includes('vend') ? 'supplier' : (lowerType.includes('cust') ? 'customer' : 'other');
          }
          const { error } = await supabase.from('parties').update(payload).eq('id', id).eq('company_id', currentCompany.id);
          if (error) {
            console.error('Supabase error on updateParty:', error.message, error.details, error.hint, error.code);
          }
        } catch (err: any) {
          console.error('Failed to update party in Supabase:', err?.message || err);
        }
      })();
    }

    return { success: true };
  };

  const deleteParty = (id: string) => {
    const hasTransactions = transactions.some(tx => 
      tx.company_id === currentCompany.id && 
      tx.entries?.some(e => e.party_id === id)
    );

    if (hasTransactions) {
      return { 
        success: false, 
        error: 'This party cannot be deleted because transactions are linked to it. You can edit its details or deactivate instead.' 
      };
    }

    setParties(prev => prev.filter(p => p.id !== id));

    if (isSupabaseConfigured && currentUser && currentUser.id !== 'usr-admin-01') {
      (async () => {
        try {
          const supabase = createClient();
          await supabase.from('parties').delete().eq('id', id).eq('company_id', currentCompany.id);
        } catch (err) {
          console.error('Failed to delete party in Supabase:', err);
        }
      })();
    }

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

    const newId = generateUUID();
    const newCat: Category = {
      ...catData,
      id: newId,
      company_id: currentCompany.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCategories(prev => [newCat, ...prev]);

    if (isSupabaseConfigured && currentUser && currentUser.id !== 'usr-admin-01') {
      (async () => {
        try {
          const supabase = createClient();
          await ensureCompanyExistsInDb(supabase, currentCompany.id, currentCompany.name, currentUser.id);
          const { error } = await supabase.from('categories').insert({
            id: newId,
            company_id: currentCompany.id,
            name: catData.name,
            type: catData.type,
            description: catData.description || null,
            status: catData.status || 'active',
          });
          if (error) {
            console.error('Supabase error on addCategory:', error.message, error.details, error.hint, error.code);
          }
        } catch (err: any) {
          console.error('Failed to insert category in Supabase:', err?.message || err);
        }
      })();
    }

    return { success: true };
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c));

    if (isSupabaseConfigured && currentUser && currentUser.id !== 'usr-admin-01') {
      (async () => {
        try {
          const supabase = createClient();
          await ensureCompanyExistsInDb(supabase, currentCompany.id, currentCompany.name, currentUser.id);
          const { error } = await supabase.from('categories').update({
            ...updates,
            updated_at: new Date().toISOString(),
          }).eq('id', id).eq('company_id', currentCompany.id);
          if (error) {
            console.error('Supabase error on updateCategory:', error.message, error.details, error.hint, error.code);
          }
        } catch (err: any) {
          console.error('Failed to update category in Supabase:', err?.message || err);
        }
      })();
    }

    return { success: true };
  };

  const deleteCategory = (id: string) => {
    const hasTransactions = transactions.some(tx => 
      tx.company_id === currentCompany.id && 
      tx.entries?.some(e => e.category_id === id)
    );

    if (hasTransactions) {
      return { 
        success: false, 
        error: 'This category cannot be deleted because transactions are linked to it. You can edit its details instead.' 
      };
    }

    setCategories(prev => prev.filter(c => c.id !== id));

    if (isSupabaseConfigured && currentUser && currentUser.id !== 'usr-admin-01') {
      (async () => {
        try {
          const supabase = createClient();
          await supabase.from('categories').delete().eq('id', id).eq('company_id', currentCompany.id);
        } catch (err) {
          console.error('Failed to delete category in Supabase:', err);
        }
      })();
    }

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

    let prefix = 'TX';
    if (data.type === 'cash_receipt') prefix = 'CR';
    else if (data.type === 'cash_payment') prefix = 'CP';
    else if (data.type === 'bank_receipt') prefix = 'BR';
    else if (data.type === 'bank_payment') prefix = 'BP';
    else if (data.type === 'transfer') prefix = 'TR';

    const count = transactions.filter(t => t.company_id === currentCompany.id && t.transaction_type === data.type).length + 1;
    const transactionNo = `${prefix}-${String(count).padStart(6, '0')}`;
    const txId = generateUUID();

    const entries: TransactionEntry[] = [];

    if (data.type === 'cash_receipt' || data.type === 'bank_receipt') {
      entries.push({
        id: generateUUID(),
        transaction_id: txId,
        company_id: currentCompany.id,
        account_id: data.accountId,
        debit: data.amount,
        credit: 0
      });
      entries.push({
        id: generateUUID(),
        transaction_id: txId,
        company_id: currentCompany.id,
        account_id: data.accountId,
        party_id: data.partyId || null,
        category_id: data.categoryId || null,
        debit: 0,
        credit: data.amount
      });
    } else if (data.type === 'cash_payment' || data.type === 'bank_payment') {
      entries.push({
        id: generateUUID(),
        transaction_id: txId,
        company_id: currentCompany.id,
        account_id: data.accountId,
        party_id: data.partyId || null,
        category_id: data.categoryId || null,
        debit: data.amount,
        credit: 0
      });
      entries.push({
        id: generateUUID(),
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

      entries.push({
        id: generateUUID(),
        transaction_id: txId,
        company_id: currentCompany.id,
        account_id: data.toAccountId,
        debit: data.amount,
        credit: 0
      });
      entries.push({
        id: generateUUID(),
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

    // Database persistence
    if (isSupabaseConfigured && currentUser && currentUser.id !== 'usr-admin-01') {
      (async () => {
        try {
          const supabase = createClient();
          await ensureCompanyExistsInDb(supabase, currentCompany.id, currentCompany.name, currentUser.id);

          const { error: txErr } = await supabase.from('transactions').insert({
            id: txId,
            company_id: currentCompany.id,
            transaction_no: transactionNo,
            transaction_type: data.type,
            transaction_date: data.date,
            reference_no: data.referenceNo || null,
            utr_no: data.utrNo || null,
            cheque_no: data.chequeNo || null,
            cheque_date: data.chequeDate || null,
            narration: data.narration || null,
            status: 'active',
            created_by: currentUser.id,
          });

          if (txErr) {
            console.error('Supabase error on transaction header insert:', txErr.message, txErr.details, txErr.hint, txErr.code);
            return;
          }

          const dbEntries = entries.map(e => ({
            id: e.id,
            transaction_id: txId,
            company_id: currentCompany.id,
            account_id: e.account_id,
            party_id: e.party_id || null,
            category_id: e.category_id || null,
            debit: e.debit || 0,
            credit: e.credit || 0,
          }));

          const { error: entriesErr } = await supabase.from('transaction_entries').insert(dbEntries);
          if (entriesErr) {
            console.error('Supabase error on transaction entries insert:', entriesErr.message, entriesErr.details, entriesErr.hint, entriesErr.code);
          }
        } catch (err: any) {
          console.error('Failed to insert transaction in Supabase:', err?.message || err);
        }
      })();
    }

    const log: AuditLog = {
      id: generateUUID(),
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

    if (isSupabaseConfigured && currentUser && currentUser.id !== 'usr-admin-01') {
      (async () => {
        try {
          const supabase = createClient();
          await supabase.from('transactions').update({
            status: 'voided',
            void_reason: reason,
            voided_by: currentUser.id,
            voided_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('id', id).eq('company_id', currentCompany.id);
        } catch (err) {
          console.error('Failed to void transaction in Supabase:', err);
        }
      })();
    }

    const log: AuditLog = {
      id: generateUUID(),
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

  // Delete Transaction
  const deleteTransaction = (id: string) => {
    const target = transactions.find(t => t.id === id && t.company_id === currentCompany.id);
    if (!target) return { success: false, error: 'Transaction not found' };

    setTransactions(prev => prev.filter(t => t.id !== id));

    if (isSupabaseConfigured && currentUser && currentUser.id !== 'usr-admin-01') {
      (async () => {
        try {
          const supabase = createClient();
          await supabase.from('transactions').delete().eq('id', id).eq('company_id', currentCompany.id);
        } catch (err) {
          console.error('Failed to delete transaction in Supabase:', err);
        }
      })();
    }

    const log: AuditLog = {
      id: generateUUID(),
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

    if (isSupabaseConfigured && currentUser && currentUser.id !== 'usr-admin-01') {
      (async () => {
        try {
          const supabase = createClient();
          await supabase.from('transactions').update({
            transaction_date: data.date,
            reference_no: data.referenceNo || null,
            utr_no: data.utrNo || null,
            cheque_no: data.chequeNo || null,
            cheque_date: data.chequeDate || null,
            narration: data.narration || null,
            updated_at: new Date().toISOString(),
          }).eq('id', id).eq('company_id', currentCompany.id);
        } catch (err) {
          console.error('Failed to update transaction in Supabase:', err);
        }
      })();
    }

    const log: AuditLog = {
      id: generateUUID(),
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

  const getAccountRunningLedger = (accountId: string, fromDate?: string, toDate?: string) => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) {
      return { openingBalance: 0, entries: [], totalDebit: 0, totalCredit: 0, closingBalance: 0 };
    }

    let runningBal = acc.opening_balance_type === 'debit' ? acc.opening_balance : -acc.opening_balance;
    let periodOpening = runningBal;

    const sorted = [...transactions]
      .filter(tx => (tx.company_id === currentCompany.id || !tx.company_id) && tx.status === 'active')
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
        periodOpening = runningBal;
        continue;
      }

      if (isAfterToDate) {
        continue;
      }

      totalDebit += d;
      totalCredit += c;

      const partyId = tx.entries?.find(e => e.party_id)?.party_id;
      const party = partyId ? parties.find(p => p.id === partyId)?.name : undefined;

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

  const getDashboardMetrics = (): DashboardMetrics => {
    let cashBal = 0;
    let bankBal = 0;

    const companyAccounts = accounts.filter(a => (a.company_id === currentCompany.id || !a.company_id) && a.status === 'active');

    companyAccounts.forEach(a => {
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

  const getCashVsBankData = () => {
    const metrics = getDashboardMetrics();
    return [
      { name: 'Total Cash', value: Math.max(0, metrics.totalCashBalance) },
      { name: 'Total Bank', value: Math.max(0, metrics.totalBankBalance) },
    ];
  };

  const getTransactionTimelineData = () => {
    const datesMap: Record<string, { receipts: number; payments: number }> = {};

    transactions
      .filter(tx => (tx.company_id === currentCompany.id || !tx.company_id) && tx.status === 'active')
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

  const isCurrentUserDemo = currentUser?.id === 'usr-admin-01' || currentUser?.email?.toLowerCase() === 'admin@apex.corp';

  return (
    <AppContext.Provider
      value={{
        currentCompany,
        companies,
        accounts: isCurrentUserDemo ? accounts : accounts.filter(a => a.company_id === currentCompany.id),
        parties: isCurrentUserDemo ? parties : parties.filter(p => p.company_id === currentCompany.id),
        customPartyRoles,
        addPartyRole,
        updatePartyRole,
        deletePartyRole,
        theme,
        toggleTheme,
        categories: isCurrentUserDemo ? categories : categories.filter(c => c.company_id === currentCompany.id),
        transactions: isCurrentUserDemo ? transactions : transactions.filter(t => t.company_id === currentCompany.id),
        auditLogs: isCurrentUserDemo ? auditLogs : auditLogs.filter(l => l.company_id === currentCompany.id),
        searchQuery,
        setSearchQuery,
        setCompany,
        addAccount,
        updateAccount,
        deactivateAccount,
        deleteAccount,
        addParty,
        updateParty,
        deleteParty,
        addCategory,
        updateCategory,
        deleteCategory,
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
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        toggleMobileSidebar,
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
