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

  const { email, message } = body as { email?: unknown; message?: unknown };

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Unesite ispravnu email adresu.' }, { status: 400 });
  }
  if (typeof message !== 'string' || message.trim().length < 10) {
    return NextResponse.json({ error: 'Poruka mora imati najmanje 10 karaktera.' }, { status: 400 });
  }
  if (message.trim().length > 2000) {
    return NextResponse.json({ error: 'Poruka ne sme biti duža od 2000 karaktera.' }, { status: 400 });
  }

  try {
    await sendContactEmail(email.trim(), message.trim());
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Greška pri slanju. Pokušajte ponovo.' }, { status: 500 });
  }
}
