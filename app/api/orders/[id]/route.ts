// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import type { OrderStatus, OrderLocation, PaymentMethod } from '@/types';

const VALID_STATUSES: OrderStatus[] = ['na_cekanju', 'u_proizvodnji', 'isporuceno', 'otkazano'];
const VALID_LOCATIONS: OrderLocation[] = ['Srbija', 'Inostranstvo'];
const VALID_PAYMENT_METHODS: PaymentMethod[] = ['cash_on_delivery', 'racun'];

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

    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return NextResponse.json({ error: 'Zabranjen pristup' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Build update payload — only include fields that were provided
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: `Neispravan status. Dozvoljeni: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (body.customer_name !== undefined) {
      if (!body.customer_name.trim()) {
        return NextResponse.json({ error: 'Ime klijenta je obavezno' }, { status: 400 });
      }
      updates.customer_name = body.customer_name.trim();
    }

    if (body.phone !== undefined) {
      if (!body.phone.trim()) {
        return NextResponse.json({ error: 'Telefon je obavezan' }, { status: 400 });
      }
      updates.phone = body.phone.trim();
    }

    if (body.email !== undefined) {
      updates.email = body.email?.trim() || null;
    }

    if (body.location !== undefined) {
      if (!VALID_LOCATIONS.includes(body.location)) {
        return NextResponse.json({ error: 'Neispravna lokacija' }, { status: 400 });
      }
      updates.location = body.location;
    }

    if (body.town !== undefined) {
      updates.town = body.town?.trim() || null;
    }

    if (body.address !== undefined) {
      updates.address = body.address?.trim() || null;
    }

    if (body.total_price !== undefined) {
      const price = Number(body.total_price);
      if (isNaN(price) || price < 0) {
        return NextResponse.json({ error: 'Neispravna cena' }, { status: 400 });
      }
      updates.total_price = price;
    }

    if (body.payment_method !== undefined) {
      if (!VALID_PAYMENT_METHODS.includes(body.payment_method)) {
        return NextResponse.json({ error: 'Neispravan način plaćanja' }, { status: 400 });
      }
      updates.payment_method = body.payment_method;
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes?.trim() || null;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select('id, customer_name, phone, email, location, town, address, status, total_price, payment_method, notes, updated_at')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Narudžbina nije pronađena' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (err) {
    console.error('[Order PATCH] Error:', err);
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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Zabranjen pristup' }, { status: 403 });
    }

    const { id } = await params;

    // Delete order (order_items will cascade delete automatically due to foreign key constraint)
    const { error } = await supabase.from('orders').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Order DELETE] Error:', err);
    return NextResponse.json({ error: 'Interna greška servera' }, { status: 500 });
  }
}