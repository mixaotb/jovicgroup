// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { createAdminClient } from '@/lib/supabase';
import type { UserRole } from '@/types';

async function getCallerRole(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return (data?.role ?? null) as UserRole | null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 });

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, full_name, created_at')
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const currentRole = await getCallerRole(supabase, user.id);

    return NextResponse.json({ users: users ?? [], currentRole });
  } catch (err) {
    console.error('[Users GET] Error:', err);
    return NextResponse.json({ error: 'Interna greška servera' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 });

    const callerRole = await getCallerRole(supabase, user.id);
    if (callerRole !== 'admin') {
      return NextResponse.json({ error: 'Samo admini mogu kreirati korisnike' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, full_name, role } = body as {
      email: string;
      password: string;
      full_name?: string;
      role: UserRole;
    };

    if (!email?.trim()) return NextResponse.json({ error: 'Email je obavezan' }, { status: 400 });
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Lozinka mora imati najmanje 6 karaktera' }, { status: 400 });
    }
    if (!['admin', 'manager', 'worker'].includes(role)) {
      return NextResponse.json({ error: 'Neispravna rola' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Create Supabase Auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ error: 'Korisnik sa tim emailom već postoji' }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // Insert into public.users via admin client to bypass RLS
    const { data: newUser, error: insertError } = await adminClient
      .from('users')
      .insert({
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        role,
        full_name: full_name?.trim() || null,
      })
      .select('id, email, role, full_name, created_at')
      .single();

    if (insertError) {
      // Rollback: delete the auth user we just created
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (err) {
    console.error('[Users POST] Error:', err);
    return NextResponse.json({ error: 'Interna greška servera' }, { status: 500 });
  }
}
