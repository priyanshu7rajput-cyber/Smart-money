export type AccountType = 'cash' | 'bank';
export type BalanceType = 'debit' | 'credit';
export type StatusType = 'active' | 'inactive';
export type TransactionType = 'cash_receipt' | 'cash_payment' | 'bank_receipt' | 'bank_payment' | 'transfer';
export type TransactionStatus = 'active' | 'voided';
export type PartyType = 'customer' | 'supplier' | 'other';
export type CategoryType = 'income' | 'expense';
export type UserRole = 'owner' | 'admin' | 'accountant' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
}

export interface Company {
  id: string;
  name: string;
  tax_id?: string;
  currency: string;
  currency_symbol: string;
  financial_year_start: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyUser {
  id: string;
  company_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Account {
  id: string;
  company_id: string;
  name: string;
  type: AccountType;
  bank_name?: string;
  account_number?: string;
  ifsc?: string;
  branch?: string;
  opening_balance: number;
  opening_balance_type: BalanceType;
  description?: string;
  status: StatusType;
  created_at: string;
  updated_at: string;
  // Computed runtime fields
  current_balance?: number;
  transaction_count?: number;
}

export interface Party {
  id: string;
  company_id: string;
  name: string;
  type: PartyType;
  phone?: string;
  email?: string;
  address?: string;
  opening_balance: number;
  status: StatusType;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  company_id: string;
  name: string;
  type: CategoryType;
  description?: string;
  status: StatusType;
  created_at: string;
  updated_at: string;
}

export interface TransactionEntry {
  id?: string;
  transaction_id?: string;
  company_id: string;
  account_id: string;
  party_id?: string | null;
  category_id?: string | null;
  debit: number;
  credit: number;
  created_at?: string;
  // Joined fields for display
  account?: Account;
  party?: Party;
  category?: Category;
}

export interface Transaction {
  id: string;
  company_id: string;
  transaction_no: string;
  transaction_type: TransactionType;
  transaction_date: string;
  reference_no?: string;
  utr_no?: string;
  cheque_no?: string;
  cheque_date?: string;
  narration?: string;
  status: TransactionStatus;
  void_reason?: string;
  voided_by?: string;
  voided_at?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  entries?: TransactionEntry[];
  // Calculated helper for UI
  amount?: number;
  primary_account_name?: string;
  party_name?: string;
}

export interface AuditLog {
  id: string;
  company_id: string;
  user_id?: string;
  action: string;
  module: string;
  record_id?: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalCashBalance: number;
  totalBankBalance: number;
  totalBalance: number;
  todayReceipts: number;
  todayPayments: number;
  monthReceipts: number;
  monthPayments: number;
}
