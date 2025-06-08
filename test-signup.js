const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables
const envContent = fs.readFileSync('.env.production', 'utf8');
const url = 'https://ljyeewnjtkcvbrjjpzyw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqeWVld25qdGtjdmJyamp6eXciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczMzI2MTEwMCwiZXhwIjoyMDQ4ODM3MTAwfQ.lGJzgn0vQfI7GyIZMxYbRCaQpIwhCnOPjrg-x2U3V30';

console.log('Testing Supabase signup...');
console.log('URL:', url);
console.log('Key length:', key?.length);

const supabase = createClient(url, key);

async function testSignup() {
  const testEmail = `test+${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  
  console.log('\n=== Testing Signup ===');
  console.log('Test email:', testEmail);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: 'testuser'
        }
      }
    });
    
    console.log('\n=== Signup Response ===');
    console.log('Error:', error);
    console.log('User created:', !!data?.user);
    console.log('User ID:', data?.user?.id);
    console.log('Email confirmed:', data?.user?.email_confirmed_at);
    console.log('Session:', !!data?.session);
    console.log('Full data:', JSON.stringify(data, null, 2));
    
    if (error) {
      console.log('\n❌ Signup failed:', error.message);
    } else if (data?.user && !data.user.email_confirmed_at) {
      console.log('\n✅ User created successfully - email confirmation required');
      console.log('📧 Confirmation email should be sent to:', testEmail);
    } else if (data?.user && data.user.email_confirmed_at) {
      console.log('\n⚠️ User was auto-confirmed (email confirmation might be disabled)');
    }
    
  } catch (err) {
    console.error('\n❌ Test failed:', err);
  }
}

testSignup();