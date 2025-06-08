-- Fix game creation schema issues

-- 1. Update entry_fee constraint to allow free games (entry_fee >= 0)
ALTER TABLE public.games DROP CONSTRAINT IF EXISTS games_entry_fee_check;
ALTER TABLE public.games ADD CONSTRAINT games_entry_fee_check CHECK (entry_fee >= 0);

-- 2. Add missing payout columns that the UI expects
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS payout_q1 INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS payout_q2 INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS payout_q3 INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS payout_final INTEGER DEFAULT 25;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'games' AND table_schema = 'public'
ORDER BY ordinal_position;