import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('Number assignment API called for game:', params.id);
  
  try {
    // Use direct Supabase client for API routes
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { id } = params;
    console.log('Skipping auth check for admin function');

    // Get the game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Check if numbers are already assigned
    if (game.numbers_assigned) {
      return NextResponse.json({ error: 'Numbers already assigned' }, { status: 400 });
    }

    // Generate random numbers for home and away teams
    const homeNumbers = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const awayNumbers = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // Update the game with the assigned numbers
    const { error: updateError } = await supabase
      .from('games')
      .update({
        home_numbers: homeNumbers,
        away_numbers: awayNumbers,
        numbers_assigned: true,
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      home_numbers: homeNumbers,
      away_numbers: awayNumbers,
      message: 'Numbers assigned successfully'
    });

  } catch (error) {
    console.error('Error assigning numbers:', error);
    return NextResponse.json(
      { error: 'Failed to assign numbers' },
      { status: 500 }
    );
  }
}

// Function to shuffle an array using Fisher-Yates algorithm
function shuffleArray(array: number[]): number[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Auto-assignment endpoint (can be called by cron job)
export async function GET(
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

    // Get the game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Check if numbers are already assigned
    if (game.numbers_assigned) {
      return NextResponse.json({ error: 'Numbers already assigned' }, { status: 400 });
    }

    // Check if it's time to assign numbers (10 minutes before game)
    const gameTime = new Date(game.game_date).getTime();
    const currentTime = new Date().getTime();
    const tenMinutesInMs = 10 * 60 * 1000;
    const timeDifference = gameTime - currentTime;

    if (timeDifference > tenMinutesInMs) {
      return NextResponse.json({ 
        error: 'Too early to assign numbers',
        timeUntilAssignment: timeDifference - tenMinutesInMs
      }, { status: 400 });
    }

    // Generate random numbers
    const homeNumbers = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const awayNumbers = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // Update the game
    const { error: updateError } = await supabase
      .from('games')
      .update({
        home_numbers: homeNumbers,
        away_numbers: awayNumbers,
        numbers_assigned: true,
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      home_numbers: homeNumbers,
      away_numbers: awayNumbers,
      message: 'Numbers auto-assigned successfully'
    });

  } catch (error) {
    console.error('Error auto-assigning numbers:', error);
    return NextResponse.json(
      { error: 'Failed to auto-assign numbers' },
      { status: 500 }
    );
  }
}