import { NextResponse } from 'next/server';

// Validation helper
function validateEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return { url, key };
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array: number[]): number[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Validate environment
    const { url, key } = validateEnvironment();
    
    // Dynamic import to avoid module issues
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, key);
    
    // Get active games without assigned numbers
    const { data: games, error: fetchError } = await supabase
      .from('games')
      .select('*')
      .eq('is_active', true)
      .eq('numbers_assigned', false);

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Database fetch failed', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!games || games.length === 0) {
      return NextResponse.json({
        message: 'No games requiring number assignment',
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      });
    }

    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
    let assignedCount = 0;
    const errors: string[] = [];

    // Process each game
    for (const game of games) {
      try {
        const gameStart = new Date(game.game_date).getTime();
        const timeUntilGame = gameStart - now;
        
        // Check if it's time to assign numbers (10 minutes before)
        if (timeUntilGame <= tenMinutes) {
          // Generate random numbers using Fisher-Yates shuffle
          const homeNumbers = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
          const awayNumbers = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

          // Update the game
          const { error: updateError } = await supabase
            .from('games')
            .update({
              home_numbers: homeNumbers,
              away_numbers: awayNumbers,
              numbers_assigned: true
            })
            .eq('id', game.id);

          if (updateError) {
            const errorMsg = `Failed to update game ${game.id}: ${updateError.message}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          } else {
            assignedCount++;
            console.log(`Successfully assigned numbers to game ${game.id}: Home[${homeNumbers.join(',')}] Away[${awayNumbers.join(',')}]`);
          }
        }
      } catch (gameError: any) {
        const errorMsg = `Error processing game ${game.id}: ${gameError.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Return comprehensive response
    const response = {
      success: true,
      assignedCount,
      totalGames: games.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime
    };

    console.log('Cron job completed:', response);
    return NextResponse.json(response);

  } catch (error: any) {
    const errorResponse = {
      success: false,
      error: 'Cron job failed',
      details: error.message,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime
    };
    
    console.error('Cron job error:', errorResponse);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}