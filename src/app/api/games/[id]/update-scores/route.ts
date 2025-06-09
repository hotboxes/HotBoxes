import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { id } = params;
    const body = await request.json();
    const { homeScores, awayScores } = body;

    // FORCE UPDATE - NO VALIDATION BULLSHIT
    const { error: updateError } = await supabase.rpc('update_game_scores', {
      game_id: id,
      new_home_scores: homeScores,
      new_away_scores: awayScores
    });
    
    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Scores updated successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update scores: ' + error.message },
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