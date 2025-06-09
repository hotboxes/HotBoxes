import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: games } = await supabase
      .from('games')
      .select('*')
      .eq('is_active', true)
      .eq('numbers_assigned', false);

    if (!games?.length) {
      return NextResponse.json({ message: 'No games' });
    }

    const now = Date.now();
    let count = 0;

    for (const game of games) {
      const gameStart = new Date(game.game_date).getTime();
      if (gameStart - now <= 600000) {
        const home = [0,1,2,3,4,5,6,7,8,9].sort(() => 0.5 - Math.random());
        const away = [0,1,2,3,4,5,6,7,8,9].sort(() => 0.5 - Math.random());
        
        await supabase
          .from('games')
          .update({ home_numbers: home, away_numbers: away, numbers_assigned: true })
          .eq('id', game.id);
          
        count++;
      }
    }

    return NextResponse.json({ assigned: count, total: games.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}