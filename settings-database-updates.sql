-- User Settings and Preferences Database Updates
-- Add new columns to profiles table for user preferences and responsible gambling features

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS game_alerts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS winning_alerts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS daily_spend_limit INTEGER,
ADD COLUMN IF NOT EXISTS weekly_spend_limit INTEGER,
ADD COLUMN IF NOT EXISTS session_time_limit INTEGER,
ADD COLUMN IF NOT EXISTS self_exclusion_days INTEGER,
ADD COLUMN IF NOT EXISTS self_exclusion_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS terms_version TEXT,
ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS age_verification_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create spending tracking table for daily/weekly limits
CREATE TABLE IF NOT EXISTS public.spending_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount_spent INTEGER DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create system configuration table for admin settings
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system configuration values
INSERT INTO public.system_config (key, value, description) VALUES
('withdrawal_minimum', '25', 'Minimum withdrawal amount in dollars'),
('withdrawal_daily_limit', '500', 'Daily withdrawal limit per user in dollars'),
('auto_approval_limit', '100', 'Auto-approval limit for payments in dollars'),
('terms_current_version', '1.0', 'Current version of terms of service'),
('age_verification_required', 'true', 'Whether age verification is required for new users'),
('responsible_gambling_enabled', 'true', 'Whether responsible gambling features are enabled')
ON CONFLICT (key) DO NOTHING;

-- Create support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  assigned_to UUID REFERENCES public.profiles(id),
  admin_notes TEXT,
  user_email TEXT,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create support ticket responses table
CREATE TABLE IF NOT EXISTS public.support_ticket_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  is_admin_response BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for spending tracking
ALTER TABLE public.spending_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spending tracking" 
ON public.spending_tracking 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spending tracking" 
ON public.spending_tracking 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spending tracking" 
ON public.spending_tracking 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all spending tracking" 
ON public.spending_tracking 
FOR ALL 
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Create RLS policies for system config (admin only)
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system config" 
ON public.system_config 
FOR ALL 
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Create RLS policies for support tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets" 
ON public.support_tickets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" 
ON public.support_tickets 
FOR ALL 
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Create RLS policies for support ticket responses
ALTER TABLE public.support_ticket_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses to own tickets" 
ON public.support_ticket_responses 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  auth.uid() IN (
    SELECT user_id FROM public.support_tickets WHERE id = ticket_id
  )
);

CREATE POLICY "Users can create responses to own tickets" 
ON public.support_ticket_responses 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR 
  auth.uid() IN (
    SELECT user_id FROM public.support_tickets WHERE id = ticket_id
  )
);

CREATE POLICY "Admins can manage all ticket responses" 
ON public.support_ticket_responses 
FOR ALL 
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Function to check spending limits
CREATE OR REPLACE FUNCTION check_spending_limits(user_uuid UUID, spend_amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  user_profile RECORD;
  daily_spent INTEGER;
  weekly_spent INTEGER;
  week_start DATE;
BEGIN
  -- Get user profile with limits
  SELECT * INTO user_profile FROM public.profiles WHERE id = user_uuid;
  
  -- Check if user is self-excluded
  IF user_profile.self_exclusion_until IS NOT NULL AND user_profile.self_exclusion_until > NOW() THEN
    RAISE EXCEPTION 'User is currently self-excluded until %', user_profile.self_exclusion_until;
  END IF;
  
  -- Check daily limit
  IF user_profile.daily_spend_limit IS NOT NULL THEN
    SELECT COALESCE(amount_spent, 0) INTO daily_spent 
    FROM public.spending_tracking 
    WHERE user_id = user_uuid AND date = CURRENT_DATE;
    
    IF (COALESCE(daily_spent, 0) + spend_amount) > user_profile.daily_spend_limit THEN
      RAISE EXCEPTION 'Daily spending limit exceeded. Limit: $%, Current: $%, Attempted: $%', 
        user_profile.daily_spend_limit, COALESCE(daily_spent, 0), spend_amount;
    END IF;
  END IF;
  
  -- Check weekly limit
  IF user_profile.weekly_spend_limit IS NOT NULL THEN
    week_start := DATE_TRUNC('week', CURRENT_DATE);
    
    SELECT COALESCE(SUM(amount_spent), 0) INTO weekly_spent 
    FROM public.spending_tracking 
    WHERE user_id = user_uuid AND date >= week_start AND date <= CURRENT_DATE;
    
    IF (COALESCE(weekly_spent, 0) + spend_amount) > user_profile.weekly_spend_limit THEN
      RAISE EXCEPTION 'Weekly spending limit exceeded. Limit: $%, Current: $%, Attempted: $%', 
        user_profile.weekly_spend_limit, COALESCE(weekly_spent, 0), spend_amount;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track spending
CREATE OR REPLACE FUNCTION track_spending(user_uuid UUID, spend_amount INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.spending_tracking (user_id, date, amount_spent, transaction_count)
  VALUES (user_uuid, CURRENT_DATE, spend_amount, 1)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    amount_spent = public.spending_tracking.amount_spent + spend_amount,
    transaction_count = public.spending_tracking.transaction_count + 1,
    updated_at = NOW();
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update profiles table to track last login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login = NOW() 
  WHERE id = auth.uid();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for last login update (this would be called from the application)
-- Note: This is a placeholder - actual implementation would be in the authentication flow