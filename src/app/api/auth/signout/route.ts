import { supabase } from '@/lib/supabase';
  import { NextResponse } from 'next/server';

  export async function GET(request: Request) {
    await supabase.auth.signOut();

    const url = new URL(request.url);
    const origin = url.origin;

    return NextResponse.redirect(new URL('/', origin));
  }
