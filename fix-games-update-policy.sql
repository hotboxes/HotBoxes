-- Quick fix for games table update permissions
-- Run this in your Supabase SQL Editor

-- Drop and recreate the games update policy with both USING and WITH CHECK
DROP POLICY IF EXISTS "Admins can update games" ON public.games;

CREATE POLICY "Admins can update games" ON public.games
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

-- Make sure games table has RLS enabled
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Grant explicit update permission
GRANT UPDATE ON public.games TO authenticated;