-- Add payouts_processed column to games table to prevent duplicate payout processing
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS payouts_processed BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.games.payouts_processed IS 'Flag to track if payouts have been processed for this game to prevent duplicates';

-- Update any existing games that have payout transactions to mark them as processed
UPDATE public.games 
SET payouts_processed = TRUE 
WHERE id IN (
    SELECT DISTINCT game_id 
    FROM public.hotcoin_transactions 
    WHERE type = 'payout' 
    AND game_id IS NOT NULL
);