-- Create RPC function to update game scores (bypasses RLS)
CREATE OR REPLACE FUNCTION update_game_scores(
  game_id UUID,
  new_home_scores INTEGER[],
  new_away_scores INTEGER[]
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.games
  SET 
    home_scores = new_home_scores,
    away_scores = new_away_scores
  WHERE id = game_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game not found with id: %', game_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_game_scores(UUID, INTEGER[], INTEGER[]) TO authenticated;