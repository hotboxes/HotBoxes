-- Create function to assign numbers that bypasses RLS
CREATE OR REPLACE FUNCTION public.assign_game_numbers(
  game_id UUID,
  home_nums INTEGER[],
  away_nums INTEGER[]
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.games 
  SET 
    home_numbers = home_nums,
    away_numbers = away_nums,
    numbers_assigned = true
  WHERE id = game_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;