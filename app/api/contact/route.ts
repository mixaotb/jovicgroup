import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!await rateLimit(`contact:${ip}`, 3, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Previše zahteva. Pokušajte ponovo za 10 minuta.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Neispravan zahtev.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Neispravan zahtev.' }, { status: 400 });
  }

  const { name, phone, email, message, website } = body as Record<string, unknown>;

  // Honeypot — real visitors never see this field; bots fill it. Pretend success.
  if (typeof website === 'string' && website.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  const nameStr    = typeof name    === 'string' ? name.trim()    : '';
  const phoneStr   = typeof phone   === 'string' ? phone.trim()   : '';
  const emailStr   = typeof email   === 'string' ? email.trim()   : '';
  const messageStr = typeof message === 'string' ? message.trim() : '';

  if (nameStr.length < 2) {
    return NextResponse.json({ error: 'Unesite ime i prezime.' }, { status: 400 });
  }
  if (nameStr.length > 100) {
    return NextResponse.json({ error: 'Ime ne sme biti duže od 100 karaktera.' }, { status: 400 });
  }
  if (!/^[\d\s+\-()/]{6,20}$/.test(phoneStr)) {
    return NextResponse.json({ error: 'Unesite ispravan broj telefona.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
    return NextResponse.json({ error: 'Unesite ispravnu email adresu.' }, { status: 400 });
  }
  if (messageStr.length < 10) {
    return NextResponse.json({ error: 'Poruka mora imati najmanje 10 karaktera.' }, { status: 400 });
  }
  if (messageStr.length > 2000) {
    return NextResponse.json({ error: 'Poruka ne sme biti duža od 2000 karaktera.' }, { status: 400 });
  }

  try {
    await sendContactEmail({
      name:    nameStr,
      phone:   phoneStr,
      email:   emailStr,
      message: messageStr,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Greška pri slanju. Pokušajte ponovo.' }, { status: 500 });
  }
}
