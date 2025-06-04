// Database Connection Test
// Run this after setting up your database: node test-database.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testDatabase() {
  console.log('🔍 Testing HotBoxes Database Connection...\n');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Environment variables missing!');
    console.log('   Make sure .env.local has:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL=your_url');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
    return;
  }
  
  console.log('✅ Environment variables found');
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test 1: Check profiles table
    console.log('🧪 Testing profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, email, is_admin')
      .limit(5);
    
    if (profilesError) throw profilesError;
    console.log(`✅ Profiles table: ${profiles.length} records found`);
    
    // Test 2: Check games table
    console.log('🧪 Testing games table...');
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, name, sport, entry_fee')
      .limit(5);
    
    if (gamesError) throw gamesError;
    console.log(`✅ Games table: ${games.length} records found`);
    
    // Test 3: Check boxes table
    console.log('🧪 Testing boxes table...');
    const { data: boxes, error: boxesError } = await supabase
      .from('boxes')
      .select('id, row, column, game_id')
      .limit(5);
    
    if (boxesError) throw boxesError;
    console.log(`✅ Boxes table: ${boxes.length} records found`);
    
    // Test 4: Check transactions table
    console.log('🧪 Testing hotcoin_transactions table...');
    const { data: transactions, error: transactionsError } = await supabase
      .from('hotcoin_transactions')
      .select('id, type, amount')
      .limit(5);
    
    if (transactionsError) throw transactionsError;
    console.log(`✅ Transactions table: ${transactions.length} records found`);
    
    // Test 5: Sample data verification
    console.log('🧪 Checking sample data...');
    const adminUser = profiles.find(p => p.is_admin);
    if (adminUser) {
      console.log(`✅ Admin user found: ${adminUser.username || adminUser.email}`);
    } else {
      console.log('⚠️  No admin user found - you may need to create one');
    }
    
    const sampleGame = games.find(g => g.name.includes('Chiefs'));
    if (sampleGame) {
      console.log(`✅ Sample game found: ${sampleGame.name}`);
    } else {
      console.log('⚠️  No sample game found');
    }
    
    console.log('\n🎉 Database setup verification complete!');
    console.log('✅ All tables are accessible and functional');
    console.log('🚀 Ready to run: npm run dev');
    
  } catch (error) {
    console.log('\n❌ Database test failed!');
    console.log('Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you ran the supabase-schema.sql file');
    console.log('2. Check your environment variables are correct');
    console.log('3. Verify your Supabase project is active');
    console.log('4. Check the Supabase logs for errors');
  }
}

// Run the test
testDatabase();