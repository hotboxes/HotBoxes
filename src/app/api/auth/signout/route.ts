import { supabase } from '@/lib/supabase';
  import { NextResponse } from 'next/server';

  export async function GET() {
    // Sign out
    await supabase.auth.signOut();

    // Redirect to home page
    return NextResponse.redirect(new URL('/', 'https://playhotboxes.com'));
  }
