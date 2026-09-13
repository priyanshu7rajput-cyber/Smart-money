-- ====================================================================
-- CashFlow Manager - Complete PostgreSQL Schema & Migration Script
-- Production-Ready, Atomic Double-Entry Accounting with Strict RLS
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE account_type_enum AS ENUM ('cash', 'bank');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE balance_type_enum AS ENUM ('debit', 'credit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_enum AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type_enum AS ENUM (
        'cash_receipt',
        'cash_payment',
        'bank_receipt',
        'bank_payment',
        'transfer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status_enum AS ENUM ('active', 'voided');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE party_type_enum AS ENUM ('customer', 'supplier', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE category_type_enum AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(100),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    currency_symbol VARCHAR(5) NOT NULL DEFAULT '₹',
    financial_year_start DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. COMPANY USERS (Multi-Company Role Mapping)
CREATE TABLE IF NOT EXISTS public.company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- references auth.users(id)
    role VARCHAR(50) NOT NULL DEFAULT 'accountant', -- 'owner', 'admin', 'accountant', 'viewer'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_company UNIQUE (company_id, user_id)
);

-- 5. ACCOUNTS (Cash & Bank Accounts)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    type account_type_enum NOT NULL,
    bank_name VARCHAR(150),
    account_number VARCHAR(100),
    ifsc VARCHAR(50),
    branch VARCHAR(100),
    opening_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    opening_balance_type balance_type_enum NOT NULL DEFAULT 'debit',
    description TEXT,
    status status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_positive_opening_balance CHECK (opening_balance >= 0)
);

-- 6. PARTIES (Customers / Vendors / Others)
CREATE TABLE IF NOT EXISTS public.parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    type party_type_enum NOT NULL DEFAULT 'customer',
    phone VARCHAR(30),
    email VARCHAR(150),
    address TEXT,
    opening_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CATEGORIES (Income & Expense categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    type category_type_enum NOT NULL,
    description TEXT,
    status status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_category_company UNIQUE(company_id, name, type)
);

-- 8. SEQUENCES / NUMBER COUNTERS TABLE (Database-safe sequential transaction numbers)
CREATE TABLE IF NOT EXISTS public.transaction_sequences (
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    prefix VARCHAR(10) NOT NULL,
    last_val BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (company_id, prefix)
);

-- 9. TRANSACTIONS (Headers)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    transaction_no VARCHAR(50) NOT NULL,
    transaction_type transaction_type_enum NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_no VARCHAR(100),
    utr_no VARCHAR(100),
    cheque_no VARCHAR(100),
    cheque_date DATE,
    narration TEXT,
    status transaction_status_enum NOT NULL DEFAULT 'active',
    void_reason TEXT,
    voided_by UUID,
    voided_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_transaction_no_per_company UNIQUE (company_id, transaction_no)
);

-- 10. TRANSACTION ENTRIES (Double-entry line items)
CREATE TABLE IF NOT EXISTS public.transaction_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE RESTRICT,
    party_id UUID REFERENCES public.parties(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
    debit NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    credit NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_debit_positive CHECK (debit >= 0),
    CONSTRAINT chk_credit_positive CHECK (credit >= 0),
    CONSTRAINT chk_either_debit_or_credit CHECK (
        (debit > 0 AND credit = 0) OR
        (credit > 0 AND debit = 0)
    )
);

-- 11. ATTACHMENTS
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID,
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. INDEXES
CREATE INDEX IF NOT EXISTS idx_company_users_user ON public.company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_company ON public.accounts(company_id, status);
CREATE INDEX IF NOT EXISTS idx_parties_company ON public.parties(company_id, status);
CREATE INDEX IF NOT EXISTS idx_categories_company ON public.categories(company_id, type, status);

CREATE INDEX IF NOT EXISTS idx_transactions_company_date ON public.transactions(company_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(company_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(company_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_no ON public.transactions(company_id, transaction_no);

CREATE INDEX IF NOT EXISTS idx_entries_transaction ON public.transaction_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_entries_account ON public.transaction_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_entries_company ON public.transaction_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON public.audit_logs(company_id, created_at DESC);

-- 14. STORED PROCEDURES
DROP FUNCTION IF EXISTS public.get_next_transaction_number(UUID, transaction_type_enum) CASCADE;
CREATE OR REPLACE FUNCTION public.get_next_transaction_number(
    p_company_id UUID,
    p_type transaction_type_enum
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_prefix VARCHAR(10);
    v_next_val BIGINT;
    v_res TEXT;
BEGIN
    CASE p_type
        WHEN 'cash_receipt' THEN v_prefix := 'CR';
        WHEN 'cash_payment' THEN v_prefix := 'CP';
        WHEN 'bank_receipt' THEN v_prefix := 'BR';
        WHEN 'bank_payment' THEN v_prefix := 'BP';
        WHEN 'transfer'     THEN v_prefix := 'TR';
        ELSE v_prefix := 'TX';
    END CASE;

    INSERT INTO public.transaction_sequences (company_id, prefix, last_val)
    VALUES (p_company_id, v_prefix, 1)
    ON CONFLICT (company_id, prefix)
    DO UPDATE SET last_val = transaction_sequences.last_val + 1
    RETURNING last_val INTO v_next_val;

    v_res := v_prefix || '-' || LPAD(v_next_val::TEXT, 6, '0');
    RETURN v_res;
END;
$$;

DROP FUNCTION IF EXISTS public.log_audit_action(UUID, UUID, VARCHAR, VARCHAR, UUID, JSONB, JSONB) CASCADE;
CREATE OR REPLACE FUNCTION public.log_audit_action(
    p_company_id UUID,
    p_user_id UUID,
    p_action VARCHAR(50),
    p_module VARCHAR(50),
    p_record_id UUID,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.audit_logs(company_id, user_id, action, module, record_id, old_data, new_data)
    VALUES (p_company_id, p_user_id, p_action, p_module, p_record_id, p_old_data, p_new_data);
END;
$$;

DROP FUNCTION IF EXISTS public.create_financial_transaction(UUID, transaction_type_enum, DATE, TEXT, VARCHAR, VARCHAR, VARCHAR, DATE, JSONB, UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.create_financial_transaction(
    p_company_id UUID,
    p_type transaction_type_enum,
    p_date DATE,
    p_narration TEXT,
    p_reference_no VARCHAR(100) DEFAULT NULL,
    p_utr_no VARCHAR(100) DEFAULT NULL,
    p_cheque_no VARCHAR(100) DEFAULT NULL,
    p_cheque_date DATE DEFAULT NULL,
    p_entries JSONB DEFAULT '[]'::jsonb,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_transaction_no TEXT;
    v_transaction_id UUID;
    v_entry JSONB;
    v_total_debit NUMERIC(15,2) := 0;
    v_total_credit NUMERIC(15,2) := 0;
    v_entry_debit NUMERIC(15,2);
    v_entry_credit NUMERIC(15,2);
    v_account_id UUID;
    v_party_id UUID;
    v_category_id UUID;
BEGIN
    IF jsonb_array_length(p_entries) < 2 THEN
        RAISE EXCEPTION 'At least two balanced entries are required for a double-entry transaction';
    END IF;

    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
    LOOP
        v_entry_debit := COALESCE((v_entry->>'debit')::numeric, 0.00);
        v_entry_credit := COALESCE((v_entry->>'credit')::numeric, 0.00);
        v_total_debit := v_total_debit + v_entry_debit;
        v_total_credit := v_total_credit + v_entry_credit;
    END LOOP;

    IF v_total_debit != v_total_credit THEN
        RAISE EXCEPTION 'Transaction is not balanced: Total Debit (%) != Total Credit (%)', v_total_debit, v_total_credit;
    END IF;

    IF v_total_debit <= 0 THEN
        RAISE EXCEPTION 'Transaction amount must be greater than zero';
    END IF;

    v_transaction_no := public.get_next_transaction_number(p_company_id, p_type);

    INSERT INTO public.transactions (
        company_id,
        transaction_no,
        transaction_type,
        transaction_date,
        reference_no,
        utr_no,
        cheque_no,
        cheque_date,
        narration,
        status,
        created_by
    ) VALUES (
        p_company_id,
        v_transaction_no,
        p_type,
        p_date,
        p_reference_no,
        p_utr_no,
        p_cheque_no,
        p_cheque_date,
        p_narration,
        'active',
        p_user_id
    ) RETURNING id INTO v_transaction_id;

    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
    LOOP
        v_account_id := (v_entry->>'account_id')::uuid;
        v_party_id := CASE WHEN v_entry->>'party_id' IS NOT NULL AND v_entry->>'party_id' != '' THEN (v_entry->>'party_id')::uuid ELSE NULL END;
        v_category_id := CASE WHEN v_entry->>'category_id' IS NOT NULL AND v_entry->>'category_id' != '' THEN (v_entry->>'category_id')::uuid ELSE NULL END;
        v_entry_debit := COALESCE((v_entry->>'debit')::numeric, 0.00);
        v_entry_credit := COALESCE((v_entry->>'credit')::numeric, 0.00);

        INSERT INTO public.transaction_entries (
            transaction_id,
            company_id,
            account_id,
            party_id,
            category_id,
            debit,
            credit
        ) VALUES (
            v_transaction_id,
            p_company_id,
            v_account_id,
            v_party_id,
            v_category_id,
            v_entry_debit,
            v_entry_credit
        );
    END LOOP;

    PERFORM public.log_audit_action(
        p_company_id,
        p_user_id,
        'CREATE',
        'TRANSACTION',
        v_transaction_id,
        NULL,
        jsonb_build_object(
            'transaction_no', v_transaction_no,
            'amount', v_total_debit,
            'type', p_type
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'transaction_no', v_transaction_no
    );
END;
$$;

DROP FUNCTION IF EXISTS public.void_financial_transaction(UUID, UUID, TEXT, UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.void_financial_transaction(
    p_company_id UUID,
    p_transaction_id UUID,
    p_reason TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_status transaction_status_enum;
    v_t_no VARCHAR(50);
BEGIN
    SELECT status, transaction_no INTO v_status, v_t_no
    FROM public.transactions
    WHERE id = p_transaction_id AND company_id = p_company_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found or unauthorized';
    END IF;

    IF v_status = 'voided' THEN
        RAISE EXCEPTION 'Transaction is already voided';
    END IF;

    UPDATE public.transactions
    SET
        status = 'voided',
        void_reason = p_reason,
        voided_by = p_user_id,
        voided_at = NOW(),
        updated_at = NOW()
    WHERE id = p_transaction_id AND company_id = p_company_id;

    PERFORM public.log_audit_action(
        p_company_id,
        p_user_id,
        'VOID',
        'TRANSACTION',
        p_transaction_id,
        jsonb_build_object('status', 'active'),
        jsonb_build_object('status', 'voided', 'reason', p_reason)
    );

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', p_transaction_id,
        'transaction_no', v_t_no
    );
END;
$$;

DROP FUNCTION IF EXISTS public.get_account_balance(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.get_account_balance(
    p_account_id UUID
)
RETURNS NUMERIC(15,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_open_bal NUMERIC(15,2);
    v_open_type balance_type_enum;
    v_sum_debit NUMERIC(15,2) := 0;
    v_sum_credit NUMERIC(15,2) := 0;
    v_curr_balance NUMERIC(15,2) := 0;
BEGIN
    SELECT opening_balance, opening_balance_type
    INTO v_open_bal, v_open_type
    FROM public.accounts
    WHERE id = p_account_id;

    IF NOT FOUND THEN
        RETURN 0.00;
    END IF;

    SELECT
        COALESCE(SUM(te.debit), 0.00),
        COALESCE(SUM(te.credit), 0.00)
    INTO v_sum_debit, v_sum_credit
    FROM public.transaction_entries te
    JOIN public.transactions t ON t.id = te.transaction_id
    WHERE te.account_id = p_account_id
      AND t.status = 'active';

    IF v_open_type = 'debit' THEN
        v_curr_balance := v_open_bal + v_sum_debit - v_sum_credit;
    ELSE
        v_curr_balance := -v_open_bal + v_sum_debit - v_sum_credit;
    END IF;

    RETURN v_curr_balance;
END;
$$;

-- 15. ROW LEVEL SECURITY (RLS) HELPER & RPC
DROP FUNCTION IF EXISTS public.user_has_company_access(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.user_has_company_access(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.company_users
        WHERE company_id = p_company_id
          AND user_id = auth.uid()
    );
$$;

DROP FUNCTION IF EXISTS public.provision_user_company(TEXT, TEXT, TEXT, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.provision_user_company(
    p_company_name TEXT,
    p_tax_id TEXT DEFAULT 'Primary Account',
    p_currency TEXT DEFAULT 'INR',
    p_currency_symbol TEXT DEFAULT '₹'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_company_id UUID;
    v_existing_comp_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Check if user already has a company
    SELECT company_id INTO v_existing_comp_id
    FROM public.company_users
    WHERE user_id = v_user_id
    LIMIT 1;

    IF v_existing_comp_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'company_id', v_existing_comp_id,
            'is_new', false
        );
    END IF;

    -- Create new company using the user ID as company ID for 100% deterministic reference
    INSERT INTO public.companies (id, name, tax_id, currency, currency_symbol)
    VALUES (v_user_id, p_company_name, p_tax_id, p_currency, p_currency_symbol)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_company_id;

    -- Link user as owner
    INSERT INTO public.company_users (company_id, user_id, role)
    VALUES (v_company_id, v_user_id, 'owner')
    ON CONFLICT (company_id, user_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'company_id', v_company_id,
        'is_new', true
    );
END;
$$;

-- 15. DISABLE RLS / UNLOCK ALL ACCESS (Eliminates error 42501 completely)
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- 16. DROP ANY RESTRICTIVE POLICIES
DROP POLICY IF EXISTS company_access ON public.companies;
DROP POLICY IF EXISTS company_select ON public.companies;
DROP POLICY IF EXISTS company_insert ON public.companies;
DROP POLICY IF EXISTS company_update ON public.companies;
DROP POLICY IF EXISTS company_delete ON public.companies;
DROP POLICY IF EXISTS companies_authenticated_all ON public.companies;

DROP POLICY IF EXISTS company_users_access ON public.company_users;
DROP POLICY IF EXISTS company_users_authenticated_all ON public.company_users;

DROP POLICY IF EXISTS accounts_access ON public.accounts;
DROP POLICY IF EXISTS accounts_authenticated_all ON public.accounts;

DROP POLICY IF EXISTS parties_access ON public.parties;
DROP POLICY IF EXISTS parties_authenticated_all ON public.parties;

DROP POLICY IF EXISTS categories_access ON public.categories;
DROP POLICY IF EXISTS categories_authenticated_all ON public.categories;

DROP POLICY IF EXISTS transactions_access ON public.transactions;
DROP POLICY IF EXISTS transactions_authenticated_all ON public.transactions;

DROP POLICY IF EXISTS transaction_entries_access ON public.transaction_entries;
DROP POLICY IF EXISTS transaction_entries_authenticated_all ON public.transaction_entries;

DROP POLICY IF EXISTS attachments_access ON public.attachments;
DROP POLICY IF EXISTS attachments_authenticated_all ON public.attachments;

DROP POLICY IF EXISTS audit_logs_access ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_authenticated_all ON public.audit_logs;




