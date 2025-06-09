// Simple debug script to check payout transactions
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPayouts() {
  const gameId = 'e6ae77ba-ddcf-4966-842c-b47cb123a67f';
  
  console.log('Checking payouts for game:', gameId);
  
  const { data: payouts, error } = await supabase
    .from('hotcoin_transactions')
    .select('*')
    .eq('game_id', gameId)
    .eq('type', 'payout')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Found payout transactions:', payouts.length);
    payouts.forEach((p, i) => {
      console.log(`${i+1}. ${p.description} - ${p.amount} HC - ${p.created_at}`);
    });
  }
}

checkPayouts();