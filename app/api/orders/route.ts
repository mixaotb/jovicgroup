// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendNewOrderEmail, sendOrderConfirmationEmail } from '@/lib/email';
import { formatRSD, calculatePrice } from '@/lib/pricing';
import { rateLimit } from '@/lib/ratelimit';
import type { OrderFormData, OrderItemData } from '@/types';

function isValidLocation(v: string): v is 'Srbija' | 'Inostranstvo' {
  return v === 'Srbija' || v === 'Inostranstvo';
}

function isValidPaymentMethod(v: string): v is 'cash_on_delivery' | 'racun' {
  return v === 'cash_on_delivery' || v === 'racun';
}

function isValidProductType(v: string): boolean {
  return ['window_single', 'window_double', 'door'].includes(v);
}

function isValidMaterial(v: string): boolean {
  return v === 'PVC' || v === 'ALU';
}

// Validate individual item
function validateOrderItem(item: OrderItemData): string | null {
  const { dimensions_data } = item;
  
  if (!dimensions_data) {
    return 'Podaci o dimenzijama su obavezni';
  }

  const { type, material, width, height, quantity } = dimensions_data;

  if (!isValidProductType(type)) {
    return 'Neispravan tip proizvoda';
  }

  if (!isValidMaterial(material)) {
    return 'Neispravan materijal';
  }

  if (!width || width < 400 || width > 2500) {
    return 'Širina mora biti između 400 i 2500 mm';
  }

  if (!height || height < 400 || height > 2800) {
    return 'Visina mora biti između 400 i 2800 mm';
  }

  if (!quantity || quantity < 1 || quantity > 50) {
    return 'Količina mora biti između 1 i 50';
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
    if (!rateLimit(`orders:${ip}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Previše zahteva. Pokušajte ponovo za sat vremena.' },
        { status: 429 }
      );
    }

    const body = (await request.json()) as Partial<OrderFormData>;

    // — Validate required fields —
    if (!body.customer_name?.trim()) {
      return NextResponse.json({ error: 'Ime i prezime je obavezno' }, { status: 400 });
    }

    if (!body.phone?.trim()) {
      return NextResponse.json({ error: 'Broj telefona je obavezan' }, { status: 400 });
    }

    if (!/^[\d\s\+\-\(\)]{7,15}$/.test(body.phone.trim())) {
      return NextResponse.json({ error: 'Neispravan broj telefona' }, { status: 400 });
    }

    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: 'Neispravna email adresa' }, { status: 400 });
    }

    if (!body.location || !isValidLocation(body.location)) {
      return NextResponse.json({ error: 'Neispravna lokacija dostave' }, { status: 400 });
    }

    if (!body.payment_method || !isValidPaymentMethod(body.payment_method)) {
      return NextResponse.json({ error: 'Neispravan način plaćanja' }, { status: 400 });
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Narudžbina mora imati barem jednu stavku' }, { status: 400 });
    }

    // Validate each item
    for (const item of body.items) {
      const itemError = validateOrderItem(item);
      if (itemError) {
        return NextResponse.json({ error: itemError }, { status: 400 });
      }
    }

    // Calculate price server-side — never trust the client-submitted value.
    // Sum production cost across all items, then add delivery fee once per order.
    let productionTotal = 0;
    let deliveryFee = 0;
    for (const item of body.items) {
      const { type, material, width, height, quantity } = item.dimensions_data;
      const breakdown = calculatePrice(width, height, material, type, body.location!, quantity);
      productionTotal += breakdown.basePrice;
      deliveryFee = breakdown.deliveryFee; // same for all items on the same order
    }
    const totalPrice = productionTotal + deliveryFee;

    // — Insert into Supabase (admin client bypasses RLS for public submissions) —
    const supabase = createAdminClient();

    // 1. Create main order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: body.customer_name.trim(),
        phone: body.phone.trim(),
        email: body.email?.trim() || null,
        location: body.location,
        status: 'na_cekanju',
        total_price: totalPrice,
        payment_method: body.payment_method,
        notes: body.notes?.trim() || null,
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('[Orders API] Supabase insert error:', orderError);
      return NextResponse.json(
        { error: 'Greška pri čuvanju narudžbine. Pokušajte ponovo.' },
        { status: 500 }
      );
    }

    // 2. Create order items
    const orderItems = body.items.map(item => ({
      order_id: order.id,
      type: item.dimensions_data.type,
      material: item.dimensions_data.material,
      width: item.dimensions_data.width,
      height: item.dimensions_data.height,
      quantity: item.dimensions_data.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback: delete the order if items fail
      await supabase.from('orders').delete().eq('id', order.id);
      console.error('[Orders API] Items insert error:', itemsError);
      return NextResponse.json(
        { error: 'Greška pri čuvanju stavki narudžbine. Pokušajte ponovo.' },
        { status: 500 }
      );
    }

    // Fire-and-forget: email admin + create in-app notification (non-blocking)
    void Promise.allSettled([
      sendNewOrderEmail({
        orderId: order.id,
        customerName: body.customer_name!.trim(),
        phone: body.phone!.trim(),
        email: body.email?.trim() || null,
        location: body.location!,
        paymentMethod: body.payment_method!,
        totalPrice,
        notes: body.notes?.trim() || null,
        items: body.items!.map(i => ({
          type: i.dimensions_data.type,
          material: i.dimensions_data.material,
          width: i.dimensions_data.width,
          height: i.dimensions_data.height,
          quantity: i.dimensions_data.quantity,
        })),
      }).catch(err => console.error('[Email] Admin send failed:', err)),
      sendOrderConfirmationEmail({
        orderId: order.id,
        customerName: body.customer_name!.trim(),
        phone: body.phone!.trim(),
        email: body.email?.trim() || null,
        location: body.location!,
        paymentMethod: body.payment_method!,
        totalPrice,
        notes: body.notes?.trim() || null,
        items: body.items!.map(i => ({
          type: i.dimensions_data.type,
          material: i.dimensions_data.material,
          width: i.dimensions_data.width,
          height: i.dimensions_data.height,
          quantity: i.dimensions_data.quantity,
        })),
      }).catch(err => console.error('[Email] Client send failed:', err)),
      supabase.from('notifications').insert({
        type: 'new_order',
        title: `Nova narudžbina — ${body.customer_name!.trim()}`,
        body: `${body.phone!.trim()} · ${body.location} · ${formatRSD(totalPrice)}`,
        order_id: order.id,
      }).then(({ error }) => { if (error) console.error('[Notifications] Insert failed:', error); }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'Narudžbina je uspešno primljena.',
        order: { id: order.id, total_price: totalPrice },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[Orders API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Interna greška servera. Pokušajte ponovo.' },
      { status: 500 }
    );
  }
}

// GET: List orders (protected, used by CRM)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (location && isValidLocation(location)) {
      query = query.eq('location', location);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data, total: count, page, pageSize });
  } catch (err) {
    console.error('[Orders API GET] Error:', err);
    return NextResponse.json({ error: 'Interna greška servera' }, { status: 500 });
  }
}