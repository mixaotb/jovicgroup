// app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function getCallerRole(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('users').select('role').eq('id', userId).single();
  return (data?.role ?? null) as string | null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 });

    const role = await getCallerRole(supabase, user.id);

    let query = supabase
      .from('tasks')
      .select(`*, users (id, email, full_name)`)
      .order('created_at', { ascending: false });

    // Workers only see tasks assigned to them
    if (role === 'worker') {
      query = query.eq('assigned_to', user.id);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ tasks: data });
  } catch (err) {
    console.error('[Tasks GET] Error:', err);
    return NextResponse.json({ error: 'Interna greška servera' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 });

    const role = await getCallerRole(supabase, user.id);
    if (role === 'worker') {
      return NextResponse.json({ error: 'Radnici ne mogu kreirati zadatke' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, assigned_to, due_date, order_id } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Naslov zadatka je obavezan' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        assigned_to: assigned_to || null,
        due_date: due_date || null,
        order_id: order_id || null,
        status: 'todo',
      })
      .select(`*, users (id, email, full_name)`)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, task: data }, { status: 201 });
  } catch (err) {
    console.error('[Tasks POST] Error:', err);
    return NextResponse.json({ error: 'Interna greška servera' }, { status: 500 });
  }
}
