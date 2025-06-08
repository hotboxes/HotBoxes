-- Corrected SQL fix for games table update permissions
-- Run this in your Supabase SQL Editor

-- First, check what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'games';

-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can update games" ON public.games;

-- Create the update policy with correct syntax
CREATE POLICY "Admins can update games" 
ON public.games 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = true
    )
) 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Ensure RLS is enabled
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT UPDATE ON public.games TO authenticated;