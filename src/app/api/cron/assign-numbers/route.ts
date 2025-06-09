import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await import('@supabase/supabase-js').then(mod => 
      mod.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    );
    
    const { data: games } = await supabase
      .from('games')
      .select('*')
      .eq('is_active', true)
      .eq('numbers_assigned', false);

    if (!games?.length) {
      return NextResponse.json({ message: 'No games need numbers', count: 0 });
    }

    const now = Date.now();
    let assigned = 0;

    for (const game of games) {
      const gameTime = new Date(game.game_date).getTime();
      const tenMinutes = 10 * 60 * 1000;
      
      if (gameTime - now <= tenMinutes) {
        const shuffle = (arr: number[]) => {
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
          return arr;
        };
        
        const home = shuffle([0,1,2,3,4,5,6,7,8,9]);
        const away = shuffle([0,1,2,3,4,5,6,7,8,9]);
        
        await supabase
          .from('games')
          .update({ 
            home_numbers: home, 
            away_numbers: away, 
            numbers_assigned: true 
          })
          .eq('id', game.id);
          
        assigned++;
      }
    }

    return NextResponse.json({ 
      message: `Assigned numbers to ${assigned} games`,
      assigned,
      total: games.length 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}