// app/api/orders/admin/route.ts — auth-protected manual order creation (CRM use only)
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase';
import { sendNewOrderEmail } from '@/lib/email';
import { formatRSD } from '@/lib/pricing';
import type { ProductType, OrderStatus } from '@/types';

const VALID_PRODUCT_TYPES: ProductType[] = [
  'window_single', 'window_double', 'trokrilni_prozor', 'fiksni_prozor',
  'door', 'balkonska_vrata', 'klizna_vrata', 'plisirani_komarnik',
];

const VALID_STATUSES: OrderStatus[] = ['na_cekanju', 'u_proizvodnji', 'isporuceno', 'otkazano'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 });

    const body = await request.json();

    if (!body.customer_name?.trim())
      return NextResponse.json({ error: 'Ime klijenta je obavezno' }, { status: 400 });
    if (!body.phone?.trim())
      return NextResponse.json({ error: 'Telefon je obavezan' }, { status: 400 });
    if (body.location !== 'Srbija' && body.location !== 'Inostranstvo')
      return NextResponse.json({ error: 'Lokacija je obavezna' }, { status: 400 });
    if (body.payment_method !== 'cash_on_delivery' && body.payment_method !== 'racun')
      return NextResponse.json({ error: 'Način plaćanja je obavezan' }, { status: 400 });

    const status: OrderStatus = VALID_STATUSES.includes(body.status) ? body.status : 'na_cekanju';

    const items = body.items as Array<{
      type: string; material: string; width: number; height: number; quantity: number;
    }>;

    if (!Array.isArray(items) || items.length === 0)
      return NextResponse.json({ error: 'Narudžbina mora imati barem jednu stavku' }, { status: 400 });

    for (const item of items) {
      if (!VALID_PRODUCT_TYPES.includes(item.type as ProductType))
        return NextResponse.json({ error: 'Neispravan tip proizvoda' }, { status: 400 });
      if (item.material !== 'PVC' && item.material !== 'ALU')
        return NextResponse.json({ error: 'Neispravan materijal' }, { status: 400 });
      if (!item.width || item.width < 100 || item.width > 4000)
        return NextResponse.json({ error: 'Neispravna širina (100–4000 mm)' }, { status: 400 });
      if (!item.height || item.height < 100 || item.height > 4000)
        return NextResponse.json({ error: 'Neispravna visina (100–4000 mm)' }, { status: 400 });
      if (!item.quantity || item.quantity < 1 || item.quantity > 100)
        return NextResponse.json({ error: 'Neispravna količina (1–100)' }, { status: 400 });
    }

    const totalPrice = typeof body.total_price === 'number' && body.total_price >= 0 ? body.total_price : 0;

    const adminClient = createAdminClient();

    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .insert({
        customer_name:  body.customer_name.trim(),
        phone:          body.phone.trim(),
        email:          body.email?.trim() || null,
        location:       body.location,
        town:           body.town?.trim() || null,
        address:        body.address?.trim() || null,
        status,
        total_price:    totalPrice,
        payment_method: body.payment_method,
        notes:          body.notes?.trim() || null,
      })
      .select('id, created_at, updated_at')
      .single();

    if (orderError) {
      console.error('[Orders Admin API] Insert error:', orderError);
      return NextResponse.json({ error: 'Greška pri čuvanju narudžbine' }, { status: 500 });
    }

    const orderItems = items.map(item => ({
      order_id:        order.id,
      type:            item.type,
      material:        item.material,
      width:           item.width,
      height:          item.height,
      quantity:        item.quantity,
      dimensions_data: { type: item.type, material: item.material, width: item.width, height: item.height, quantity: item.quantity },
    }));

    const { error: itemsError } = await adminClient.from('order_items').insert(orderItems);

    if (itemsError) {
      await adminClient.from('orders').delete().eq('id', order.id);
      console.error('[Orders Admin API] Items insert error:', itemsError);
      return NextResponse.json({ error: 'Greška pri čuvanju stavki narudžbine' }, { status: 500 });
    }

    void Promise.allSettled([
      sendNewOrderEmail({
        orderId:       order.id,
        customerName:  body.customer_name.trim(),
        phone:         body.phone.trim(),
        email:         body.email?.trim() || null,
        location:      body.location,
        town:          body.town?.trim() || null,
        address:       body.address?.trim() || null,
        paymentMethod: body.payment_method,
        totalPrice,
        notes:         body.notes?.trim() || null,
        items: items.map(i => ({ type: i.type, material: i.material, width: i.width, height: i.height, quantity: i.quantity })),
      }).catch(err => console.error('[Email] Admin send failed:', err)),
      adminClient.from('notifications').insert({
        type:     'new_order',
        title:    `Nova narudžbina (CRM) — ${body.customer_name.trim()}`,
        body:     `${body.phone.trim()} · ${body.location} · ${formatRSD(totalPrice)}`,
        order_id: order.id,
      }).then(({ error }) => { if (error) console.error('[Notifications] Insert failed:', error); }),
    ]);

    return NextResponse.json({
      success: true,
      order: {
        id:             order.id,
        total_price:    totalPrice,
        customer_name:  body.customer_name.trim(),
        phone:          body.phone.trim(),
        email:          body.email?.trim() || null,
        location:       body.location,
        town:           body.town?.trim() || null,
        address:        body.address?.trim() || null,
        status,
        payment_method: body.payment_method,
        notes:          body.notes?.trim() || null,
        created_at:     order.created_at,
        updated_at:     order.updated_at,
        items:          orderItems.map((i, idx) => ({ id: idx, ...i })),
      },
    }, { status: 201 });
  } catch (err) {
    console.error('[Orders Admin API] Unexpected error:', err);
    return NextResponse.json({ error: 'Interna greška servera' }, { status: 500 });
  }
}
