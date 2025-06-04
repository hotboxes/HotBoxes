import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { id } = params;

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

    // Get the game with all necessary data
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Validate game state
    if (!game.numbersAssigned) {
      return NextResponse.json({ error: 'Numbers must be assigned' }, { status: 400 });
    }

    if (!game.homeScores || !game.awayScores || game.homeScores.length === 0) {
      return NextResponse.json({ error: 'No scores to process' }, { status: 400 });
    }

    // Get all boxes for this game
    const { data: boxes, error: boxesError } = await supabase
      .from('boxes')
      .select('*')
      .eq('gameId', id)
      .not('userId', 'is', null);

    if (boxesError) {
      throw boxesError;
    }

    // Calculate total prize pool
    const totalBoxesSold = boxes?.length || 0;
    const totalRevenue = totalBoxesSold * game.entryFee;
    const prizePool = Math.floor(totalRevenue * 0.9); // 90% to winners
    const prizePerPeriod = Math.floor(prizePool / 4); // Split across 4 periods

    const payouts = [];
    const transactionRecords = [];

    // Process each period/quarter
    for (let period = 0; period < game.homeScores.length; period++) {
      const homeScore = game.homeScores[period];
      const awayScore = game.awayScores[period];
      
      // Get winning digits
      const homeDigit = homeScore % 10;
      const awayDigit = awayScore % 10;
      
      // Find the grid position
      const homeRow = game.homeNumbers.indexOf(homeDigit);
      const awayCol = game.awayNumbers.indexOf(awayDigit);
      
      if (homeRow !== -1 && awayCol !== -1) {
        // Find the winning box
        const winningBox = boxes?.find(box => 
          box.row === homeRow && box.column === awayCol
        );
        
        if (winningBox && winningBox.userId) {
          const periodName = period === 0 ? '1st Quarter' : 
                          period === 1 ? 'Halftime' : 
                          period === 2 ? '3rd Quarter' : 
                          period === 3 ? 'Final' : `Period ${period + 1}`;
          
          // Award payout
          const { error: balanceError } = await supabase
            .from('profiles')
            .update({
              hotcoin_balance: supabase.raw('hotcoin_balance + ?', [prizePerPeriod])
            })
            .eq('id', winningBox.userId);

          if (balanceError) {
            console.error(`Error updating balance for user ${winningBox.userId}:`, balanceError);
          } else {
            // Record transaction
            const transactionData = {
              user_id: winningBox.userId,
              type: 'payout',
              amount: prizePerPeriod,
              description: `${periodName} winner - ${game.name}`,
              game_id: id,
            };

            transactionRecords.push(transactionData);

            payouts.push({
              period: periodName,
              userId: winningBox.userId,
              amount: prizePerPeriod,
              homeScore,
              awayScore,
              homeDigit,
              awayDigit,
              gridPosition: { row: homeRow, col: awayCol }
            });
          }
        }
      }
    }

    // Insert all transaction records
    if (transactionRecords.length > 0) {
      const { error: transactionError } = await supabase
        .from('hotcoin_transactions')
        .insert(transactionRecords);

      if (transactionError) {
        console.error('Error recording transactions:', transactionError);
      }
    }

    // Get winner user details for response
    const winnerIds = payouts.map(p => p.userId);
    const { data: winners } = await supabase
      .from('profiles')
      .select('id, username, email')
      .in('id', winnerIds);

    // Add winner details to payouts
    const detailedPayouts = payouts.map(payout => ({
      ...payout,
      winner: winners?.find(w => w.id === payout.userId)
    }));

    return NextResponse.json({
      success: true,
      totalRevenue,
      prizePool,
      prizePerPeriod,
      payoutsProcessed: payouts.length,
      payouts: detailedPayouts,
      message: `Processed ${payouts.length} payouts totaling ${payouts.reduce((sum, p) => sum + p.amount, 0)} HotCoins`
    });

  } catch (error) {
    console.error('Error processing payouts:', error);
    return NextResponse.json(
      { error: 'Failed to process payouts' },
      { status: 500 }
    );
  }
}