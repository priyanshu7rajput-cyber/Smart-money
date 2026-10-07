-- Add upi_id column to accounts table if it doesn't already exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'accounts' 
          AND column_name = 'upi_id'
    ) THEN
        ALTER TABLE public.accounts ADD COLUMN upi_id VARCHAR(100);
    END IF;
END $$;
