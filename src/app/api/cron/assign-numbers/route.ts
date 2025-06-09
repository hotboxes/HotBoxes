import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();

    // Get all active games that don't have numbers assigned yet
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .eq('is_active', true)
      .eq('numbers_assigned', false);

    if (gamesError) {
      throw gamesError;
    }

    if (!games || games.length === 0) {
      return NextResponse.json({ 
        message: 'No games need number assignment',
        gamesProcessed: 0
      });
    }

    const currentTime = new Date().getTime();
    const tenMinutesInMs = 10 * 60 * 1000;
    let gamesProcessed = 0;
    const results = [];

    for (const game of games) {
      const gameTime = new Date(game.game_date).getTime();
      const timeDifference = gameTime - currentTime;

      // If it's 10 minutes or less before the game, assign numbers
      if (timeDifference <= tenMinutesInMs) {
        try {
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
            .eq('id', game.id);

          if (updateError) {
            throw updateError;
          }

          gamesProcessed++;
          results.push({
            gameId: game.id,
            gameName: game.name,
            homeNumbers,
            awayNumbers,
            status: 'success'
          });

          console.log(`Numbers assigned for game: ${game.name} (${game.id})`);
        } catch (error) {
          console.error(`Error assigning numbers for game ${game.id}:`, error);
          results.push({
            gameId: game.id,
            gameName: game.name,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      } else {
        results.push({
          gameId: game.id,
          gameName: game.name,
          status: 'too_early',
          timeUntilAssignment: Math.ceil((timeDifference - tenMinutesInMs) / 1000 / 60) // minutes
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${gamesProcessed} games`,
      gamesProcessed,
      totalGamesChecked: games.length,
      results
    });

  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
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