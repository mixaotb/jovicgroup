// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { createAdminClient } from '@/lib/supabase';
import { sendNewOrderEmail, sendOrderConfirmationEmail } from '@/lib/email';
import { formatRSD, calculatePrice, DIMENSION_LIMITS } from '@/lib/pricing';
import { rateLimit, getClientIp } from '@/lib/ratelimit';
import type { OrderFormData, OrderItemData, ProductType, GlassType, OkovType, ColorType } from '@/types';

const VALID_PRODUCT_TYPES: ProductType[] = [
  'window_single', 'window_double', 'trokrilni_prozor', 'fiksni_prozor',
  'door', 'balkonska_vrata', 'klizna_vrata', 'plisirani_komarnik',
];
const VALID_GLASS_TYPES: GlassType[] = [
  'dvoslojno', 'dvoslojno_niskoemisiono', 'dvoslojno_peskirano',
  'niskoemisiono', '4_godisnja_doba', 'peskirano',
];
const VALID_OKOV_TYPES: OkovType[]     = ['agb', 'schuco'];
const VALID_COLOR_TYPES: ColorType[]   = ['white', 'anthracite', 'wood'];

function isValidLocation(v: string): v is 'Srbija' | 'Inostranstvo' {
  return v === 'Srbija' || v === 'Inostranstvo';
}

function isValidPaymentMethod(v: string): v is 'cash_on_delivery' | 'racun' {
  return v === 'cash_on_delivery' || v === 'racun';
}

function validateOrderItem(item: OrderItemData): string | null {
  const d = item.dimensions_data;
  if (!d) return 'Podaci o dimenzijama su obavezni';

  const { type, material, width, height, quantity } = d;

  if (!VALID_PRODUCT_TYPES.includes(type)) return 'Neispravan tip proizvoda';
  if (material !== 'PVC' && material !== 'ALU') return 'Neispravan materijal';

  const limits = DIMENSION_LIMITS[type];
  if (!width  || width  < limits.minW || width  > limits.maxW)
    return `Širina mora biti između ${limits.minW} i ${limits.maxW} mm`;
  if (!height || height < limits.minH || height > limits.maxH)
    return `Visina mora biti između ${limits.minH} i ${limits.maxH} mm`;
  if (!quantity || quantity < 1 || quantity > 50) return 'Količina mora biti između 1 i 50';

  if (d.glassType  && !VALID_GLASS_TYPES.includes(d.glassType))  return 'Neispravan tip stakla';
  if (d.okovType   && !VALID_OKOV_TYPES.includes(d.okovType))    return 'Neispravan tip okova';
  if (d.color      && !VALID_COLOR_TYPES.includes(d.color))      return 'Neispravna boja';

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!await rateLimit(`orders:${ip}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Previše zahteva. Pokušajte ponovo za sat vremena.' },
        { status: 429 }
      );
    }

    const body = (await request.json()) as Partial<OrderFormData>;

    if (!body.customer_name?.trim())
      return NextResponse.json({ error: 'Ime i prezime je obavezno' }, { status: 400 });
    if (!body.phone?.trim())
      return NextResponse.json({ error: 'Broj telefona je obavezan' }, { status: 400 });
    if (!/^[\d\s\+\-\(\)]{7,15}$/.test(body.phone.trim()))
      return NextResponse.json({ error: 'Neispravan broj telefona' }, { status: 400 });
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
      return NextResponse.json({ error: 'Neispravna email adresa' }, { status: 400 });
    if (!body.location || !isValidLocation(body.location))
      return NextResponse.json({ error: 'Neispravna lokacija dostave' }, { status: 400 });
    if (!body.payment_method || !isValidPaymentMethod(body.payment_method))
      return NextResponse.json({ error: 'Neispravan način plaćanja' }, { status: 400 });
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0)
      return NextResponse.json({ error: 'Narudžbina mora imati barem jednu stavku' }, { status: 400 });

    for (const item of body.items) {
      const err = validateOrderItem(item);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    }

    // Server-side price calculation — never trust the client value
    const deliveryFee = body.location === 'Inostranstvo' ? 25_000 : 3_500;
    let productionTotal = 0;
    for (const item of body.items) {
      const d = item.dimensions_data;
      const breakdown = calculatePrice(d.width, d.height, d.material, d.type, body.location!, d.quantity, {
        glassType:       d.glassType,
        okovType:        d.okovType,
        color:           d.color,
        komarnikType:    d.komarnikType,
        hasRoletna:      d.hasRoletna,
        hasOkapnica:     d.hasOkapnica,
        hasInstallation: d.hasInstallation,
        hasSillInside:   d.hasSillInside,
      });
      productionTotal += breakdown.basePrice;
    }
    const totalPrice = productionTotal + deliveryFee;

    const supabase = createAdminClient();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name:  body.customer_name.trim(),
        phone:          body.phone.trim(),
        email:          body.email?.trim() || null,
        location:       body.location,
        town:           body.town?.trim() || null,
        address:        body.address?.trim() || null,
        status:         'na_cekanju',
        total_price:    totalPrice,
        payment_method: body.payment_method,
        notes:          body.notes?.trim() || null,
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('[Orders API] Supabase insert error:', orderError);
      return NextResponse.json({ error: 'Greška pri čuvanju narudžbine. Pokušajte ponovo.' }, { status: 500 });
    }

    // Upload images to Supabase Storage, store public URL in dimensions_data
    const orderItems = await Promise.all(body.items.map(async (item, idx) => {
      const { imageDataUrl, ...dimData } = item.dimensions_data;
      let image_url: string | undefined;
      if (imageDataUrl) {
        try {
          const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64, 'base64');
          const path = `${order.id}/${idx}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('order-images')
            .upload(path, buffer, { contentType: 'image/jpeg', upsert: false });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('order-images').getPublicUrl(path);
            image_url = urlData.publicUrl;
          } else {
            console.error('[Storage] Image upload failed:', uploadError);
          }
        } catch (err) {
          console.error('[Storage] Image upload error:', err);
        }
      }
      return {
        order_id:        order.id,
        type:            item.dimensions_data.type,
        material:        item.dimensions_data.material,
        width:           item.dimensions_data.width,
        height:          item.dimensions_data.height,
        quantity:        item.dimensions_data.quantity,
        dimensions_data: image_url ? { ...dimData, image_url } : dimData,
      };
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id);
      console.error('[Orders API] Items insert error:', itemsError);
      return NextResponse.json({ error: 'Greška pri čuvanju stavki narudžbine. Pokušajte ponovo.' }, { status: 500 });
    }

    const emailItems = body.items!.map(i => ({
      type:            i.dimensions_data.type,
      material:        i.dimensions_data.material,
      width:           i.dimensions_data.width,
      height:          i.dimensions_data.height,
      quantity:        i.dimensions_data.quantity,
      glassType:       i.dimensions_data.glassType,
      color:           i.dimensions_data.color,
      okovType:        i.dimensions_data.okovType,
      komarnikType:    i.dimensions_data.komarnikType,
      hasRoletna:      i.dimensions_data.hasRoletna,
      hasOkapnica:     i.dimensions_data.hasOkapnica,
      hasInstallation: i.dimensions_data.hasInstallation,
      hasSillInside:   i.dimensions_data.hasSillInside,
    }));

    void Promise.allSettled([
      sendNewOrderEmail({
        orderId:       order.id,
        customerName:  body.customer_name!.trim(),
        phone:         body.phone!.trim(),
        email:         body.email?.trim() || null,
        location:      body.location!,
        town:          body.town?.trim() || null,
        address:       body.address?.trim() || null,
        paymentMethod: body.payment_method!,
        totalPrice,
        notes:         body.notes?.trim() || null,
        items:         emailItems,
      }).catch(err => console.error('[Email] Admin send failed:', err)),
      sendOrderConfirmationEmail({
        orderId:       order.id,
        customerName:  body.customer_name!.trim(),
        phone:         body.phone!.trim(),
        email:         body.email?.trim() || null,
        location:      body.location!,
        town:          body.town?.trim() || null,
        address:       body.address?.trim() || null,
        paymentMethod: body.payment_method!,
        totalPrice,
        notes:         body.notes?.trim() || null,
        items:         emailItems,
      }).catch(err => console.error('[Email] Client send failed:', err)),
      supabase.from('notifications').insert({
        type:     'new_order',
        title:    `Nova narudžbina — ${body.customer_name!.trim()}`,
        body:     `${body.phone!.trim()} · ${body.location} · ${formatRSD(totalPrice)}`,
        order_id: order.id,
      }).then(({ error }) => { if (error) console.error('[Notifications] Insert failed:', error); }),
    ]);

    return NextResponse.json(
      { success: true, message: 'Narudžbina je uspešno primljena.', order: { id: order.id, total_price: totalPrice } },
      { status: 201 }
    );
  } catch (err) {
    console.error('[Orders API] Unexpected error:', err);
    return NextResponse.json({ error: 'Interna greška servera. Pokušajte ponovo.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const location  = searchParams.get('location');
    const status    = searchParams.get('status');
    const page      = parseInt(searchParams.get('page')     || '1',  10);
    const pageSize  = Math.min(parseInt(searchParams.get('pageSize') || '20', 10), 100);
    const offset    = (page - 1) * pageSize;

    let query = supabase
      .from('orders')
      .select('*, items:order_items(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (location && isValidLocation(location)) query = query.eq('location', location);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ orders: data, total: count, page, pageSize });
  } catch (err) {
    console.error('[Orders API GET] Error:', err);
    return NextResponse.json({ error: 'Interna greška servera' }, { status: 500 });
  }
}
