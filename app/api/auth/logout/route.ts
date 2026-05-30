// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Auth Logout] Error:', err);
    return NextResponse.json({ error: 'Greška pri odjavi' }, { status: 500 });
  }
}
