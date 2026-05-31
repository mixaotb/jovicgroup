// app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import type { TaskStatus } from '@/types';

const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;
    const isPrivileged = role === 'admin' || role === 'manager';

    const { id } = await params;
    const body = await request.json();

    // Workers can only update status on tasks assigned to them
    if (!isPrivileged) {
      const { data: task } = await supabase
        .from('tasks')
        .select('assigned_to')
        .eq('id', id)
        .single();

      if (!task || task.assigned_to !== user.id) {
        return NextResponse.json({ error: 'Zabranjen pristup' }, { status: 403 });
      }

      const allowedKeys = new Set(['status']);
      const hasDisallowedKeys = Object.keys(body).some((k) => !allowedKeys.has(k));
      if (hasDisallowedKeys) {
        return NextResponse.json({ error: 'Zabranjen pristup' }, { status: 403 });
      }
    }

    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Neispravan status' }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (isPrivileged) {
      if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to || null;
      if (body.title !== undefined) updates.title = body.title.trim();
      if (body.description !== undefined) updates.description = body.description?.trim() || null;
      if (body.due_date !== undefined) updates.due_date = body.due_date || null;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select(`*, users(id, email, full_name)`)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, task: data });
  } catch (err) {
    console.error('[Task PATCH] Error:', err);
    return NextResponse.json({ error: 'Interna greška servera' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return NextResponse.json({ error: 'Zabranjen pristup' }, { status: 403 });
    }

    const { id } = await params;

    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Task DELETE] Error:', err);
    return NextResponse.json({ error: 'Interna greška servera' }, { status: 500 });
  }
}
