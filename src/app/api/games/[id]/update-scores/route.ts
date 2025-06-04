import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { id } = params;
    const body = await request.json();

    // Get the current user and verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate the request body
    const { homeScores, awayScores, period } = body;

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
    if (!game.numbersAssigned) {
      return NextResponse.json({ error: 'Numbers must be assigned before updating scores' }, { status: 400 });
    }

    // Update the game with new scores
    const { error: updateError } = await supabase
      .from('games')
      .update({
        homeScores,
        awayScores,
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // Calculate winners for each period if this is a final update
    const winners = calculateWinners(homeScores, awayScores, game.homeNumbers, game.awayNumbers);

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