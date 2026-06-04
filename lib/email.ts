import { Resend } from 'resend';
import { formatRSD } from './pricing';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const LOGO_URL = 'https://jovicgroup.com/LogoWhite.png';
const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

// ─── helpers ─────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function productLabel(type: string): string {
  return ({
    window_single: 'Jednokrilni prozor', window_double: 'Dvokrilni prozor',
    trokrilni_prozor: 'Trokrilni prozor', fiksni_prozor: 'Fiksni prozor',
    door: 'Vrata', balkonska_vrata: 'Balkonska vrata',
    klizna_vrata: 'Klizna vrata', plisirani_komarnik: 'Plisirani komarnik',
  } as Record<string, string>)[type] ?? type;
}

function glassLabel(t?: string): string {
  return ({
    dvoslojno: 'Dvoslojno', dvoslojno_niskoemisiono: 'Dvoslojno niskoemisiono',
    dvoslojno_peskirano: 'Dvoslojno peskirano', niskoemisiono: 'Niskoemisiono',
    '4_godisnja_doba': '4 godišnja doba', peskirano: 'Peskirano',
  } as Record<string, string>)[t ?? ''] ?? '';
}

function colorLabel(t?: string): string {
  return ({ white: 'Bela', anthracite: 'Antracit', wood: 'Drvo imitacija' } as Record<string, string>)[t ?? ''] ?? '';
}

function komarnikLabel(t?: string): string {
  return ({ plisirani: 'Plisirani', rolo: 'Rolo', fiksni: 'Fiksni' } as Record<string, string>)[t ?? ''] ?? '';
}

function paymentLabel(pm: string): string {
  return pm === 'cash_on_delivery' ? 'Pouzećem' : 'Račun';
}

// ─── types ───────────────────────────────────────────────────────────────────

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
    glassType?: string;
    color?: string;
    okovType?: string;
    komarnikType?: string;
    hasRoletna?: boolean;
    hasOkapnica?: boolean;
    hasInstallation?: boolean;
    hasSillInside?: boolean;
  }>;
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

function buildHead() {
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Jović Group</title>
<style>
  body{margin:0;padding:0;background:#EEF2F7;}
  @media(prefers-color-scheme:dark){
    body,.body-bg{background-color:#080E1A!important;}
    .card{background-color:#0E1625!important;border-color:#1e293b!important;box-shadow:none!important;}
    .sec{border-bottom-color:#1e293b!important;}
    .tp{color:#F1F5F9!important;}
    .ts{color:#94A3B8!important;}
    .tm{color:#64748B!important;}
    .tg{color:#C9A84C!important;}
    .ic{background-color:#0B1426!important;border-color:#1a2438!important;}
    .id{background-color:rgba(8,14,26,0.5)!important;border-top-color:#1a2438!important;}
    .bg{background-color:rgba(201,168,76,0.12)!important;border-color:rgba(201,168,76,0.25)!important;color:#C9A84C!important;}
    .ba{background-color:rgba(51,65,85,0.35)!important;border-color:#334155!important;color:#94A3B8!important;}
    .nb{background-color:#080E1A!important;border-color:#1e293b!important;color:#94A3B8!important;}
    .fn{color:#64748B!important;}
    .ft{color:#475569!important;}
    .fd{color:#1e293b!important;}
    .dv{background:#1e293b!important;}
  }
  @media only screen and (max-width:600px){
    .ew{padding:12px 6px!important;}
    .sec{padding:18px 16px!important;}
    .hdr{padding:20px 18px!important;}
    .li{width:22px!important;height:42px!important;}
    .h1{font-size:20px!important;}
    .ta{font-size:22px!important;}
    .ob{display:none!important;}
  }
</style>
</head>`;
}

// ─── building blocks ──────────────────────────────────────────────────────────

function buildHeader(isAdmin: boolean, orderId: string, title: string, subtitle: string) {
  return `<div class="hdr" style="padding:28px 36px;background:#0A1628;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-bottom:18px;">
    <tr>
      <td width="32" valign="middle" style="padding-right:12px;">
        <img class="li" src="${LOGO_URL}" width="26" height="50" alt="Jović Group" style="display:block;border:0;outline:0;text-decoration:none;">
      </td>
      <td valign="middle">
        <div style="color:#C9A84C;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;font-family:${FONT};">${isAdmin ? 'CRM · JOVIĆ GROUP' : 'JOVIĆ GROUP'}</div>
        <div style="color:#4A5568;font-size:11px;margin-top:4px;font-family:${FONT};">${isAdmin ? 'Automatska obaveštenja sistema' : 'PVC &amp; ALU stolarija'}</div>
      </td>
      <td align="right" valign="middle" class="ob">
        <div style="background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.28);border-radius:6px;padding:5px 11px;">
          <span style="color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:1px;font-family:'Courier New',Courier,monospace;">#${orderId.slice(0, 8).toUpperCase()}</span>
        </div>
      </td>
    </tr>
  </table>
  <h1 class="h1" style="margin:0 0 ${subtitle ? '8' : '0'}px;color:#FFFFFF;font-size:22px;font-weight:700;letter-spacing:-0.3px;line-height:1.3;font-family:${FONT};">${title}</h1>
  ${subtitle ? `<p style="margin:0;color:#8899AA;font-size:14px;line-height:1.6;font-family:${FONT};">${subtitle}</p>` : ''}
</div>`;
}

function secLabel(text: string) {
  return `<div class="tm" style="color:#9BA8B7;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;font-family:${FONT};">${text}</div>`;
}

function infoRow(label: string, value: string) {
  return `<tr>
  <td class="ts" style="color:#8899AA;font-size:13px;padding:5px 16px 5px 0;width:120px;vertical-align:top;font-family:${FONT};">${label}</td>
  <td class="tp" style="color:#1A2030;font-size:13px;padding:5px 0;font-weight:500;line-height:1.4;font-family:${FONT};">${value}</td>
</tr>`;
}

function buildItems(items: NewOrderEmailData['items']) {
  const cards = items.map((item, i) => {
    const addons: string[] = [];
    const km = komarnikLabel(item.komarnikType);
    if (km) addons.push(km + ' komarnik');
    if (item.hasRoletna) addons.push('Roletna');
    if (item.hasOkapnica) addons.push('Okapnica');
    if (item.hasSillInside) addons.push('Klupica');
    if (item.hasInstallation) addons.push('Montaža');

    const details: Array<[string, string]> = [];
    const glass = glassLabel(item.glassType);
    const col = colorLabel(item.color);
    if (glass) details.push(['Staklo', glass]);
    if (col) details.push(['Boja', col]);
    if (item.okovType) details.push(['Okov', item.okovType.toUpperCase()]);

    const detailRows = details.map(([k, v]) => `<tr>
  <td class="tm" style="color:#9BA8B7;font-size:11px;padding:2px 14px 2px 0;white-space:nowrap;font-family:${FONT};">${k}</td>
  <td class="ts" style="color:#64748B;font-size:11px;padding:2px 0;font-weight:500;font-family:${FONT};">${v}</td>
</tr>`).join('');

    const addonBadges = addons.map(a =>
      `<span class="ba" style="display:inline-block;background:#F1F5F9;color:#475569;font-size:10px;font-weight:600;padding:3px 9px;border-radius:4px;border:1px solid #DDE3EC;margin:2px 4px 2px 0;white-space:nowrap;font-family:${FONT};">+ ${a}</span>`
    ).join('');

    const hasDetails = details.length > 0 || addons.length > 0;

    return `<div class="ic" style="background:#FAFBFC;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;${i > 0 ? 'margin-top:10px;' : ''}">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
  <tr>
    <td style="padding:14px 16px;vertical-align:middle;">
      <div class="tp" style="color:#1A2030;font-size:14px;font-weight:600;line-height:1.3;font-family:${FONT};">${i + 1}. ${productLabel(item.type)}</div>
      <div class="tm" style="color:#9BA8B7;font-size:11px;margin-top:3px;font-family:'Courier New',Courier,monospace;">${item.width} &times; ${item.height} mm</div>
    </td>
    <td style="padding:14px 12px;vertical-align:middle;text-align:center;" width="72">
      <span class="bg" style="display:inline-block;background:rgba(201,168,76,0.1);color:#8A6A20;font-size:11px;font-weight:700;padding:3px 10px;border-radius:5px;border:1px solid rgba(201,168,76,0.3);white-space:nowrap;font-family:${FONT};">${item.material}</span>
    </td>
    <td style="padding:14px 16px;vertical-align:middle;text-align:center;" width="52">
      <div class="tp" style="color:#1A2030;font-size:20px;font-weight:700;line-height:1;font-family:${FONT};">${item.quantity}</div>
      <div class="tm" style="color:#9BA8B7;font-size:9px;text-transform:uppercase;letter-spacing:1px;margin-top:2px;font-family:${FONT};">kom</div>
    </td>
  </tr>
  ${hasDetails ? `<tr>
    <td colspan="3" class="id" style="padding:10px 16px 12px;border-top:1px solid #EEF2F7;background:#F5F7FA;">
      ${details.length > 0 ? `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;${addons.length > 0 ? 'margin-bottom:8px;' : ''}">${detailRows}</table>` : ''}
      ${addonBadges}
    </td>
  </tr>` : ''}
</table>
</div>`;
  }).join('');

  return `<div class="sec" style="padding:24px 36px;border-bottom:1px solid #E8EDF3;">
${secLabel('Stavke narudžbine')}
${cards}
</div>`;
}

function buildTotal(totalPrice: number, hasBorder: boolean) {
  return `<div class="sec" style="padding:20px 36px;${hasBorder ? 'border-bottom:1px solid #E8EDF3;' : ''}">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
  <tr>
    <td valign="middle" class="ts" style="color:#8899AA;font-size:13px;font-family:${FONT};">Ukupna vrednost narudžbine</td>
    <td valign="middle" align="right">
      <span class="ta tg" style="color:#C9A84C;font-size:26px;font-weight:700;letter-spacing:-0.5px;font-family:${FONT};">${formatRSD(totalPrice)}</span>
    </td>
  </tr>
</table>
</div>`;
}

function buildNotes(notes: string) {
  return `<div class="sec" style="padding:20px 36px;">
${secLabel('Napomena')}
<div class="nb" style="color:#475569;font-size:13px;background:#F5F7FA;padding:14px 16px;border-radius:8px;border:1px solid #E8EDF3;line-height:1.6;font-family:${FONT};">${esc(notes)}</div>
</div>`;
}

function buildFooter() {
  return `<div style="padding:24px 36px;text-align:center;">
<div class="fn" style="color:#64748B;font-size:13px;font-weight:600;font-family:${FONT};">Jović Group</div>
<div class="ft" style="color:#94A3B8;font-size:12px;margin-top:3px;font-family:${FONT};">PVC &amp; ALU stolarija</div>
<div class="dv" style="margin:14px auto;width:36px;height:1px;background:#E2E8F0;"></div>
<a href="mailto:info@jovicgroup.com" style="color:#C9A84C;text-decoration:none;font-size:12px;font-family:${FONT};">info@jovicgroup.com</a>
<div class="fd" style="color:#CBD5E1;font-size:11px;margin-top:10px;font-family:${FONT};">Ovo je automatska poruka — molimo ne odgovarajte direktno na ovaj email</div>
</div>`;
}

function wrapEmail(head: string, headerHtml: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html lang="sr">
${head}
<body class="body-bg" style="margin:0;padding:0;background:#EEF2F7;">
<div class="ew" style="max-width:600px;margin:0 auto;padding:32px 16px;">
  <div class="card" style="background:#FFFFFF;border:1px solid #DDE5EF;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <div style="background:#C9A84C;height:3px;font-size:0;line-height:0;">&nbsp;</div>
    ${headerHtml}
    ${bodyHtml}
  </div>
  ${buildFooter()}
</div>
</body>
</html>`;
}

// ─── public API ───────────────────────────────────────────────────────────────

export async function sendNewOrderEmail(data: NewOrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY || !ADMIN_EMAIL) return;

  const locationLine = [data.location, data.town].filter(Boolean).join(', ');

  const headerHtml = buildHeader(true, data.orderId, 'Nova narudžbina primljena', '');
  const bodyHtml = `
    <div class="sec" style="padding:24px 36px;border-bottom:1px solid #E8EDF3;">
      ${secLabel('Podaci o klijentu')}
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        ${infoRow('Ime i prezime', esc(data.customerName))}
        ${infoRow('Telefon', esc(data.phone))}
        ${data.email ? infoRow('Email', esc(data.email)) : ''}
        ${infoRow('Lokacija', esc(locationLine))}
        ${data.address ? infoRow('Adresa', esc(data.address)) : ''}
        ${infoRow('Plaćanje', paymentLabel(data.paymentMethod))}
      </table>
    </div>
    ${buildItems(data.items)}
    ${buildTotal(data.totalPrice, !!data.notes)}
    ${data.notes ? buildNotes(data.notes) : ''}`;

  const html = wrapEmail(buildHead(), headerHtml, bodyHtml);

  await getResend().emails.send({
    from: `Jović Group CRM <${FROM_EMAIL}>`,
    to: [ADMIN_EMAIL],
    subject: `Nova narudžbina — ${data.customerName} · ${formatRSD(data.totalPrice)}`,
    html,
  });
}

export async function sendContactEmail(email: string, message: string): Promise<void> {
  if (!process.env.RESEND_API_KEY || !ADMIN_EMAIL) return;

  const headerHtml = `<div class="hdr" style="padding:28px 36px;background:#0A1628;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-bottom:18px;">
  <tr>
    <td width="32" valign="middle" style="padding-right:12px;">
      <img src="${LOGO_URL}" width="26" height="50" alt="Jović Group" style="display:block;border:0;outline:0;text-decoration:none;">
    </td>
    <td valign="middle">
      <div style="color:#C9A84C;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;font-family:${FONT};">CRM · JOVIĆ GROUP</div>
      <div style="color:#4A5568;font-size:11px;margin-top:4px;font-family:${FONT};">Automatska obaveštenja sistema</div>
    </td>
  </tr>
</table>
<h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:700;letter-spacing:-0.3px;font-family:${FONT};">Novo pitanje sa sajta</h1>
</div>`;

  const bodyHtml = `
    <div class="sec" style="padding:24px 36px;border-bottom:1px solid #E8EDF3;">
      ${secLabel('Pošiljalac')}
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        ${infoRow('Email', `<a href="mailto:${esc(email)}" style="color:#C9A84C;text-decoration:none;">${esc(email)}</a>`)}
      </table>
    </div>
    <div class="sec" style="padding:24px 36px;">
      ${secLabel('Poruka')}
      <div class="nb" style="color:#475569;font-size:13px;background:#F5F7FA;padding:14px 16px;border-radius:8px;border:1px solid #E8EDF3;line-height:1.6;white-space:pre-wrap;font-family:${FONT};">${esc(message)}</div>
    </div>`;

  const html = wrapEmail(buildHead(), headerHtml, bodyHtml);

  await getResend().emails.send({
    from: `Jović Group CRM <${FROM_EMAIL}>`,
    to: [ADMIN_EMAIL],
    replyTo: email,
    subject: `Novo pitanje sa sajta — ${email}`,
    html,
  });
}

export async function sendOrderConfirmationEmail(data: NewOrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY || !data.email) return;

  const locationLine = [data.location, data.town, data.address].filter(Boolean).join(', ');

  const headerHtml = buildHeader(
    false,
    data.orderId,
    'Vaša narudžbina je primljena!',
    `Hvala Vam, ${esc(data.customerName)}. Kontaktiraćemo Vas u najkraćem roku.`,
  );
  const bodyHtml = `
    ${buildItems(data.items)}
    ${buildTotal(data.totalPrice, true)}
    <div class="sec" style="padding:24px 36px;${data.notes ? 'border-bottom:1px solid #E8EDF3;' : ''}">
      ${secLabel('Podaci o dostavi')}
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        ${infoRow('Lokacija', esc(locationLine))}
        ${infoRow('Plaćanje', paymentLabel(data.paymentMethod))}
      </table>
    </div>
    ${data.notes ? buildNotes(data.notes) : ''}`;

  const html = wrapEmail(buildHead(), headerHtml, bodyHtml);

  await getResend().emails.send({
    from: `Jović Group <${FROM_EMAIL}>`,
    to: [data.email],
    subject: `Potvrda narudžbine #${data.orderId.slice(0, 8).toUpperCase()} — Jović Group`,
    html,
  });
}
