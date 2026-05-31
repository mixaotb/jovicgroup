import { Resend } from 'resend';
import { formatRSD } from './pricing';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// logo-light SVG (gold crown + white J) as base64 data URI — avoids external request
const LOGO_B64 = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjU1MiA4OSAzMTAgNTkxIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGZpbGw9IiNlNWMwNjciIGQ9Im03MDUuMSAxNzYuNzhsLTE3LjYxLTEyLjUyIDM1LjY4LTQyLjE3LTQuNDYtMTQuNjggMTUuNDctMTYuNCAxNC4wNiAxNi4zOS0zLjg2IDE0LjYxIDM1Ljc5IDQyLjI1LTE4LjA3IDEyLjUyLTI3LjcyLTMzLjgzeiIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZmlsbD0iI2U1YzA2NyIgZD0ibTYzMS42MiAxMzkuMTZsMTAyLjc3IDYzLjM0IDEwMC45LTY0LjAyIDAuOS0xMi44NCAyMi42OS0xMi43Mi0zMS45NyAxMzIuMjRoLTQxLjg0bC0xMS44My0yMS42NyAzNC41OS0yLjk4IDEzLjc5LTQ1LjQtODcuMTUgNTkuNzYtODkuMzQtNTguOTUgMTIuMTYgNDcuMDMgMzcuNTcgMC4yNy0xMS44OSAyMi4xNi00Mi43LTAuMjctMzEuODktMTMxLjYyIDIzLjI0IDExLjA4eiIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZmlsbD0iI2ZmZmZmZiIgZD0ibTU1Ni4xMiA1OTguMDRsOTEuNjItODEuNTgtMC41IDYxLjQxYzczLjYxIDQ2LjM4IDkxLjI3IDguMjggOTAuNSAxMC41LTIuMzggNi44MS01Ljc2IDkuODgtOC4yOSAxMS45My0xMy41NSAxMC45Ni0zNS4xNyA4LjkzLTM0LjIgOS4yMSAxNC4yMSA0LjEyIDIzLjIyIDQuMDQgMzUuNDYtNC42OSAxMS4wNy03LjkxIDE2LjAyLTI0LjI3IDE3LjkzLTQ4Ljk3bDEuMzItMjI2Ljc3aC0xMDguNzZsLTAuMzEtNjkuOThoMTg1Ljk5bC0wLjI1IDMwMi4wOGMwIDAuMDEtMC41OCAzMi45LTExLjUyIDU1LjQ0LTkuMTUgMTguODYtMjYuNjIgMzYuNTQtNDAuNDIgNDQuNDQtMTAgNS43My0zMC44MyAxMi44OC01Ny4xNCAxNS40Ni0yNS4wNCAyLjQ1LTUyLjQyLTMuMTMtNjYuOTUtOC44My0zMS43OC0xMi40Ny02Ny44OC0zNS44Ny05NC40OC02OS42NXoiLz48L3N2Zz4=';

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

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

// ─── shared building blocks ────────────────────────────────────────────────

function buildHead() {
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>Jović Group</title>
<style>
  body{margin:0;padding:0;background:#080E1A;}
  @media only screen and (max-width:600px){
    .ew{padding:16px 8px!important;}
    .es{padding:20px 18px!important;}
    .eh{padding:24px 18px!important;}
    .ef{padding:18px 18px!important;}
    .h1{font-size:19px!important;}
    .ta{font-size:20px!important;}
    .it td,.it th{padding:10px 8px!important;font-size:11px!important;}
    .logo-img{width:24px!important;height:46px!important;}
    .info-label{width:100px!important;}
  }
</style>
</head>`;
}

function buildLogoHeader(isAdmin: boolean, orderId: string, title: string, subtitle: string) {
  return `<div class="eh" style="padding:28px 36px;border-bottom:1px solid #1e293b;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
    <tr>
      <td width="34" valign="middle" style="padding-right:14px;">
        <img class="logo-img" src="data:image/svg+xml;base64,${LOGO_B64}" width="30" height="57" alt="Jović Group" style="display:block;border:0;outline:0;text-decoration:none;">
      </td>
      <td valign="middle">
        <div style="color:#C9A84C;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;line-height:1.2;font-family:${FONT};">${isAdmin ? 'Jović Group CRM' : 'Jović Group'}</div>
        <div style="color:#475569;font-size:11px;margin-top:3px;font-family:${FONT};">${isAdmin ? 'Automatska obaveštenja' : 'PVC &amp; ALU stolarija'}</div>
      </td>
    </tr>
  </table>
  <h1 class="h1" style="margin:20px 0 6px;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;line-height:1.3;font-family:${FONT};">${title}</h1>
  <p style="margin:0;color:#475569;font-size:12px;font-family:'Courier New',Courier,monospace;">Narudžbina <span style="color:#C9A84C;font-weight:600;">#${orderId}</span></p>
  ${subtitle ? `<p style="margin:8px 0 0;color:#64748b;font-size:13px;line-height:1.5;font-family:${FONT};">${subtitle}</p>` : ''}
</div>`;
}

function buildInfoRow(label: string, value: string) {
  return `<tr>
    <td class="info-label" style="color:#64748b;font-size:13px;padding:5px 0;width:130px;vertical-align:top;font-family:${FONT};">${label}</td>
    <td style="color:#f1f5f9;font-size:13px;padding:5px 0;font-weight:500;font-family:${FONT};">${value}</td>
  </tr>`;
}

function buildItems(items: NewOrderEmailData['items']) {
  const rows = items.map((item, i) => `
  <tr style="background:${i % 2 === 0 ? 'rgba(8,14,26,0.5)' : 'transparent'};">
    <td style="padding:12px 16px;border-bottom:1px solid #1a2438;vertical-align:middle;">
      <div style="color:#f1f5f9;font-size:13px;font-weight:600;line-height:1.3;font-family:${FONT};">${productLabel(item.type)}</div>
      <div style="color:#475569;font-size:11px;margin-top:3px;font-family:'Courier New',Courier,monospace;">${item.width}&nbsp;&times;&nbsp;${item.height}&nbsp;mm</div>
    </td>
    <td style="padding:12px 16px;border-bottom:1px solid #1a2438;vertical-align:middle;">
      <span style="display:inline-block;background:rgba(201,168,76,0.12);color:#C9A84C;font-size:11px;font-weight:700;padding:3px 10px;border-radius:4px;border:1px solid rgba(201,168,76,0.25);white-space:nowrap;font-family:${FONT};">${item.material}</span>
    </td>
    <td style="padding:12px 16px;border-bottom:1px solid #1a2438;vertical-align:middle;text-align:center;white-space:nowrap;">
      <div style="color:#ffffff;font-size:18px;font-weight:700;line-height:1;font-family:${FONT};">${item.quantity}</div>
      <div style="color:#475569;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:2px;font-family:${FONT};">kom</div>
    </td>
  </tr>`).join('');

  return `<div class="es" style="padding:24px 32px;border-bottom:1px solid #1e293b;">
  <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;font-family:${FONT};">Stavke narudžbine</div>
  <table class="it" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid #1a2438;border-radius:8px;overflow:hidden;">
    <thead>
      <tr style="background:#080E1A;">
        <th style="text-align:left;padding:10px 16px;color:#475569;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;font-family:${FONT};">Proizvod</th>
        <th style="text-align:left;padding:10px 16px;color:#475569;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;font-family:${FONT};">Materijal</th>
        <th style="text-align:center;padding:10px 16px;color:#475569;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;font-family:${FONT};">Kol.</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}

function buildTotal(totalPrice: number, borderBottom = true) {
  return `<div class="es" style="padding:20px 32px;${borderBottom ? 'border-bottom:1px solid #1e293b;' : ''}">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
    <tr>
      <td valign="middle" style="color:#94a3b8;font-size:13px;font-family:${FONT};">Ukupna vrednost narudžbine</td>
      <td valign="middle" align="right">
        <span class="ta" style="color:#C9A84C;font-size:24px;font-weight:700;letter-spacing:-0.5px;font-family:${FONT};">${formatRSD(totalPrice)}</span>
      </td>
    </tr>
  </table>
</div>`;
}

function buildNotes(notes: string) {
  return `<div class="es" style="padding:20px 32px;">
  <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;font-family:${FONT};">Napomena</div>
  <div style="color:#94a3b8;font-size:13px;background:#080E1A;padding:14px 16px;border-radius:8px;border:1px solid #1e293b;line-height:1.6;font-family:${FONT};">${notes}</div>
</div>`;
}

function buildFooter() {
  return `<div class="ef" style="padding:24px 32px;text-align:center;margin-top:2px;">
  <div style="color:#334155;font-size:12px;line-height:2;font-family:${FONT};">
    <span style="color:#475569;font-weight:600;font-size:13px;">Jović Group</span>&nbsp;&nbsp;·&nbsp;&nbsp;<span style="color:#334155;">PVC &amp; ALU stolarija</span>
    <br>
    <a href="mailto:info@jovicgroup.com" style="color:#C9A84C;text-decoration:none;font-size:12px;">info@jovicgroup.com</a>
  </div>
  <div style="color:#1e293b;font-size:11px;margin-top:10px;font-family:${FONT};">Ovo je automatska poruka — molimo ne odgovarajte direktno na ovaj email</div>
</div>`;
}

function wrapEmail(head: string, cardContent: string) {
  return `<!DOCTYPE html>
<html lang="sr">
${head}
<body style="margin:0;padding:0;background:#080E1A;">
<div class="ew" style="max-width:600px;margin:0 auto;padding:32px 16px;">
  <div style="background:#0E1625;border:1px solid #1e293b;border-radius:16px;overflow:hidden;">
    <div style="background:#C9A84C;height:3px;font-size:0;line-height:0;">&nbsp;</div>
    ${cardContent}
  </div>
  ${buildFooter()}
</div>
</body>
</html>`;
}

// ─── public API ────────────────────────────────────────────────────────────

export async function sendNewOrderEmail(data: NewOrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY || !ADMIN_EMAIL) return;

  const locationLine = [data.location, data.town, data.address].filter(Boolean).join(' · ');

  const cardContent = `
    ${buildLogoHeader(true, data.orderId.slice(0, 8).toUpperCase(), 'Nova narudžbina primljena', '')}
    <div class="es" style="padding:24px 32px;border-bottom:1px solid #1e293b;">
      <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;font-family:${FONT};">Podaci o klijentu</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        ${buildInfoRow('Ime i prezime', data.customerName)}
        ${buildInfoRow('Telefon', data.phone)}
        ${data.email ? buildInfoRow('Email', data.email) : ''}
        ${buildInfoRow('Lokacija', locationLine)}
        ${buildInfoRow('Plaćanje', data.paymentMethod === 'cash_on_delivery' ? 'Pouzećem' : 'Račun')}
      </table>
    </div>
    ${buildItems(data.items)}
    ${buildTotal(data.totalPrice, !!data.notes)}
    ${data.notes ? buildNotes(data.notes) : ''}`;

  const html = wrapEmail(buildHead(), cardContent);

  await getResend().emails.send({
    from: `Jović Group CRM <${FROM_EMAIL}>`,
    to: [ADMIN_EMAIL],
    subject: `Nova narudžbina — ${data.customerName} · ${formatRSD(data.totalPrice)}`,
    html,
  });
}

export async function sendOrderConfirmationEmail(data: NewOrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY || !data.email) return;

  const locationLine = [data.location, data.town, data.address].filter(Boolean).join(' · ');

  const cardContent = `
    ${buildLogoHeader(
      false,
      data.orderId.slice(0, 8).toUpperCase(),
      'Vaša narudžbina je primljena!',
      `Hvala Vam, <strong style="color:#94a3b8;">${data.customerName}</strong>. Kontaktiraćemo Vas u najkraćem roku.`,
    )}
    ${buildItems(data.items)}
    ${buildTotal(data.totalPrice, true)}
    <div class="es" style="padding:24px 32px;${data.notes ? 'border-bottom:1px solid #1e293b;' : ''}">
      <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;font-family:${FONT};">Detalji dostave</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        ${buildInfoRow('Lokacija', locationLine || data.location)}
        ${buildInfoRow('Plaćanje', data.paymentMethod === 'cash_on_delivery' ? 'Pouzećem' : 'Račun')}
      </table>
    </div>
    ${data.notes ? buildNotes(data.notes) : ''}`;

  const html = wrapEmail(buildHead(), cardContent);

  await getResend().emails.send({
    from: `Jović Group <${FROM_EMAIL}>`,
    to: [data.email],
    subject: `Potvrda narudžbine #${data.orderId.slice(0, 8).toUpperCase()} — Jović Group`,
    html,
  });
}
