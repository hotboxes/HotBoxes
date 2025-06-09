-- Fix RLS policy for games table to allow admins to update
DROP POLICY IF EXISTS "games_update_policy" ON public.games;

CREATE POLICY "games_update_policy" 
ON public.games 
FOR UPDATE 
USING (
  (
    SELECT is_admin FROM public.profiles 
    WHERE id = auth.uid()
  ) = true
)
WITH CHECK (
  (
    SELECT is_admin FROM public.profiles 
    WHERE id = auth.uid()
  ) = true
);

-- Also ensure anon key can update games for API routes
DROP POLICY IF EXISTS "games_anon_update_policy" ON public.games;

CREATE POLICY "games_anon_update_policy"
ON public.games
FOR UPDATE
USING (true)
WITH CHECK (true);