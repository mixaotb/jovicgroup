import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 });

  const limit = parseInt(new URL(request.url).searchParams.get('limit') || '20', 10);

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, order_id, read, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const unread = (data ?? []).filter(n => !n.read).length;
  return NextResponse.json({ notifications: data ?? [], unread });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const admin = createAdminClient();

  if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
    await admin.from('notifications').update({ read: true }).in('id', body.ids);
  } else {
    await admin.from('notifications').update({ read: true }).eq('read', false);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await admin.from('notifications').delete().not('id', 'is', null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
