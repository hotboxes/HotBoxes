import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Use direct Supabase client for API routes
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { id } = params;
    const body = await request.json();
    console.log('Score update API called for game:', id);
    console.log('Request body:', body);

    // Validate the request body
    const { homeScores, awayScores, period } = body;
    console.log('Parsed scores:', { homeScores, awayScores });

    if (!Array.isArray(homeScores) || !Array.isArray(awayScores)) {
      return NextResponse.json({ error: 'Invalid scores format' }, { status: 400 });
    }

    if (homeScores.length !== awayScores.length) {
      return NextResponse.json({ error: 'Home and away scores must have same length' }, { status: 400 });
    }

    // Get the game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Check if numbers are assigned
    if (!game.numbers_assigned) {
      return NextResponse.json({ error: 'Numbers must be assigned before updating scores' }, { status: 400 });
    }

    // Update the game with new scores
    console.log('Attempting to update game with scores:', { home_scores: homeScores, away_scores: awayScores });
    const { error: updateError } = await supabase
      .from('games')
      .update({
        home_scores: homeScores,
        away_scores: awayScores,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }
    
    console.log('Scores updated successfully in database');

    // Calculate winners for each period if this is a final update
    const winners = calculateWinners(homeScores, awayScores, game.home_numbers, game.away_numbers);

    return NextResponse.json({
      success: true,
      homeScores,
      awayScores,
      winners,
      message: 'Scores updated successfully'
    });

  } catch (error) {
    console.error('Error updating scores:', error);
    return NextResponse.json(
      { error: 'Failed to update scores' },
      { status: 500 }
    );
  }
}

// Helper function to calculate winners for each quarter/period
function calculateWinners(
  homeScores: number[], 
  awayScores: number[], 
  homeNumbers: number[], 
  awayNumbers: number[]
): Array<{ period: string; homeDigit: number; awayDigit: number; gridPosition: { row: number; col: number } }> {
  const winners = [];
  
  for (let i = 0; i < homeScores.length; i++) {
    const homeDigit = homeScores[i] % 10;
    const awayDigit = awayScores[i] % 10;
    
    // Find the grid position for these digits
    const homeRow = homeNumbers.indexOf(homeDigit);
    const awayCol = awayNumbers.indexOf(awayDigit);
    
    if (homeRow !== -1 && awayCol !== -1) {
      const periodName = i === 0 ? '1st Quarter' : 
                        i === 1 ? 'Halftime' : 
                        i === 2 ? '3rd Quarter' : 
                        i === 3 ? 'Final' : `Period ${i + 1}`;
      
      winners.push({
        period: periodName,
        homeDigit,
        awayDigit,
        gridPosition: { row: homeRow, col: awayCol }
      });
    }
  }
  
  return winners;
}