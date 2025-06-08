-- Database updates for payment verification system
-- Run these commands in your Supabase SQL Editor

-- Add payment verification columns to hotcoin_transactions table
ALTER TABLE public.hotcoin_transactions 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cashapp', 'venmo', 'paypal')),
ADD COLUMN IF NOT EXISTS transaction_id TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Create unique index to prevent duplicate transaction IDs
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_transaction_id 
ON public.hotcoin_transactions(transaction_id) 
WHERE transaction_id IS NOT NULL;

-- Add indexes for payment verification queries
CREATE INDEX IF NOT EXISTS idx_transactions_verification_status 
ON public.hotcoin_transactions(verification_status);

CREATE INDEX IF NOT EXISTS idx_transactions_payment_method 
ON public.hotcoin_transactions(payment_method);

-- Update RLS policies to allow admins to see all payment transactions
CREATE POLICY IF NOT EXISTS "Admins can view all transactions" 
ON public.hotcoin_transactions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY IF NOT EXISTS "Admins can update transaction verification" 
ON public.hotcoin_transactions FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Function to approve a payment and update user balance
CREATE OR REPLACE FUNCTION public.approve_payment(transaction_uuid UUID, admin_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  transaction_record RECORD;
  user_profile RECORD;
BEGIN
  -- Check if admin user exists and is admin
  SELECT * INTO user_profile FROM public.profiles WHERE id = admin_id AND is_admin = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Get transaction details
  SELECT * INTO transaction_record 
  FROM public.hotcoin_transactions 
  WHERE id = transaction_uuid AND verification_status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or already processed';
  END IF;
  
  -- Update user balance
  UPDATE public.profiles 
  SET hotcoin_balance = hotcoin_balance + transaction_record.amount
  WHERE id = transaction_record.user_id;
  
  -- Mark transaction as approved
  UPDATE public.hotcoin_transactions
  SET 
    verification_status = 'approved',
    verified_by = admin_id,
    verified_at = NOW()
  WHERE id = transaction_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a payment
CREATE OR REPLACE FUNCTION public.reject_payment(transaction_uuid UUID, admin_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Check if admin user exists and is admin
  SELECT * INTO user_profile FROM public.profiles WHERE id = admin_id AND is_admin = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Mark transaction as rejected
  UPDATE public.hotcoin_transactions
  SET 
    verification_status = 'rejected',
    verified_by = admin_id,
    verified_at = NOW()
  WHERE id = transaction_uuid AND verification_status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or already processed';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;