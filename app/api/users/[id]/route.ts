// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UserRole } from '@/types';

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('users').select('role').eq('id', userId).single();
  return data?.role === 'admin';
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 });

    if (!(await requireAdmin(supabase, user.id))) {
      return NextResponse.json({ error: 'Samo admini mogu menjati korisnike' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.full_name !== undefined) updates.full_name = body.full_name?.trim() || null;
    if (body.role !== undefined) {
      if (!['admin', 'manager', 'worker'].includes(body.role)) {
        return NextResponse.json({ error: 'Neispravna rola' }, { status: 400 });
      }
      updates.role = body.role as UserRole;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nema promena za čuvanje' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, role, full_name, created_at')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (body.password && body.password.length >= 6) {
      await adminClient.auth.admin.updateUserById(id, { password: body.password });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (err) {
    console.error('[Users PATCH] Error:', err);
    return NextResponse.json({ error: 'Interna greška servera' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 });

    if (!(await requireAdmin(supabase, user.id))) {
      return NextResponse.json({ error: 'Samo admini mogu brisati korisnike' }, { status: 403 });
    }

    const { id } = await params;

    if (id === user.id) {
      return NextResponse.json({ error: 'Ne možete obrisati sopstveni nalog' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Delete from auth (public.users will be handled by cascade or we delete manually)
    const { error: authError } = await adminClient.auth.admin.deleteUser(id);
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

    // Delete from public.users via admin client to bypass RLS
    await adminClient.from('users').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Users DELETE] Error:', err);
    return NextResponse.json({ error: 'Interna greška servera' }, { status: 500 });
  }
}
