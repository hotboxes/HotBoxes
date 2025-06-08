-- Fix Admin Game Update Permissions
-- Run this in your Supabase SQL Editor

-- First, let's check the current policies on games table
SELECT 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'games';

-- Drop the existing games update policy and recreate it
DROP POLICY IF EXISTS "Admins can update games" ON public.games;

-- Create a more robust admin update policy
CREATE POLICY "Admins can update games" ON public.games
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Also ensure the profiles table has proper policies for admin access
DROP POLICY IF EXISTS "profiles_access_policy" ON public.profiles;

CREATE POLICY "profiles_access_policy" 
ON public.profiles 
FOR ALL
USING (
  auth.uid() = id 
  OR 
  (
    SELECT is_admin FROM public.profiles 
    WHERE id = auth.uid()
  ) = true
);

-- Grant explicit permissions to authenticated users
GRANT ALL ON public.games TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Check if your user is actually marked as admin
-- Replace 'your-user-id-here' with your actual user ID from auth.users
-- SELECT id, email, is_admin FROM public.profiles WHERE email = 'your-email@example.com';