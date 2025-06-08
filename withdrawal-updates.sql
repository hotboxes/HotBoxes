-- Database updates for withdrawal system
-- Run these commands in your Supabase SQL Editor

-- Update transaction type constraint to include 'withdrawal'
ALTER TABLE public.hotcoin_transactions 
DROP CONSTRAINT IF EXISTS hotcoin_transactions_type_check;

ALTER TABLE public.hotcoin_transactions 
ADD CONSTRAINT hotcoin_transactions_type_check 
CHECK (type IN ('purchase', 'bet', 'payout', 'refund', 'withdrawal'));

-- Add cashapp_username column for withdrawals
ALTER TABLE public.hotcoin_transactions 
ADD COLUMN IF NOT EXISTS cashapp_username TEXT;

-- Create index for withdrawal queries
CREATE INDEX IF NOT EXISTS idx_transactions_type_date 
ON public.hotcoin_transactions(type, created_at);

-- Function to complete a withdrawal (mark as processed)
CREATE OR REPLACE FUNCTION public.complete_withdrawal(transaction_uuid UUID, admin_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Check if admin user exists and is admin
  SELECT * INTO user_profile FROM public.profiles WHERE id = admin_id AND is_admin = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Mark withdrawal as approved (completed)
  UPDATE public.hotcoin_transactions
  SET 
    verification_status = 'approved',
    verified_by = admin_id,
    verified_at = NOW()
  WHERE id = transaction_uuid AND type = 'withdrawal' AND verification_status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found or already processed';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel a withdrawal (refund the user)
CREATE OR REPLACE FUNCTION public.cancel_withdrawal(transaction_uuid UUID, admin_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  withdrawal_record RECORD;
  user_profile RECORD;
BEGIN
  -- Check if admin user exists and is admin
  SELECT * INTO user_profile FROM public.profiles WHERE id = admin_id AND is_admin = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Get withdrawal details
  SELECT * INTO withdrawal_record 
  FROM public.hotcoin_transactions 
  WHERE id = transaction_uuid AND type = 'withdrawal' AND verification_status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found or already processed';
  END IF;
  
  -- Refund the user's balance
  UPDATE public.profiles 
  SET hotcoin_balance = hotcoin_balance + withdrawal_record.amount
  WHERE id = withdrawal_record.user_id;
  
  -- Mark withdrawal as rejected (cancelled)
  UPDATE public.hotcoin_transactions
  SET 
    verification_status = 'rejected',
    verified_by = admin_id,
    verified_at = NOW(),
    description = withdrawal_record.description || ' (CANCELLED - REFUNDED)'
  WHERE id = transaction_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;