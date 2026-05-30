import { Resend } from 'resend';
import { formatRSD } from './pricing';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

function productLabel(type: string) {
  return type === 'window_single' ? 'Jednokrilni prozor'
    : type === 'window_double' ? 'Dvokrilni prozor'
    : 'Vrata';
}

export interface NewOrderEmailData {
  orderId: string;
  customerName: string;
  phone: string;
  email?: string | null;
  location: string;
  town?: string | null;
  address?: string | null;
  paymentMethod: string;
  totalPrice: number;
  notes?: string | null;
  items: Array<{
    type: string;
    material: string;
    width: number;
    height: number;
    quantity: number;
  }>;
}

export async function sendNewOrderEmail(data: NewOrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY || !ADMIN_EMAIL) return;

  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#e2e8f0;font-size:13px;">${productLabel(item.type)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px;">${item.material}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px;">${item.width}×${item.height} mm</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#e2e8f0;font-size:13px;text-align:center;">${item.quantity}</td>
    </tr>`).join('');

  const locationLine = [data.location, data.town, data.address].filter(Boolean).join(' · ');

  const html = `<!DOCTYPE html>
<html lang="sr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080E1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">

  <div style="background:#0E1625;border:1px solid #1e293b;border-radius:16px;overflow:hidden;">

    <!-- Header -->
    <div style="padding:28px 32px;border-bottom:1px solid #1e293b;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <div style="width:36px;height:36px;background:#C9A84C;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#080E1A;">J</div>
        <div>
          <div style="color:#C9A84C;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Jović Group CRM</div>
          <div style="color:#475569;font-size:11px;margin-top:1px;">Automatska obaveštenja</div>
        </div>
      </div>
      <h1 style="margin:0 0 6px;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Nova narudžbina primljena</h1>
      <p style="margin:0;color:#475569;font-size:12px;font-family:monospace;">#${data.orderId.slice(0, 8).toUpperCase()}</p>
    </div>

    <!-- Customer -->
    <div style="padding:24px 32px;border-bottom:1px solid #1e293b;">
      <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;">Podaci o klijentu</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#64748b;font-size:13px;padding:3px 0;width:130px;">Ime i prezime</td><td style="color:#f1f5f9;font-size:13px;font-weight:600;padding:3px 0;">${data.customerName}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:3px 0;">Telefon</td><td style="color:#f1f5f9;font-size:13px;padding:3px 0;">${data.phone}</td></tr>
        ${data.email ? `<tr><td style="color:#64748b;font-size:13px;padding:3px 0;">Email</td><td style="color:#f1f5f9;font-size:13px;padding:3px 0;">${data.email}</td></tr>` : ''}
        <tr><td style="color:#64748b;font-size:13px;padding:3px 0;">Lokacija</td><td style="color:#f1f5f9;font-size:13px;padding:3px 0;">${locationLine}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:3px 0;">Plaćanje</td><td style="color:#f1f5f9;font-size:13px;padding:3px 0;">${data.paymentMethod === 'cash_on_delivery' ? 'Pouzećem' : 'Račun'}</td></tr>
      </table>
    </div>

    <!-- Items -->
    <div style="padding:24px 32px;border-bottom:1px solid #1e293b;">
      <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;">Stavke narudžbine</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#080E1A;">
            <th style="text-align:left;padding:8px 12px;color:#475569;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Tip</th>
            <th style="text-align:left;padding:8px 12px;color:#475569;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Mat.</th>
            <th style="text-align:left;padding:8px 12px;color:#475569;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Dimenzije</th>
            <th style="text-align:center;padding:8px 12px;color:#475569;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Kom</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    <!-- Total -->
    <div style="padding:24px 32px;${data.notes ? 'border-bottom:1px solid #1e293b;' : ''}display:flex;align-items:center;justify-content:space-between;">
      <span style="color:#94a3b8;font-size:14px;">Ukupna vrednost</span>
      <span style="color:#C9A84C;font-size:22px;font-weight:700;letter-spacing:-0.5px;">${formatRSD(data.totalPrice)}</span>
    </div>

    ${data.notes ? `
    <!-- Notes -->
    <div style="padding:16px 32px 24px;">
      <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Napomena</div>
      <div style="color:#94a3b8;font-size:13px;background:#080E1A;padding:12px 14px;border-radius:8px;border:1px solid #1e293b;">${data.notes}</div>
    </div>` : ''}

  </div>

  <div style="text-align:center;margin-top:20px;color:#334155;font-size:11px;">
    Jović Group CRM &nbsp;·&nbsp; Automatska obaveštenja o narudžbinama
  </div>
</div>
</body></html>`;

  await getResend().emails.send({
    from: `Jović Group CRM <${FROM_EMAIL}>`,
    to: [ADMIN_EMAIL],
    subject: `Nova narudžbina — ${data.customerName} · ${formatRSD(data.totalPrice)}`,
    html,
  });
}

export async function sendOrderConfirmationEmail(data: NewOrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY || !data.email) return;

  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#e2e8f0;font-size:13px;">${productLabel(item.type)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px;">${item.material}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px;">${item.width}×${item.height} mm</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#e2e8f0;font-size:13px;text-align:center;">${item.quantity}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="sr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080E1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">

  <div style="background:#0E1625;border:1px solid #1e293b;border-radius:16px;overflow:hidden;">

    <!-- Header -->
    <div style="padding:28px 32px;border-bottom:1px solid #1e293b;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <div style="width:36px;height:36px;background:#C9A84C;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#080E1A;">J</div>
        <div>
          <div style="color:#C9A84C;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Jović Group</div>
          <div style="color:#475569;font-size:11px;margin-top:1px;">PVC &amp; ALU stolarija</div>
        </div>
      </div>
      <h1 style="margin:0 0 8px;color:#ffffff;font-size:20px;font-weight:700;">Vaša narudžbina je primljena!</h1>
      <p style="margin:0;color:#64748b;font-size:13px;">Hvala Vam, <strong style="color:#94a3b8;">${data.customerName}</strong>. Kontaktiraćemo Vas u najkraćem roku.</p>
    </div>

    <!-- Order ref -->
    <div style="padding:16px 32px;border-bottom:1px solid #1e293b;background:#080E1A40;">
      <span style="color:#64748b;font-size:12px;">Broj narudžbine: </span>
      <span style="color:#C9A84C;font-size:12px;font-family:monospace;font-weight:600;">#${data.orderId.slice(0, 8).toUpperCase()}</span>
    </div>

    <!-- Items -->
    <div style="padding:24px 32px;border-bottom:1px solid #1e293b;">
      <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;">Naručeni proizvodi</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#080E1A;">
            <th style="text-align:left;padding:8px 12px;color:#475569;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Tip</th>
            <th style="text-align:left;padding:8px 12px;color:#475569;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Mat.</th>
            <th style="text-align:left;padding:8px 12px;color:#475569;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Dimenzije</th>
            <th style="text-align:center;padding:8px 12px;color:#475569;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Kom</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    <!-- Total -->
    <div style="padding:24px 32px;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between;">
      <span style="color:#94a3b8;font-size:14px;">Ukupna vrednost</span>
      <span style="color:#C9A84C;font-size:22px;font-weight:700;letter-spacing:-0.5px;">${formatRSD(data.totalPrice)}</span>
    </div>

    <!-- Info -->
    <div style="padding:24px 32px;">
      <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;">Detalji dostave</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#64748b;font-size:13px;padding:3px 0;width:130px;">Lokacija</td><td style="color:#f1f5f9;font-size:13px;padding:3px 0;">${data.location}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:3px 0;">Plaćanje</td><td style="color:#f1f5f9;font-size:13px;padding:3px 0;">${data.paymentMethod === 'cash_on_delivery' ? 'Pouzećem' : 'Račun'}</td></tr>
      </table>
      ${data.notes ? `<div style="margin-top:14px;background:#080E1A;padding:12px 14px;border-radius:8px;border:1px solid #1e293b;color:#94a3b8;font-size:13px;">${data.notes}</div>` : ''}
    </div>

  </div>

  <div style="text-align:center;margin-top:20px;color:#334155;font-size:11px;">
    Jović Group &nbsp;·&nbsp; Za sva pitanja kontaktirajte nas
  </div>
</div>
</body></html>`;

  await getResend().emails.send({
    from: `Jović Group <${FROM_EMAIL}>`,
    to: [data.email],
    subject: `Potvrda narudžbine #${data.orderId.slice(0, 8).toUpperCase()} — Jović Group`,
    html,
  });
}
