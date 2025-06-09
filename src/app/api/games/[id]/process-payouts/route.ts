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
    if (!game.numbers_assigned) {
      return NextResponse.json({ error: 'Numbers must be assigned' }, { status: 400 });
    }

    if (!game.home_scores || !game.away_scores || game.home_scores.length === 0) {
      return NextResponse.json({ error: 'No scores to process' }, { status: 400 });
    }

    // Get all boxes for this game
    const { data: boxes, error: boxesError } = await supabase
      .from('boxes')
      .select('*')
      .eq('game_id', id)
      .not('user_id', 'is', null);

    if (boxesError) {
      throw boxesError;
    }

    // Calculate total prize pool
    const totalBoxesSold = boxes?.length || 0;
    const totalRevenue = totalBoxesSold * game.entry_fee;
    const prizePool = Math.floor(totalRevenue * 0.9); // 90% to winners

    const payouts = [];
    const transactionRecords = [];

    // Process each period/quarter
    for (let period = 0; period < game.home_scores.length; period++) {
      const homeScore = game.home_scores[period];
      const awayScore = game.away_scores[period];
      
      // Get winning digits
      const homeDigit = homeScore % 10;
      const awayDigit = awayScore % 10;
      
      // Find the grid position using correct coordinate system
      let winningRow = -1;
      let winningCol = -1;
      
      // Check each grid position to see if it matches the score digits
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          const homeNumber = game.home_numbers[col]; // HOME = HORIZONTAL = COLUMN
          const awayNumber = game.away_numbers[row]; // AWAY = VERTICAL = ROW
          
          if (homeNumber === homeDigit && awayNumber === awayDigit) {
            winningRow = row;
            winningCol = col;
            break;
          }
        }
        if (winningRow !== -1) break;
      }
      
      if (winningRow !== -1 && winningCol !== -1) {
        // Find the winning box
        const winningBox = boxes?.find(box => 
          box.row === winningRow && box.col === winningCol
        );
        
        if (winningBox && winningBox.user_id) {
          const periodName = period === 0 ? '1st Quarter' : 
                          period === 1 ? 'Halftime' : 
                          period === 2 ? '3rd Quarter' : 
                          period === 3 ? 'Final' : `Period ${period + 1}`;
          
          // Get custom payout amount for this period
          const payoutAmount = period === 0 ? game.payout_q1 :
                              period === 1 ? game.payout_q2 :
                              period === 2 ? game.payout_q3 :
                              period === 3 ? game.payout_final : 0;
          
          // Get current balance first
          const { data: currentProfile, error: profileError } = await supabase
            .from('profiles')
            .select('hotcoin_balance')
            .eq('id', winningBox.user_id)
            .single();

          if (profileError) {
            console.error(`Error getting profile for user ${winningBox.user_id}:`, profileError);
            continue;
          }

          // Award payout
          const newBalance = (currentProfile.hotcoin_balance || 0) + payoutAmount;
          const { error: balanceError } = await supabase
            .from('profiles')
            .update({
              hotcoin_balance: newBalance
            })
            .eq('id', winningBox.user_id);

          if (balanceError) {
            console.error(`Error updating balance for user ${winningBox.user_id}:`, balanceError);
          } else {
            // Record transaction
            const transactionData = {
              user_id: winningBox.user_id,
              type: 'payout',
              amount: payoutAmount,
              description: `${periodName} winner - ${game.name}`,
              game_id: id,
            };

            transactionRecords.push(transactionData);

            payouts.push({
              period: periodName,
              userId: winningBox.user_id,
              amount: payoutAmount,
              homeScore,
              awayScore,
              homeDigit,
              awayDigit,
              gridPosition: { row: winningRow, col: winningCol }
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