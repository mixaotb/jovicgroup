'use client';

// app/crm/dashboard/page.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package, CheckSquare, Users, CurrencyDollar, SignOut, ArrowSquareOut,
  Sun, Moon, MagnifyingGlass, ArrowClockwise, PencilSimple, Trash, X,
  Check, Plus, CaretDown, CaretUp, MapPin, Phone, EnvelopeSimple, CalendarBlank,
  CreditCard, Tag, ArrowLeft, WarningCircle, Spinner, Copy, DownloadSimple, Printer,
  Receipt, Gear, ClockCountdown,
} from '@phosphor-icons/react';
import { formatRSD } from '@/lib/pricing';
import NotificationBell from '@/components/NotificationBell';
import type { Order, Task, OrderStatus, TaskStatus, User, UserRole, FinanceData, ProductType } from '@/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; badge: string; dot: string }> = {
  na_cekanju:    { label: 'Na čekanju',   badge: 'bg-amber-500/15 text-amber-500 border border-amber-500/25',    dot: 'bg-amber-500' },
  u_proizvodnji: { label: 'U proizvodnji', badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',     dot: 'bg-blue-400' },
  isporuceno:    { label: 'Isporučeno',   badge: 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25', dot: 'bg-emerald-500' },
  otkazano:      { label: 'Otkazano',     badge: 'bg-red-500/15 text-red-500 border border-red-500/25',          dot: 'bg-red-500' },
};

const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; cls: string }> = {
  todo:        { label: 'Čeka',     cls: 'bg-[var(--bg-raised)] text-[var(--text-muted)]' },
  in_progress: { label: 'U toku',   cls: 'bg-blue-500/15 text-blue-400' },
  done:        { label: 'Završeno', cls: 'bg-emerald-500/15 text-emerald-500' },
};

const ORDER_STATUSES: OrderStatus[] = ['na_cekanju', 'u_proizvodnji', 'isporuceno', 'otkazano'];

function getProductLabel(type: string): string {
  const map: Record<string, string> = {
    window_single: 'Jednokrilni prozor', window_double: 'Dvokrilni prozor',
    trokrilni_prozor: 'Trokrilni prozor', fiksni_prozor: 'Fiksni prozor',
    door: 'Vrata', balkonska_vrata: 'Balkonska vrata',
    klizna_vrata: 'Klizna vrata', plisirani_komarnik: 'Plisirani komarnik',
  };
  return map[type] ?? type;
}

const ROLE_RANKS: Record<UserRole, number> = { worker: 1, manager: 2, admin: 3 };
function canAccess(role: UserRole | null, min: UserRole): boolean {
  return role ? ROLE_RANKS[role] >= ROLE_RANKS[min] : false;
}

function ls(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key) ?? fallback;
}

// ─── Shared CSS helpers ───────────────────────────────────────────────────────

const INPUT ='w-full px-3 py-2 rounded-xl bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors placeholder:text-[var(--text-muted)]';
const LABEL = 'text-[var(--text-muted)] text-xs font-medium block mb-1.5';

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = ORDER_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────────

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="py-20 flex flex-col items-center gap-3 text-[var(--text-muted)] text-sm">
      <Spinner size={24} className="animate-spin text-[#C9A84C]/60" />
      {label}
    </div>
  );
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); void navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="w-6 h-6 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors flex-shrink-0"
      title="Kopiraj"
    >
      {copied ? <Check size={12} weight="bold" className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

function ConfirmModal({ title, message, confirmLabel = 'Obriši', onConfirm, onCancel, variant = 'danger' }: {
  title: string; message?: string; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void;
  variant?: 'danger' | 'warning';
}) {
  const isWarning = variant === 'warning';
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl">
        <div className="px-6 pt-6 pb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${isWarning ? 'bg-amber-500/15 border border-amber-500/20' : 'bg-red-500/15 border border-red-500/20'}`}>
            {isWarning ? <SignOut size={18} className="text-amber-500" /> : <Trash size={18} className="text-red-500" />}
          </div>
          <h2 className="text-base font-bold text-[var(--text)] mb-1.5">{title}</h2>
          {message && <p className="text-sm text-[var(--text-muted)] leading-relaxed">{message}</p>}
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] font-medium text-sm hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-colors"
          >
            Ostani
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm active:scale-[0.97] transition-all text-white ${isWarning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ErrorToast ───────────────────────────────────────────────────────────────

function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--bg-surface)] border border-red-500/30 text-red-500 text-sm backdrop-blur-xl shadow-xl max-w-[calc(100vw-2rem)] sm:max-w-sm w-full"
    >
      <WarningCircle size={16} className="flex-shrink-0" />
      <span className="flex-1 leading-snug">{message}</span>
      <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"><X size={14} /></button>
    </motion.div>
  );
}

// ─── SuccessToast ─────────────────────────────────────────────────────────────

function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--bg-surface)] border border-emerald-500/30 text-emerald-500 text-sm backdrop-blur-xl shadow-xl max-w-[calc(100vw-2rem)] sm:max-w-sm w-full"
    >
      <Check size={16} className="flex-shrink-0" weight="bold" />
      <span className="flex-1 leading-snug">{message}</span>
      <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"><X size={14} /></button>
    </motion.div>
  );
}

// ─── StatsSummary ─────────────────────────────────────────────────────────────

function StatsSummary({ orders, tasks, userRole }: { orders: Order[]; tasks: Task[]; userRole: UserRole | null }) {
  const revenue = orders.filter(o => o.status === 'isporuceno').reduce((s, o) => s + (o.total_price || 0), 0);
  const active = orders.filter(o => o.status === 'na_cekanju' || o.status === 'u_proizvodnji').length;
  const pending = tasks.filter(t => t.status !== 'done').length;
  const thisMonth = orders.filter(o => {
    const d = new Date(o.created_at), now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const items = [
    ...(canAccess(userRole, 'admin') ? [{ label: 'Prihod (isporučeno)', value: formatRSD(revenue), gold: true }] : []),
    { label: 'Aktivne narudžbine', value: String(active), gold: false },
    { label: 'Zadaci na čekanju', value: String(pending), gold: false },
    { label: 'Ovaj mesec', value: String(thisMonth), gold: false },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--border)] rounded-2xl overflow-hidden border border-[var(--border)] mb-6">
      {items.map((s, i) => (
        <div key={i} className="bg-[var(--bg-surface)]/80 backdrop-blur-sm px-4 py-3.5">
          <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5 leading-none">{s.label}</div>
          <div className={`text-xl font-bold leading-none font-mono ${s.gold ? 'text-[#C9A84C]' : 'text-[var(--text)]'}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── OrderItemsCell ───────────────────────────────────────────────────────────

function OrderItemsCell({ items }: { items: Order['items'] }) {
  const [open, setOpen] = useState(false);
  if (!items || items.length === 0) return <span className="text-[var(--text-muted)] text-xs">—</span>;
  const total = items.reduce((s, i) => s + i.quantity, 0);
  if (items.length === 1) {
    const it = items[0];
    return (
      <div className="text-xs">
        <div className="text-[var(--text)] leading-tight">{getProductLabel(it.type)}</div>
        <div className="text-[var(--text-muted)] mt-0.5">{it.material} · {it.width}×{it.height}mm{it.quantity > 1 ? ` · ${it.quantity} kom` : ''}</div>
      </div>
    );
  }
  return (
    <div className="text-xs">
      <button onClick={e => { e.stopPropagation(); setOpen(!open); }} className="text-[var(--text)] hover:text-[#C9A84C] transition-colors flex items-center gap-1">
        <span className="font-medium">{items.length} stavki</span>
        <span className="text-[var(--text-muted)]">· {total} kom</span>
        <CaretDown size={11} className={`text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-[var(--border)]">
          {items.map((it, idx) => (
            <div key={it.id || idx}>
              <div className="text-[var(--text-muted)]">{getProductLabel(it.type)}</div>
              <div className="text-[var(--text-muted)]/70">{it.material} · {it.width}×{it.height}mm · {it.quantity} kom</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── printOrder ───────────────────────────────────────────────────────────────

function printOrder(order: Order) {
  const rows = (order.items ?? []).map(it =>
    `<tr><td>${getProductLabel(it.type)}</td><td>${it.material}</td><td>${it.width}×${it.height} mm</td><td>${it.quantity} kom</td></tr>`
  ).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Narudžbina — ${order.customer_name}</title>
<style>
body{font-family:Arial,sans-serif;padding:32px;color:#111;font-size:14px}
h1{font-size:20px;margin:0 0 4px}
.sub{color:#666;font-size:12px;margin-bottom:24px}
section{margin-bottom:20px}
h2{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin:0 0 8px;border-bottom:1px solid #eee;padding-bottom:4px}
.row{display:flex;gap:8px;margin-bottom:4px}
.lbl{color:#666;min-width:100px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:6px 8px;border-bottom:2px solid #ddd;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888}
td{padding:6px 8px;border-bottom:1px solid #eee}
.total{font-size:18px;font-weight:bold;color:#B8860B;margin-top:16px}
</style></head><body>
<h1>${order.customer_name}</h1>
<div class="sub">${new Date(order.created_at).toLocaleDateString('sr-RS',{day:'2-digit',month:'long',year:'numeric'})} · ${ORDER_STATUS_CONFIG[order.status].label}</div>
<section><h2>Kontakt</h2>
<div class="row"><span class="lbl">Telefon:</span><span>${order.phone}</span></div>
${order.email ? `<div class="row"><span class="lbl">Email:</span><span>${order.email}</span></div>` : ''}
${order.town ? `<div class="row"><span class="lbl">Grad:</span><span>${order.town}${order.address ? ', ' + order.address : ''}</span></div>` : ''}
</section>
<section><h2>Proizvodi</h2>
<table><tr><th>Tip</th><th>Mat.</th><th>Dim.</th><th>Kol.</th></tr>${rows}</table>
</section>
<section><h2>Detalji</h2>
<div class="row"><span class="lbl">Plaćanje:</span><span>${order.payment_method === 'cash_on_delivery' ? 'Pouzećem' : 'Račun'}</span></div>
${order.notes ? `<div class="row"><span class="lbl">Napomena:</span><span>${order.notes}</span></div>` : ''}
</section>
<div class="total">${order.total_price.toLocaleString('sr-RS')} RSD</div>
</body></html>`;
  const win = window.open('', '_blank', 'width=640,height=800');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

// ─── OrderDetailDrawer ────────────────────────────────────────────────────────

function OrderDetailDrawer({
  order, userRole, orders, tasks, onClose, onEdit, onDelete, onDuplicate,
}: {
  order: Order; userRole: UserRole | null; orders: Order[]; tasks: Task[];
  onClose: () => void; onEdit: (o: Order) => void; onDelete: (id: string) => Promise<void>;
  onDuplicate: (o: Order) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const ageDays = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 86400000);

  const linkedTasks = tasks.filter(t => t.order_id === order.id);
  const customerHistory = orders
    .filter(o => o.phone.replace(/\D/g, '') === order.phone.replace(/\D/g, '') && o.id !== order.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  function handleDelete() { setConfirmOpen(true); }

  async function performDelete() {
    setConfirmOpen(false);
    setDeleting(true);
    await onDelete(order.id);
    setDeleting(false);
  }

  return (
    <>
      {confirmOpen && (
        <ConfirmModal
          title="Obriši narudžbinu"
          message={`Da li ste sigurni da želite da obrišete narudžbinu klijenta „${order.customer_name}"?`}
          onConfirm={performDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 bg-[var(--bg-surface)] border-l border-[var(--border)] shadow-[-24px_0_64px_rgba(0,0,0,0.18)] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] min-w-0 flex-shrink-0">
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)] transition-colors flex-shrink-0">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-[var(--text)] text-sm leading-tight truncate">{order.customer_name}</h2>
            <div className="text-[var(--text-muted)] text-xs flex items-center gap-1.5">
              {new Date(order.created_at).toLocaleDateString('sr-RS', { day: '2-digit', month: 'long', year: 'numeric' })}
              {ageDays > 0 && <span className="px-1.5 py-0.5 rounded-full bg-[var(--bg-raised)] border border-[var(--border)] text-[9px] font-semibold">{ageDays}d</span>}
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Contact */}
          <section className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Kontakt</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <Phone size={13} className="text-[var(--text-muted)] flex-shrink-0" />
                <a href={`tel:${order.phone}`} className="text-sm text-[var(--text)] hover:text-[#C9A84C] transition-colors flex-1">{order.phone}</a>
                <CopyButton value={order.phone} />
              </div>
              {order.email && (
                <div className="flex items-center gap-2.5">
                  <EnvelopeSimple size={13} className="text-[var(--text-muted)] flex-shrink-0" />
                  <a href={`mailto:${order.email}`} className="text-sm text-[var(--text)] hover:text-[#C9A84C] transition-colors truncate flex-1">{order.email}</a>
                  <CopyButton value={order.email} />
                </div>
              )}
              {(order.town || order.address) && (
                <div className="flex items-start gap-2.5">
                  <MapPin size={13} className="text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[var(--text)]">{[order.town, order.address].filter(Boolean).join(', ')}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <Tag size={13} className="text-[var(--text-muted)] flex-shrink-0" />
                <span className="text-sm text-[var(--text)]">{order.location}</span>
              </div>
            </div>
          </section>

          {/* Order value — admin only */}
          {canAccess(userRole, 'admin') && (
            <section className="px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Narudžbina</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]"><CreditCard size={13} />Plaćanje</div>
                  <span className="text-[var(--text)]">{order.payment_method === 'cash_on_delivery' ? 'Pouzećem' : 'Račun'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]"><CreditCard size={13} />Ukupno</div>
                  <span className="font-semibold font-mono text-[#C9A84C]">{formatRSD(order.total_price)}</span>
                </div>
              </div>
            </section>
          )}

          {/* Products */}
          {order.items && order.items.length > 0 && (
            <section className="px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                Proizvodi ({order.items.length})
              </h3>
              <div className="space-y-2.5">
                {order.items.map((item, idx) => (
                  <div key={item.id || idx} className="rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] p-3">
                    <div className="font-medium text-[var(--text)] text-sm mb-2">{getProductLabel(item.type)}</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Materijal', value: item.material },
                        { label: 'Dimenzije', value: `${item.width}×${item.height}mm` },
                        { label: 'Količina', value: `${item.quantity} kom` },
                      ].map(f => (
                        <div key={f.label}>
                          <div className="text-[9px] uppercase tracking-wide text-[var(--text-muted)] mb-0.5">{f.label}</div>
                          <div className="text-xs font-medium text-[var(--text)]">{f.value}</div>
                        </div>
                      ))}
                    </div>
                    {item.dimensions_data && (
                      <div className="mt-2 pt-2 border-t border-[var(--border)] flex flex-wrap gap-x-4 gap-y-1">
                        {item.dimensions_data.glassType && (
                          <span className="text-[10px] text-[var(--text-muted)]">Staklo: <span className="text-[var(--text)]">{item.dimensions_data.glassType}</span></span>
                        )}
                        {item.dimensions_data.color && (
                          <span className="text-[10px] text-[var(--text-muted)]">Boja: <span className="text-[var(--text)]">{item.dimensions_data.color === 'white' ? 'Bela' : item.dimensions_data.color === 'anthracite' ? 'Antracit' : 'Drvo'}</span></span>
                        )}
                        {item.dimensions_data.okovType && (
                          <span className="text-[10px] text-[var(--text-muted)]">Okov: <span className="text-[var(--text)]">{item.dimensions_data.okovType.toUpperCase()}</span></span>
                        )}
                        {item.dimensions_data.hasRoletna && <span className="text-[10px] text-[var(--text-muted)]">Roletna: <span className="text-[var(--text)]">Da</span></span>}
                        {item.dimensions_data.hasInstallation && <span className="text-[10px] text-[var(--text-muted)]">Ugradnja: <span className="text-[var(--text)]">Da</span></span>}
                        {item.dimensions_data.komarnikType && item.dimensions_data.komarnikType !== 'none' && (
                          <span className="text-[10px] text-[var(--text-muted)]">Komarnik: <span className="text-[var(--text)]">{item.dimensions_data.komarnikType}</span></span>
                        )}
                      </div>
                    )}
                    {item.dimensions_data?.notes && (
                      <div className="mt-2 pt-2 border-t border-[var(--border)]">
                        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{item.dimensions_data.notes}</p>
                      </div>
                    )}
                    {item.dimensions_data?.image_url && (
                      <div className="mt-2 pt-2 border-t border-[var(--border)]">
                        <a href={item.dimensions_data.image_url} target="_blank" rel="noopener noreferrer">
                          <Image
                            src={item.dimensions_data.image_url}
                            alt="Priložena fotografija"
                            width={600}
                            height={400}
                            className="w-full max-h-48 object-cover rounded-lg cursor-zoom-in"
                            unoptimized
                          />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {order.notes && (
            <section className="px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Napomena</h3>
              <p className="text-sm text-[var(--text)] leading-relaxed">{order.notes}</p>
            </section>
          )}

          {/* Linked tasks */}
          {linkedTasks.length > 0 && (
            <section className="px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Zadaci ({linkedTasks.length})</h3>
              <div className="space-y-2">
                {linkedTasks.map(task => {
                  const cfg = TASK_STATUS_CONFIG[task.status];
                  const urg = taskUrgency(task);
                  return (
                    <div key={task.id} className={`flex items-start justify-between gap-3 p-2.5 rounded-xl border bg-[var(--bg-raised)] ${urg === 'overdue' ? 'border-red-500/40' : urg === 'soon' ? 'border-amber-500/30' : 'border-[var(--border)]'}`}>
                      <div className="min-w-0">
                        <div className="text-sm text-[var(--text)] leading-tight">{task.title}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-muted)]">
                          {task.users && <span>{task.users.full_name || task.users.email?.split('@')[0]}</span>}
                          {task.due_date && <span className={urg === 'overdue' ? 'text-red-500 font-semibold' : urg === 'soon' ? 'text-amber-500 font-semibold' : ''}>· {new Date(task.due_date).toLocaleDateString('sr-RS')}</span>}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${cfg.cls}`}>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Customer history */}
          {customerHistory.length > 0 && (
            <section className="px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Istorija klijenta</h3>
              <div className="space-y-2">
                {customerHistory.map(o => (
                  <div key={o.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="text-[var(--text-muted)]">{new Date(o.created_at).toLocaleDateString('sr-RS', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      {o.items && o.items.length > 0 && (
                        <div className="text-[var(--text)] mt-0.5 truncate">
                          {getProductLabel(o.items[0].type)}{o.items.length > 1 ? ` +${o.items.length - 1}` : ''}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {canAccess(userRole, 'admin') && <span className="font-mono font-semibold text-[#C9A84C]">{formatRSD(o.total_price)}</span>}
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Timestamps */}
          <section className="px-5 py-4">
            <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-1.5"><CalendarBlank size={11} />Kreirano: {new Date(order.created_at).toLocaleDateString('sr-RS')}</div>
              {order.updated_at && order.updated_at !== order.created_at && (
                <div className="flex items-center gap-1.5"><CalendarBlank size={11} />Izmenjeno: {new Date(order.updated_at).toLocaleDateString('sr-RS')}</div>
              )}
            </div>
          </section>
        </div>

        {/* Footer actions */}
        <div className="border-t border-[var(--border)] px-5 py-4 flex gap-2 flex-shrink-0 bg-[var(--bg-surface)]">
          <button
            onClick={() => onEdit(order)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#C9A84C] text-slate-950 font-semibold text-sm hover:bg-[#E8C97A] transition-colors"
          >
            <PencilSimple size={15} weight="bold" />
            Uredi
          </button>
          <button
            onClick={() => { onClose(); onDuplicate(order); }}
            className="w-11 h-11 flex items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[#C9A84C] hover:border-[#C9A84C]/40 hover:bg-[#C9A84C]/10 transition-colors"
            title="Dupliraj narudžbinu"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={() => printOrder(order)}
            className="w-11 h-11 flex items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)] transition-colors"
            title="Štampaj narudžbinu"
          >
            <Printer size={16} />
          </button>
          {canAccess(userRole, 'manager') && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-11 h-11 flex items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/40 hover:bg-red-500/10 transition-colors disabled:opacity-40"
              title="Obriši narudžbinu"
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── EditOrderModal ───────────────────────────────────────────────────────────

function EditOrderModal({
  order, userRole, onClose, onSave,
}: {
  order: Order; userRole: UserRole | null;
  onClose: () => void; onSave: (id: string, updates: Partial<Order>) => Promise<void>;
}) {
  const [name, setName] = useState(order.customer_name);
  const [phone, setPhone] = useState(order.phone);
  const [email, setEmail] = useState(order.email || '');
  const [town, setTown] = useState(order.town || '');
  const [address, setAddress] = useState(order.address || '');
  const [price, setPrice] = useState(String(order.total_price));
  const [paymentMethod, setPaymentMethod] = useState(order.payment_method);
  const [status, setStatus] = useState(order.status);
  const [notes, setNotes] = useState(order.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Ime klijenta je obavezno'); return; }
    if (!phone.trim()) { setError('Telefon je obavezan'); return; }
    setSaving(true); setError('');
    await onSave(order.id, {
      customer_name: name.trim(), phone: phone.trim(),
      email: email.trim() || undefined, town: town.trim() || undefined,
      address: address.trim() || undefined, total_price: Number(price) || 0,
      payment_method: paymentMethod, status, notes: notes.trim() || undefined,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-bold text-[var(--text)]">Uredi narudžbinu</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)] transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL}>Ime klijenta *</label><input type="text" value={name} onChange={e => setName(e.target.value)} className={INPUT} /></div>
            <div><label className={LABEL}>Telefon *</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={INPUT} /></div>
          </div>
          <div><label className={LABEL}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={INPUT} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL}>Grad / Opština</label><input type="text" value={town} onChange={e => setTown(e.target.value)} placeholder="npr. Beograd" className={INPUT} /></div>
            <div><label className={LABEL}>Adresa</label><input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ulica i broj" className={INPUT} /></div>
          </div>
          {canAccess(userRole, 'admin') && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LABEL}>Cena (RSD)</label><input type="number" min="0" step="1" value={price} onChange={e => setPrice(e.target.value)} className={`${INPUT} [appearance:textfield]`} /></div>
              <div>
                <label className={LABEL}>Način plaćanja</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as Order['payment_method'])} className={INPUT}>
                  <option value="cash_on_delivery">Pouzećem</option>
                  <option value="racun">Račun</option>
                </select>
              </div>
            </div>
          )}
          <div>
            <label className={LABEL}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as OrderStatus)} className={INPUT}>
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{ORDER_STATUS_CONFIG[s].label}</option>)}
            </select>
          </div>
          <div><label className={LABEL}>Napomena</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Dodatne napomene..." className={`${INPUT} resize-none`} /></div>
          {error && (
            <div className="flex items-center gap-1.5 text-red-500 text-xs"><WarningCircle size={13} />{error}</div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#C9A84C] text-slate-950 font-bold text-sm hover:bg-[#E8C97A] transition-colors disabled:opacity-50">
              {saving ? 'Čuvanje...' : 'Sačuvaj'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] font-medium text-sm hover:border-[var(--border-strong)] transition-colors">
              Otkaži
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── AddOrderModal ────────────────────────────────────────────────────────────

type NewOrderItem = {
  type: ProductType;
  material: 'PVC' | 'ALU';
  width: string;
  height: string;
  quantity: string;
};

const PRODUCT_OPTIONS: { value: ProductType; label: string }[] = [
  { value: 'window_single',     label: 'Jednokrilni prozor' },
  { value: 'window_double',     label: 'Dvokrilni prozor' },
  { value: 'trokrilni_prozor',  label: 'Trokrilni prozor' },
  { value: 'fiksni_prozor',     label: 'Fiksni prozor' },
  { value: 'door',              label: 'Vrata' },
  { value: 'balkonska_vrata',   label: 'Balkonska vrata' },
  { value: 'klizna_vrata',      label: 'Klizna vrata' },
  { value: 'plisirani_komarnik', label: 'Plisirani komarnik' },
];

function AddOrderModal({
  userRole, onClose, onSave, initialData,
}: {
  userRole: UserRole | null;
  onClose: () => void;
  onSave: (order: Order) => void;
  initialData?: Order;
}) {
  const [name, setName] = useState(initialData?.customer_name ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [location, setLocation] = useState<'Srbija' | 'Inostranstvo'>((initialData?.location as 'Srbija' | 'Inostranstvo') ?? 'Srbija');
  const [town, setTown] = useState(initialData?.town ?? '');
  const [address, setAddress] = useState(initialData?.address ?? '');
  const [price, setPrice] = useState(initialData?.total_price ? String(initialData.total_price) : '');
  const [paymentMethod, setPaymentMethod] = useState<Order['payment_method']>(
    initialData?.payment_method ?? (ls('crm-default-payment', 'cash_on_delivery') as Order['payment_method'])
  );
  const [status, setStatus] = useState<OrderStatus>(initialData?.status ?? 'na_cekanju');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [items, setItems] = useState<NewOrderItem[]>(
    initialData?.items?.length
      ? initialData.items.map(it => ({ type: it.type, material: it.material as 'PVC' | 'ALU', width: String(it.width), height: String(it.height), quantity: String(it.quantity) }))
      : [{ type: 'window_single', material: 'PVC', width: '', height: '', quantity: '1' }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function addItem() {
    setItems(prev => [...prev, { type: 'window_single', material: 'PVC', width: '', height: '', quantity: '1' }]);
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof NewOrderItem, value: string) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Ime klijenta je obavezno'); return; }
    if (!phone.trim()) { setError('Telefon je obavezan'); return; }
    for (const [i, item] of items.entries()) {
      if (!item.width || !item.height) { setError(`Stavka ${i + 1}: unesite dimenzije`); return; }
    }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/orders/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name:  name.trim(),
          phone:          phone.trim(),
          email:          email.trim() || undefined,
          location,
          town:           town.trim() || undefined,
          address:        address.trim() || undefined,
          total_price:    Number(price) || 0,
          payment_method: paymentMethod,
          status,
          notes:          notes.trim() || undefined,
          items: items.map(item => ({
            type:     item.type,
            material: item.material,
            width:    Number(item.width),
            height:   Number(item.height),
            quantity: Number(item.quantity) || 1,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Greška pri kreiranju narudžbine'); return; }
      onSave(data.order as Order);
    } catch {
      setError('Greška pri kreiranju narudžbine');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-[var(--bg-surface)] border border-[var(--border)] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="text-base font-bold text-[var(--text)]">{initialData ? 'Dupliraj narudžbinu' : 'Nova narudžbina'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)] transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-5">
          {/* Customer info */}
          <div>
            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Podaci o klijentu</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LABEL}>Ime klijenta *</label><input type="text" value={name} onChange={e => setName(e.target.value)} className={INPUT} placeholder="npr. Marko Jović" /></div>
              <div><label className={LABEL}>Telefon *</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={INPUT} placeholder="+381..." /></div>
            </div>
            <div className="mt-3"><label className={LABEL}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={INPUT} placeholder="opcionalno" /></div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className={LABEL}>Lokacija *</label>
                <select value={location} onChange={e => setLocation(e.target.value as 'Srbija' | 'Inostranstvo')} className={INPUT}>
                  <option value="Srbija">Srbija</option>
                  <option value="Inostranstvo">Inostranstvo</option>
                </select>
              </div>
              <div><label className={LABEL}>Grad / Opština</label><input type="text" value={town} onChange={e => setTown(e.target.value)} placeholder="npr. Beograd" className={INPUT} /></div>
            </div>
            <div className="mt-3"><label className={LABEL}>Adresa</label><input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ulica i broj" className={INPUT} /></div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Stavke</div>
              <button type="button" onClick={addItem} className="flex items-center gap-1 text-[#C9A84C] text-xs font-semibold hover:text-[#E8C97A] transition-colors">
                <Plus size={12} weight="bold" />Dodaj stavku
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">Stavka {idx + 1}</span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="text-[var(--text-muted)] hover:text-red-500 transition-colors" title="Ukloni stavku">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className={LABEL}>Tip proizvoda</label>
                    <select value={item.type} onChange={e => updateItem(idx, 'type', e.target.value)} className={INPUT}>
                      {PRODUCT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={LABEL}>Materijal</label>
                      <select value={item.material} onChange={e => updateItem(idx, 'material', e.target.value)} className={INPUT}>
                        <option value="PVC">PVC</option>
                        <option value="ALU">ALU</option>
                      </select>
                    </div>
                    <div>
                      <label className={LABEL}>Količina</label>
                      <input type="number" min="1" max="100" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className={`${INPUT} [appearance:textfield]`} />
                    </div>
                    <div>
                      <label className={LABEL}>Širina (mm)</label>
                      <input type="number" min="100" max="4000" value={item.width} onChange={e => updateItem(idx, 'width', e.target.value)} placeholder="npr. 900" className={`${INPUT} [appearance:textfield]`} />
                    </div>
                    <div>
                      <label className={LABEL}>Visina (mm)</label>
                      <input type="number" min="100" max="4000" value={item.height} onChange={e => updateItem(idx, 'height', e.target.value)} placeholder="npr. 1200" className={`${INPUT} [appearance:textfield]`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order details */}
          <div>
            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Detalji narudžbine</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Način plaćanja</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as Order['payment_method'])} className={INPUT}>
                  <option value="cash_on_delivery">Pouzećem</option>
                  <option value="racun">Račun</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as OrderStatus)} className={INPUT}>
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{ORDER_STATUS_CONFIG[s].label}</option>)}
                </select>
              </div>
            </div>
            {canAccess(userRole, 'admin') && (
              <div className="mt-3">
                <label className={LABEL}>Cena (RSD)</label>
                <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" className={`${INPUT} [appearance:textfield] mt-0`} />
              </div>
            )}
            <div className="mt-3">
              <label className={LABEL}>Napomena</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Dodatne napomene..." className={`${INPUT} resize-none`} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-red-500 text-xs -mt-1"><WarningCircle size={13} />{error}</div>
          )}

          <div className="flex gap-2 pb-2">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#C9A84C] text-slate-950 font-bold text-sm hover:bg-[#E8C97A] transition-colors disabled:opacity-50">
              {saving ? 'Kreiranje...' : 'Kreiraj narudžbinu'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] font-medium text-sm hover:border-[var(--border-strong)] transition-colors">
              Otkaži
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── EditTaskModal ────────────────────────────────────────────────────────────

type TaskUpdates = { title: string; description?: string; assigned_to?: string | null; due_date?: string | null };

function EditTaskModal({
  task, workers, onClose, onSave,
}: {
  task: Task; workers: User[];
  onClose: () => void;
  onSave: (id: string, updates: TaskUpdates) => Promise<void>;
}) {
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description || '');
  const [assigned, setAssigned] = useState(task.assigned_to || '');
  const [due, setDue] = useState(task.due_date ? task.due_date.slice(0, 10) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Naslov je obavezan'); return; }
    setSaving(true); setError('');
    await onSave(task.id, {
      title: title.trim(),
      description: desc.trim() || undefined,
      assigned_to: assigned || null,
      due_date: due || null,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-bold text-[var(--text)]">Uredi zadatak</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)] transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
          <div><label className={LABEL}>Naslov *</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className={INPUT} /></div>
          <div><label className={LABEL}>Opis</label><textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} className={`${INPUT} resize-none`} /></div>
          <div>
            <label className={LABEL}>Radnik</label>
            <select value={assigned} onChange={e => setAssigned(e.target.value)} className={INPUT}>
              <option value="">— Bez dodele —</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.full_name || w.email}</option>)}
            </select>
          </div>
          <div><label className={LABEL}>Rok</label><input type="date" value={due} onChange={e => setDue(e.target.value)} className={INPUT} /></div>
          {error && <p className="text-red-500 text-xs flex items-center gap-1"><WarningCircle size={12} />{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#C9A84C] text-slate-950 font-bold text-sm hover:bg-[#E8C97A] transition-colors disabled:opacity-50">
              {saving ? 'Čuvanje...' : 'Sačuvaj'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] font-medium text-sm hover:border-[var(--border-strong)] transition-colors">
              Otkaži
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Task urgency helper ──────────────────────────────────────────────────────

function taskUrgency(task: Task): 'overdue' | 'soon' | null {
  if (!task.due_date || task.status === 'done') return null;
  const diff = (new Date(task.due_date).getTime() - Date.now()) / 86400000;
  if (diff < 0) return 'overdue';
  if (diff <= 3) return 'soon';
  return null;
}

// ─── TaskBoard ────────────────────────────────────────────────────────────────

function TaskBoard({
  tasks, workers, canManage, onStatusChange, onAddTask, onDeleteTask, onEditTask,
}: {
  tasks: Task[]; workers: User[]; canManage: boolean;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onAddTask: (title: string, desc: string, assignedTo: string, dueDate: string) => Promise<void>;
  onDeleteTask: (id: string) => void;
  onEditTask: (id: string, updates: TaskUpdates) => Promise<void>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskSearch, setTaskSearch] = useState('');
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState('');
  const [assigned, setAssigned] = useState(''); const [due, setDue] = useState('');
  const [adding, setAdding] = useState(false); const [addErr, setAddErr] = useState('');

  async function handleAdd() {
    if (!title.trim()) { setAddErr('Unesite naslov zadatka'); return; }
    setAdding(true); setAddErr('');
    await onAddTask(title.trim(), desc.trim(), assigned, due);
    setTitle(''); setDesc(''); setAssigned(''); setDue('');
    setShowAdd(false); setAdding(false);
  }

  const columns: { status: TaskStatus; label: string }[] = [
    { status: 'todo', label: 'Čeka' },
    { status: 'in_progress', label: 'U toku' },
    { status: 'done', label: 'Završeno' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[var(--text)]">Zadaci</h2>
        {canManage && (
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] text-sm font-semibold hover:bg-[#C9A84C]/20 transition-colors">
            <Plus size={14} weight="bold" />
            Novi zadatak
          </button>
        )}
      </div>

      <div className="relative mb-4">
        <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Pretraga zadataka..."
          value={taskSearch}
          onChange={e => setTaskSearch(e.target.value)}
          className={`${INPUT} pl-8`}
        />
      </div>

      {showAdd && (
        <div className="mb-5 p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)]">
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div><label className={LABEL}>Naslov *</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="npr. Ugradnja prozora" className={INPUT} /></div>
            <div>
              <label className={LABEL}>Dodeliti radniku</label>
              <select value={assigned} onChange={e => setAssigned(e.target.value)} className={INPUT}>
                <option value="">— Izaberi radnika —</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.full_name || w.email}</option>)}
              </select>
            </div>
            <div><label className={LABEL}>Opis</label><input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Detalji zadatka..." className={INPUT} /></div>
            <div><label className={LABEL}>Rok</label><input type="date" value={due} onChange={e => setDue(e.target.value)} className={INPUT} /></div>
          </div>
          {addErr && <p className="text-red-500 text-xs mb-2 flex items-center gap-1"><WarningCircle size={12} />{addErr}</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={adding} className="px-4 py-2 rounded-xl bg-[#C9A84C] text-slate-950 font-bold text-sm hover:bg-[#E8C97A] transition-colors disabled:opacity-50">
              {adding ? 'Čuvanje...' : 'Sačuvaj'}
            </button>
            <button onClick={() => { setShowAdd(false); setAddErr(''); }} className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-sm hover:border-[var(--border-strong)] transition-colors">
              Otkaži
            </button>
          </div>
        </div>
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          workers={workers}
          onClose={() => setEditingTask(null)}
          onSave={async (id, updates) => { await onEditTask(id, updates); setEditingTask(null); }}
        />
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.status && (
            !taskSearch.trim() ||
            t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
            (t.users?.full_name ?? t.users?.email ?? '').toLowerCase().includes(taskSearch.toLowerCase())
          ));
          const cfg = TASK_STATUS_CONFIG[col.status];
          return (
            <div key={col.status} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
                <span className="text-[var(--text-muted)] text-xs">{colTasks.length}</span>
              </div>
              <div className="p-3 space-y-2 min-h-[140px]">
                {colTasks.length === 0 && (
                  <div className="text-center text-[var(--text-muted)] text-xs py-8">Nema zadataka</div>
                )}
                {colTasks.map(task => {
                  const urg = taskUrgency(task);
                  return (
                  <div key={task.id} className={`p-3 rounded-xl border transition-colors group ${urg === 'overdue' ? 'border-red-500/50 bg-red-500/5' : urg === 'soon' ? 'border-amber-500/40 bg-amber-500/5' : 'border-[var(--border)] bg-[var(--bg-raised)] hover:border-[var(--border-strong)]'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[var(--text)] text-sm font-medium leading-snug">{task.title}</span>
                      {canManage && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
                          <button onClick={() => setEditingTask(task)} className="text-[var(--text-muted)] hover:text-[#C9A84C] transition-colors" title="Uredi zadatak">
                            <PencilSimple size={13} />
                          </button>
                          <button onClick={() => onDeleteTask(task.id)} className="text-[var(--text-muted)] hover:text-red-500 transition-colors" title="Obriši zadatak">
                            <Trash size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                    {task.description && <p className="text-[var(--text-muted)] text-xs mb-2 leading-relaxed">{task.description}</p>}
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <div className="text-xs flex items-center gap-1.5">
                        {task.users && <span className="text-[var(--text-muted)]">{task.users.full_name || task.users.email?.split('@')[0]}</span>}
                        {task.due_date && <span className={urg === 'overdue' ? 'text-red-500 font-semibold' : urg === 'soon' ? 'text-amber-500 font-semibold' : 'text-[var(--text-muted)]'}>· {new Date(task.due_date).toLocaleDateString('sr-RS')}</span>}
                      </div>
                      <select
                        value={task.status}
                        onChange={e => onStatusChange(task.id, e.target.value as TaskStatus)}
                        className="text-xs bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text-muted)] rounded-lg px-1.5 py-0.5 focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
                      >
                        <option value="todo">Čeka</option>
                        <option value="in_progress">U toku</option>
                        <option value="done">Završeno</option>
                      </select>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── UsersSection ─────────────────────────────────────────────────────────────

function UsersSection({ users, onRefresh }: { users: User[]; onRefresh: () => Promise<void> }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [addName, setAddName] = useState(''); const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState(''); const [addRole, setAddRole] = useState<UserRole>('worker');
  const [adding, setAdding] = useState(false); const [addErr, setAddErr] = useState('');

  const [editName, setEditName] = useState(''); const [editRole, setEditRole] = useState<UserRole>('worker');
  const [editPassword, setEditPassword] = useState(''); const [editing, setEditing] = useState(false);
  const [editErr, setEditErr] = useState('');

  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [deleteErr, setDeleteErr] = useState('');

  async function handleAdd() {
    if (!addEmail.trim()) { setAddErr('Email je obavezan'); return; }
    if (addPassword.length < 6) { setAddErr('Lozinka mora imati najmanje 6 karaktera'); return; }
    setAdding(true); setAddErr('');
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: addEmail.trim(), password: addPassword, full_name: addName.trim() || undefined, role: addRole }) });
      const data = await res.json();
      if (!res.ok) { setAddErr(data.error || 'Greška pri kreiranju korisnika'); return; }
      setAddName(''); setAddEmail(''); setAddPassword(''); setAddRole('worker');
      setShowAdd(false); await onRefresh();
    } catch { setAddErr('Greška pri kreiranju korisnika'); }
    finally { setAdding(false); }
  }

  function openEdit(u: User) {
    setEditName(u.full_name || ''); setEditRole(u.role); setEditPassword(''); setEditErr(''); setEditingUser(u);
  }

  async function handleEdit() {
    if (!editingUser) return;
    if (editPassword && editPassword.length < 6) { setEditErr('Lozinka mora imati najmanje 6 karaktera'); return; }
    setEditing(true); setEditErr('');
    try {
      const body: Record<string, unknown> = { full_name: editName.trim() || null, role: editRole };
      if (editPassword) body.password = editPassword;
      const res = await fetch(`/api/users/${editingUser.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setEditErr(data.error || 'Greška'); return; }
      setEditingUser(null); await onRefresh();
    } catch { setEditErr('Greška pri čuvanju'); }
    finally { setEditing(false); }
  }

  function handleDelete(u: User) { setConfirmUser(u); }

  async function performDelete() {
    if (!confirmUser) return;
    const u = confirmUser;
    setConfirmUser(null);
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); setDeleteErr(d.error || 'Greška pri brisanju'); return; }
      await onRefresh();
    } catch { setDeleteErr('Greška pri brisanju korisnika'); }
  }

  const ROLE_CONFIG: Record<UserRole, { label: string; cls: string }> = {
    admin:   { label: 'Admin',     cls: 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30' },
    manager: { label: 'Menadžer', cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
    worker:  { label: 'Radnik',   cls: 'bg-[var(--bg-raised)] text-[var(--text-muted)]' },
  };

  return (
    <div>
      {confirmUser && (
        <ConfirmModal
          title="Obriši korisnika"
          message={`Da li ste sigurni da želite da obrišete korisnika ${confirmUser.full_name || confirmUser.email}?`}
          onConfirm={performDelete}
          onCancel={() => setConfirmUser(null)}
        />
      )}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-[var(--text)]">Korisnici</h2>
        <button onClick={() => { setShowAdd(!showAdd); setAddErr(''); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] text-sm font-semibold hover:bg-[#C9A84C]/20 transition-colors">
          <Plus size={14} weight="bold" />
          Novi korisnik
        </button>
      </div>
      {deleteErr && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm flex items-center gap-2">
          <WarningCircle size={15} />{deleteErr}
          <button onClick={() => setDeleteErr('')} className="ml-auto opacity-60 hover:opacity-100 transition-opacity"><X size={14} /></button>
        </div>
      )}

      {showAdd && (
        <div className="mb-5 p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)]">
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div><label className={LABEL}>Ime i prezime</label><input type="text" value={addName} onChange={e => setAddName(e.target.value)} placeholder="npr. Marko Jović" className={INPUT} /></div>
            <div><label className={LABEL}>Email *</label><input type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)} placeholder="korisnik@email.com" className={INPUT} /></div>
            <div><label className={LABEL}>Lozinka *</label><input type="password" value={addPassword} onChange={e => setAddPassword(e.target.value)} placeholder="Min. 6 karaktera" className={INPUT} /></div>
            <div>
              <label className={LABEL}>Rola</label>
              <select value={addRole} onChange={e => setAddRole(e.target.value as UserRole)} className={INPUT}>
                <option value="worker">Radnik</option>
                <option value="manager">Menadžer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          {addErr && <p className="text-red-500 text-xs mb-2 flex items-center gap-1"><WarningCircle size={12} />{addErr}</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={adding} className="px-4 py-2 rounded-xl bg-[#C9A84C] text-slate-950 font-bold text-sm hover:bg-[#E8C97A] transition-colors disabled:opacity-50">
              {adding ? 'Kreiranje...' : 'Kreiraj'}
            </button>
            <button onClick={() => { setShowAdd(false); setAddErr(''); }} className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-sm hover:border-[var(--border-strong)] transition-colors">
              Otkaži
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_auto] gap-4 px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-raised)] text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
          <span>Ime</span><span>Email</span><span>Rola</span><span>Akcija</span>
        </div>
        {users.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-muted)] text-sm">Nema korisnika</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {users.map(u => (
              <div key={u.id} className="md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_auto] gap-4 px-5 py-4 items-center hover:bg-[var(--bg-raised)] transition-colors">
                <div className="font-medium text-[var(--text)] text-sm">{u.full_name || <span className="text-[var(--text-muted)] italic">Bez imena</span>}</div>
                <div className="text-[var(--text-muted)] text-sm mt-1 md:mt-0">{u.email}</div>
                <div className="mt-1 md:mt-0">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_CONFIG[u.role].cls}`}>{ROLE_CONFIG[u.role].label}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 md:mt-0 justify-end">
                  <button onClick={() => openEdit(u)} className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors" title="Uredi">
                    <PencilSimple size={14} />
                  </button>
                  <button onClick={() => handleDelete(u)} className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Obriši">
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
          <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-base font-bold text-[var(--text)]">Uredi korisnika</h2>
              <button onClick={() => setEditingUser(null)} className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)] transition-colors"><X size={15} /></button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div><label className={LABEL}>Ime i prezime</label><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className={INPUT} /></div>
              <div>
                <label className={LABEL}>Rola</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value as UserRole)} className={INPUT}>
                  <option value="worker">Radnik</option>
                  <option value="manager">Menadžer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Nova lozinka <span className="text-[var(--text-faint)]">(ostavi prazno da ne menjaš)</span></label>
                <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Min. 6 karaktera" className={INPUT} />
              </div>
              {editErr && <p className="text-red-500 text-xs flex items-center gap-1"><WarningCircle size={12} />{editErr}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={handleEdit} disabled={editing} className="flex-1 py-2.5 rounded-xl bg-[#C9A84C] text-slate-950 font-bold text-sm hover:bg-[#E8C97A] transition-colors disabled:opacity-50">
                  {editing ? 'Čuvanje...' : 'Sačuvaj'}
                </button>
                <button onClick={() => setEditingUser(null)} className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-sm hover:border-[var(--border-strong)] transition-colors">
                  Otkaži
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FinanceSection ───────────────────────────────────────────────────────────

const PRODUCT_LABELS: Record<string, string> = {
  window_single:      'Jednokrilni prozor',
  window_double:      'Dvokrilni prozor',
  trokrilni_prozor:   'Trokrilni prozor',
  fiksni_prozor:      'Fiksni prozor',
  door:               'Vrata',
  balkonska_vrata:    'Balkonska vrata',
  klizna_vrata:       'Klizna vrata',
  plisirani_komarnik: 'Plisirani komarnik',
};

function FinanceSection() {
  const [period, setPeriod] = useState<'month' | 'year' | 'all'>('year');
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true); setError('');
    fetch(`/api/finance?period=${period}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Greška pri učitavanju'))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <LoadingSpinner label="Učitavanje finansija..." />;
  if (error) return <div className="px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm flex items-center gap-2"><WarningCircle size={15} />{error}</div>;
  if (!data) return null;

  const { summary, byStatus, byProductType, byMaterial, byPaymentMethod, byLocation, monthlyTrend } = data;
  const maxTrend = Math.max(...monthlyTrend.map(m => m.revenue), 1);

  const STATUS_META: Record<string, { label: string; color: string }> = {
    na_cekanju: { label: 'Na čekanju', color: 'bg-amber-400' },
    u_proizvodnji: { label: 'U proizvodnji', color: 'bg-blue-400' },
    isporuceno: { label: 'Isporučeno', color: 'bg-emerald-400' },
    otkazano: { label: 'Otkazano', color: 'bg-red-400' },
  };

  const total = summary.totalOrdersCount;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-[var(--text)]">Finansijski pregled</h2>
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-raised)] border border-[var(--border)]">
          {(['month', 'year', 'all'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${period === p ? 'bg-[#C9A84C] text-slate-950' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
              {{ month: 'Ovaj mesec', year: 'Ova godina', all: 'Sve vreme' }[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border)] rounded-2xl overflow-hidden border border-[var(--border)]">
        {[
          { label: 'Prihod', value: formatRSD(summary.totalRevenue), sub: `${summary.deliveredCount} isporučenih`, gold: true },
          { label: 'Trošak materijala', value: formatRSD(summary.materialCost), sub: `${summary.totalRevenue > 0 ? Math.round((summary.materialCost / summary.totalRevenue) * 100) : 0}% od prihoda`, red: true },
          { label: 'Bruto profit', value: formatRSD(summary.grossProfit), sub: 'Prihod − trošak mat.', green: true },
          { label: 'Marža', value: `${summary.marginPercent}%`, sub: `Na čekanju: ${formatRSD(summary.pendingRevenue)}`, blue: true },
        ].map((s, i) => (
          <div key={i} className="bg-[var(--bg-surface)] px-4 py-4">
            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">{s.label}</div>
            <div className={`text-xl font-bold font-mono ${s.gold ? 'text-[#C9A84C]' : s.red ? 'text-red-400' : s.green ? 'text-emerald-400' : 'text-blue-400'}`}>{s.value}</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]">
          <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">Mesečni prihod (12 mes.)</div>
          <div className="flex items-end gap-1.5 h-28">
            {monthlyTrend.map(m => (
              <div key={m.yearMonth} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`${m.month}: ${formatRSD(m.revenue)}`}>
                <div className="w-full flex flex-col justify-end h-full">
                  {m.revenue > 0
                    ? <div className="w-full rounded-t bg-[#C9A84C]/30 border-t border-[#C9A84C]/50 transition-all" style={{ height: `${Math.max(4, (m.revenue / maxTrend) * 100)}%` }} />
                    : <div className="w-full h-1 rounded bg-[var(--bg-raised)]" />}
                </div>
                <span className="text-[8px] text-[var(--text-muted)] leading-none">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
            <span>0</span><span>{formatRSD(maxTrend)}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]">
          <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">Raspodela narudžbina</div>
          <div className="space-y-3">
            {(['isporuceno', 'u_proizvodnji', 'na_cekanju', 'otkazano'] as const).map(s => {
              const stat = byStatus[s]; if (!stat) return null;
              const meta = STATUS_META[s];
              const pct = total > 0 ? Math.round((stat.count / total) * 100) : 0;
              return (
                <div key={s}>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${meta.color}`} /><span className="text-[var(--text)]">{meta.label}</span></div>
                    <div className="flex items-center gap-3 text-[var(--text-muted)]"><span>{stat.count}</span><span className="font-mono text-[var(--text)]">{formatRSD(stat.revenue)}</span></div>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bg-raised)]">
                    <div className={`h-full rounded-full ${meta.color} opacity-70`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {summary.cancelledValue > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
              Izgubljeno (otkazano): <span className="text-red-400">{formatRSD(summary.cancelledValue)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">Raspodela po tipu (isporučeno)</div>
        {Object.keys(byProductType).length === 0 ? (
          <div className="text-[var(--text-muted)] text-sm py-4 text-center">Nema podataka</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  <th className="text-left pb-3 font-semibold">Tip</th>
                  <th className="text-right pb-3 font-semibold">Komada</th>
                  <th className="text-right pb-3 font-semibold">Kalk. vrednost</th>
                  <th className="text-right pb-3 font-semibold">Trošak mat.</th>
                  <th className="text-right pb-3 font-semibold">Marža</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {Object.entries(byProductType).map(([type, stat]) => {
                  const margin = stat.calcRevenue > 0 ? Math.round(((stat.calcRevenue - stat.cost) / stat.calcRevenue) * 100) : 0;
                  return (
                    <tr key={type} className="text-[var(--text)]">
                      <td className="py-3">{PRODUCT_LABELS[type] || type}</td>
                      <td className="text-right py-3 font-mono text-[var(--text-muted)]">{stat.units}</td>
                      <td className="text-right py-3 font-mono text-[#C9A84C]">{formatRSD(stat.calcRevenue)}</td>
                      <td className="text-right py-3 font-mono text-red-400">{formatRSD(stat.cost)}</td>
                      <td className="text-right py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{margin}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[var(--text-faint)] text-xs mt-3">* Kalk. vrednost je cena po formuli, ne konačna cena narudžbine</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: 'Materijal', items: Object.entries(byMaterial), renderBar: (mat: string) => mat === 'PVC' ? 'bg-blue-400' : 'bg-violet-400', getCount: ([, s]: [string, { units: number; cost: number; calcRevenue: number }]) => s.units, getTotal: () => Object.values(byMaterial).reduce((a, v) => a + v.units, 0), getSub: ([, s]: [string, { units: number; cost: number; calcRevenue: number }]) => `Trošak: ${formatRSD(s.cost)}` },
        ].map(({ title, items, renderBar, getCount, getTotal, getSub }) => (
          <div key={title} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]">
            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">{title}</div>
            {items.length === 0 ? <div className="text-[var(--text-muted)] text-sm">Nema podataka</div> : (
              <div className="space-y-3">
                {items.map(entry => {
                  const [key] = entry;
                  const cnt = getCount(entry as [string, { units: number; cost: number; calcRevenue: number }]);
                  const tot = getTotal();
                  const pct = tot > 0 ? Math.round((cnt / tot) * 100) : 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[var(--text)] font-semibold">{key}</span>
                        <span className="text-[var(--text-muted)]">{cnt} kom · {pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--bg-raised)]">
                        <div className={`h-full rounded-full ${renderBar(key)}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">{getSub(entry as [string, { units: number; cost: number; calcRevenue: number }])}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]">
          <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">Način plaćanja</div>
          {Object.keys(byPaymentMethod).length === 0 ? <div className="text-[var(--text-muted)] text-sm">Nema podataka</div> : (
            <div className="space-y-3">
              {Object.entries(byPaymentMethod).map(([pm, stat]) => {
                const tot = Object.values(byPaymentMethod).reduce((s, v) => s + v.count, 0);
                const pct = tot > 0 ? Math.round((stat.count / tot) * 100) : 0;
                return (
                  <div key={pm}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[var(--text)]">{pm === 'cash_on_delivery' ? 'Pouzećem' : 'Račun'}</span>
                      <span className="text-[var(--text-muted)]">{stat.count} · {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--bg-raised)]"><div className={`h-full rounded-full ${pm === 'cash_on_delivery' ? 'bg-amber-400' : 'bg-cyan-400'}`} style={{ width: `${pct}%` }} /></div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">{formatRSD(stat.revenue)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]">
          <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">Lokacija dostave</div>
          {Object.keys(byLocation).length === 0 ? <div className="text-[var(--text-muted)] text-sm">Nema podataka</div> : (
            <div className="space-y-3">
              {Object.entries(byLocation).map(([loc, stat]) => {
                const tot = Object.values(byLocation).reduce((s, v) => s + v.count, 0);
                const pct = tot > 0 ? Math.round((stat.count / tot) * 100) : 0;
                return (
                  <div key={loc}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[var(--text)]">{loc}</span>
                      <span className="text-[var(--text-muted)]">{stat.count} · {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--bg-raised)]"><div className={`h-full rounded-full ${loc === 'Srbija' ? 'bg-emerald-400' : 'bg-orange-400'}`} style={{ width: `${pct}%` }} /></div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">{formatRSD(stat.revenue)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── RacunSection ─────────────────────────────────────────────────────────────

type InvoiceItem = {
  id: string;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  pdvRate: number;
};

const DEFAULT_COMPANY_INFO = {
  name: 'JOVIĆ GROUP',
  pib: '104120427',
  mb: '20096209',
  address: 'STEVANA TIŠME 112',
  city: '22303, Stari Banovci',
  country: 'Srbija',
};

type CompanyInfo = typeof DEFAULT_COMPANY_INFO;

function getCompanyInfo(): CompanyInfo {
  try {
    const saved = ls('crm-company-info', '');
    if (saved) return { ...DEFAULT_COMPANY_INFO, ...JSON.parse(saved) };
  } catch {}
  return { ...DEFAULT_COMPANY_INFO };
}

const ITEM_UNITS = ['kom', 'm²', 'm', 'sat', 'kg', 'l', 'usluga', 'paket'];

function newInvoiceItem(): InvoiceItem {
  return { id: Math.random().toString(36).slice(2), description: '', unit: 'kom', quantity: '1', unitPrice: '', pdvRate: 20 };
}

function fmtInv(n: number): string {
  return n.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcItem(item: InvoiceItem) {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  const base = qty * price;
  const pdv = base * (item.pdvRate / 100);
  return { base, pdv, total: base + pdv };
}

function buildInvoiceHtml({
  invoiceNumber, invoiceDate, valuationDate, dueDate,
  showClient, clientType, clientName, clientMb, clientPib,
  clientAddress, clientCity, clientZip, clientPhone, clientContact, clientJmbg,
  notes, items, company,
}: {
  invoiceNumber: string; invoiceDate: string; valuationDate: string; dueDate: string;
  showClient: boolean; clientType: 'firma' | 'fizicko';
  clientName: string; clientMb: string; clientPib: string;
  clientAddress: string; clientCity: string; clientZip: string;
  clientPhone: string; clientContact: string; clientJmbg: string;
  notes: string; items: InvoiceItem[]; company: CompanyInfo;
}): string {
  const logoUrl = typeof window !== 'undefined' ? window.location.origin + '/logo.png' : '/logo.png';
  const fmtD = (d: string) => d ? new Date(d).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

  const rows = items.map((item, idx) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const base = qty * price;
    const pdv = base * (item.pdvRate / 100);
    return { ...item, n: idx + 1, qty, price, base, pdv, total: base + pdv };
  });
  const subtotal = rows.reduce((s, r) => s + r.base, 0);
  const totalPdv = rows.reduce((s, r) => s + r.pdv, 0);
  const grandTotal = subtotal + totalPdv;
  const hasClient = showClient && !!clientName;
  const clientFullAddress = [clientAddress, [clientZip, clientCity].filter(Boolean).join(' ')].filter(Boolean).join(', ');

  const ITEMS_PER_PAGE = 18;
  const chunks: (typeof rows)[] = [];
  for (let i = 0; i < rows.length; i += ITEMS_PER_PAGE) chunks.push(rows.slice(i, i + ITEMS_PER_PAGE));
  if (chunks.length === 0) chunks.push([]);
  const totalPages = chunks.length;

  const renderRows = (chunk: typeof rows) => chunk.map(r => `
    <tr>
      <td class="c">${r.n}.</td>
      <td>${r.description || '—'}</td>
      <td class="c">${r.unit}</td>
      <td class="r">${r.qty % 1 === 0 ? String(r.qty) : r.qty.toFixed(3).replace(/\.?0+$/, '')}</td>
      <td class="r">${fmtInv(r.price)}</td>
      <td class="c">${r.pdvRate}%</td>
      <td class="r">${fmtInv(r.pdv)}</td>
      <td class="r b">${fmtInv(r.total)}</td>
    </tr>`).join('');

  const tableHead = `<thead><tr>
        <th style="width:26px">#</th>
        <th>Opis usluge / robe</th>
        <th class="c" style="width:48px">J.m.</th>
        <th class="r" style="width:54px">Kol.</th>
        <th class="r" style="width:90px">Jed. cena</th>
        <th class="c" style="width:44px">PDV%</th>
        <th class="r" style="width:82px">PDV iznos</th>
        <th class="r" style="width:90px">Ukupno</th>
      </tr></thead>`;

  const totalsAndFooter = `
  <div class="totals">
    <div class="tot-box">
      <div class="tr"><span>Ukupno bez PDV</span><span>${fmtInv(subtotal)} RSD</span></div>
      <div class="tr"><span>PDV</span><span>${fmtInv(totalPdv)} RSD</span></div>
      <div class="tr tg"><span>UKUPNO ZA PLAĆANJE</span><span>${fmtInv(grandTotal)} RSD</span></div>
    </div>
  </div>
  ${notes ? `<div class="notes"><div class="nt">Napomena</div><p>${notes}</p></div>` : ''}
  <div class="footer">
    <div class="ft">
      <div>${company.name} &nbsp;·&nbsp; PIB: ${company.pib} &nbsp;·&nbsp; MB: ${company.mb}</div>
      <div>${company.address}, ${company.city}, ${company.country}</div>
    </div>
    <div class="sig">
      <div class="sig-line"></div>
      <span>Potpis i pečat</span>
    </div>
  </div>`;

  const pagesHtml = chunks.map((chunk, pageIdx) => {
    const isFirst = pageIdx === 0;
    const isLast = pageIdx === totalPages - 1;
    const pageHeader = isFirst ? `
  <div class="header">
    <div class="header-left">
      <img src="${logoUrl}" alt="Logo" class="logo" onerror="this.style.display='none'"/>
      <div>
        <div class="co-name">${company.name}</div>
        <div class="co-tag">PVC &amp; ALU Stolarija</div>
      </div>
    </div>
    <div class="co-det">
      <div><b>PIB:</b> ${company.pib}</div>
      <div><b>Mat. br.:</b> ${company.mb}</div>
      <div>${company.address}</div>
      <div>${company.city}, ${company.country}</div>
    </div>
  </div>
  <div class="title-bar">
    <div>
      <div class="inv-h">RAČUN</div>
      ${invoiceNumber ? `<div class="inv-num">Br. ${invoiceNumber}</div>` : ''}
    </div>
    <div class="inv-meta">
      ${invoiceDate ? `<div><b>Datum računa:</b> ${fmtD(invoiceDate)}</div>` : ''}
      ${valuationDate ? `<div><b>Datum prometa:</b> ${fmtD(valuationDate)}</div>` : ''}
      ${dueDate ? `<div><b>Rok plaćanja:</b> ${fmtD(dueDate)}</div>` : ''}
    </div>
  </div>
  ${hasClient ? `<div class="client-box">
    <div class="ib-t">${clientType === 'firma' ? 'Kupac / Firma' : 'Kupac / Fizičko lice'}</div>
    <p><b>${clientName}</b></p>
    ${clientFullAddress ? `<p class="m">${clientFullAddress}</p>` : ''}
    ${clientType === 'firma' && clientPib ? `<p class="m">PIB: ${clientPib}${clientMb ? ' &nbsp;·&nbsp; MB: ' + clientMb : ''}</p>` : ''}
    ${clientType === 'fizicko' && clientJmbg ? `<p class="m">JMBG: ${clientJmbg}</p>` : ''}
    ${clientPhone ? `<p class="m">Tel: ${clientPhone}</p>` : ''}
    ${clientType === 'firma' && clientContact ? `<p class="m">Kontakt: ${clientContact}</p>` : ''}
  </div>` : ''}` : `
  <div class="cont-header">
    <span class="cont-title">RAČUN ${invoiceNumber ? '# ' + invoiceNumber : ''} — nastavak</span>
    <span class="cont-page">Strana ${pageIdx + 1} / ${totalPages}</span>
  </div>`;
    return `<div class="page${isLast ? ' last' : ''}">
  ${pageHeader}
  <table>${tableHead}<tbody>${renderRows(chunk)}</tbody></table>
  ${isLast ? totalsAndFooter : ''}
</div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="sr">
<head>
<meta charset="utf-8">
<title>Račun ${invoiceNumber ? '# ' + invoiceNumber : ''}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;font-size:9.5pt;color:#1a1a1a;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;min-height:297mm;margin:0 auto;padding:14mm 15mm 10mm;background:#fff;position:relative;page-break-after:always}
  .page.last{padding-bottom:24mm;page-break-after:auto}
  .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;border-bottom:2px solid #1a1a1a;margin-bottom:18px}
  .header-left{display:flex;align-items:center;gap:12px}
  .logo{width:48px;height:48px;object-fit:contain}
  .co-name{font-size:20pt;font-weight:900;color:#111;letter-spacing:-0.5px;line-height:1}
  .co-tag{font-size:6.5pt;color:#555;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-top:4px}
  .co-det{text-align:right;font-size:8pt;color:#555;line-height:1.8}
  .co-det b{color:#1a1a1a;font-weight:700}
  .title-bar{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px}
  .inv-h{font-size:28pt;font-weight:900;color:#111;letter-spacing:-1px;line-height:1}
  .inv-num{font-size:7.5pt;color:#444;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px}
  .inv-meta{text-align:right;font-size:8.5pt;color:#555;line-height:1.9}
  .inv-meta b{color:#1a1a1a;font-weight:700;display:inline-block;min-width:130px}
  .cont-header{display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;border-bottom:1px solid #ccc;margin-bottom:14px}
  .cont-title{font-size:9pt;font-weight:700;color:#444;letter-spacing:0.3px}
  .cont-page{font-size:8pt;color:#888}
  ${hasClient ? `.client-box{background:#f5f5f5;border:1px solid #ddd;border-radius:6px;padding:10px 14px;margin-bottom:18px;display:inline-block;min-width:220px;max-width:50%}
  .client-box .ib-t{font-size:6.5pt;font-weight:700;color:#444;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px}
  .client-box p{font-size:8.5pt;color:#1a1a1a;line-height:1.65}
  .client-box p.m{color:#666;font-size:8pt}` : ''}
  table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:9pt;table-layout:fixed}
  thead tr{background:#3a3a3a}
  thead th{padding:7px 10px;font-weight:700;font-size:7pt;letter-spacing:0.4px;color:#fff;text-align:left;white-space:nowrap}
  th.r{text-align:right}th.c{text-align:center}
  tbody tr{border-bottom:1px solid #e8e8e8}
  tbody tr:nth-child(even){background:#f7f7f7}
  td{padding:7px 10px;color:#1a1a1a;vertical-align:top;word-break:break-word;overflow-wrap:break-word}
  td.r{text-align:right}td.c{text-align:center}td.b{font-weight:700}
  .totals{display:flex;justify-content:flex-end;margin-bottom:20px}
  .tot-box{width:272px;border:1px solid #d0d0d0;border-radius:7px;overflow:hidden}
  .tr{display:flex;justify-content:space-between;align-items:center;padding:8px 14px;border-bottom:1px solid #e8e8e8;font-size:9pt;color:#555}
  .tr:last-child{border-bottom:none}
  .tr span:last-child{color:#1a1a1a;font-weight:600;font-size:9.5pt}
  .tg{background:#e8e8e8;padding:9px 14px}
  .tg span{font-weight:900;font-size:11pt;color:#111}
  .notes{border-top:1px solid #ddd;padding-top:10px;margin-top:4px;margin-bottom:16px}
  .nt{font-size:6.5pt;font-weight:700;color:#444;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:5px}
  .notes p{font-size:8.5pt;color:#555;line-height:1.6}
  .footer{position:absolute;bottom:14mm;left:15mm;right:15mm;display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid #ccc;padding-top:9px}
  .ft{font-size:7pt;color:#888;line-height:1.75}
  .sig{text-align:center;width:155px}
  .sig-line{border-bottom:1px solid #bbb;height:40px;margin-bottom:5px}
  .sig span{font-size:7pt;color:#888}
  @media print{body{margin:0}@page{size:A4;margin:0}.page{padding:12mm 14mm 8mm}.page.last{padding-bottom:18mm}}
</style>
</head>
<body>
${pagesHtml}
</body>
</html>`;
}

function RacunSection() {
  const company = useMemo(() => getCompanyInfo(), []);
  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    const counter = parseInt(ls('crm-invoice-next', '1'), 10);
    return `${String(counter).padStart(2, '0')}/${String(new Date().getFullYear()).slice(-2)}`;
  });
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [valuationDate, setValuationDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showClient, setShowClient] = useState(false);
  const [clientType, setClientType] = useState<'firma' | 'fizicko'>('firma');
  const [clientName, setClientName] = useState('');
  const [clientMb, setClientMb] = useState('');
  const [clientPib, setClientPib] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientZip, setClientZip] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientJmbg, setClientJmbg] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([newInvoiceItem()]);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.6);

  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const update = () => setPreviewScale(Math.min(1, el.offsetWidth / 794));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const previewHtml = useMemo(() => buildInvoiceHtml({
    invoiceNumber, invoiceDate, valuationDate, dueDate,
    showClient, clientType, clientName, clientMb, clientPib,
    clientAddress, clientCity, clientZip, clientPhone, clientContact, clientJmbg,
    notes, items, company,
  }), [invoiceNumber, invoiceDate, valuationDate, dueDate, showClient, clientType,
      clientName, clientMb, clientPib, clientAddress, clientCity, clientZip,
      clientPhone, clientContact, clientJmbg, notes, items, company]);

  function addItem() { setItems(prev => [...prev, newInvoiceItem()]); }
  function removeItem(id: string) { setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev); }
  function updateItem<K extends keyof InvoiceItem>(id: string, field: K, value: InvoiceItem[K]) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  }

  const totals = useMemo(() => {
    const calced = items.map(calcItem);
    const subtotal = calced.reduce((s, r) => s + r.base, 0);
    const totalPdv = calced.reduce((s, r) => s + r.pdv, 0);
    return { subtotal, totalPdv, grandTotal: subtotal + totalPdv };
  }, [items]);

  function handlePrint() {
    const html = buildInvoiceHtml({
      invoiceNumber, invoiceDate, valuationDate, dueDate,
      showClient, clientType, clientName, clientMb, clientPib,
      clientAddress, clientCity, clientZip, clientPhone, clientContact, clientJmbg,
      notes, items, company,
    });
    const win = window.open('', '_blank', 'width=960,height=1100');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 700);
    // Bump counter and pre-fill next number
    const match = invoiceNumber.match(/^(\d+)/);
    if (match) {
      const next = parseInt(match[1], 10) + 1;
      localStorage.setItem('crm-invoice-next', String(next));
      setInvoiceNumber(`${String(next).padStart(2, '0')}/${String(new Date().getFullYear()).slice(-2)}`);
    }
  }

  const II = `${INPUT} text-sm`;

  return (
    <div className="flex gap-6 items-start">
      <div className="space-y-5 flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text)]">Kreiranje računa</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">PIB: {company.pib} &nbsp;·&nbsp; MB: {company.mb} &nbsp;·&nbsp; {company.address}, {company.city}</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A84C] text-slate-950 font-bold text-sm hover:bg-[#E8C97A] active:scale-[0.97] transition-all"
        >
          <Printer size={15} weight="bold" />
          Štampaj / PDF
        </button>
      </div>

      {/* Client card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        {/* Client toggle header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={showClient}
              onClick={() => setShowClient(v => !v)}
              className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${showClient ? 'bg-[#C9A84C]' : 'bg-slate-600 dark:bg-slate-700'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${showClient ? 'translate-x-4' : ''}`} />
            </button>
            <span className="text-sm font-semibold text-[var(--text)]">Podaci o kupcu</span>
            {!showClient && <span className="text-xs text-[var(--text-muted)]">(opcionalno)</span>}
          </label>
          {showClient && (
            <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-raised)] border border-[var(--border)]">
              {(['firma', 'fizicko'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setClientType(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${clientType === t ? 'bg-[#C9A84C] text-slate-950' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                >
                  {t === 'firma' ? 'Firma / Pravno lice' : 'Fizičko lice'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Client fields */}
        {showClient && (
          <div className="px-5 py-4">
            {clientType === 'firma' ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className={LABEL}>Naziv firme *</label>
                  <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="npr. Firma d.o.o." className={II} />
                </div>
                <div>
                  <label className={LABEL}>PIB</label>
                  <input type="text" value={clientPib} onChange={e => setClientPib(e.target.value)} placeholder="123456789" className={II} />
                </div>
                <div>
                  <label className={LABEL}>Matični broj</label>
                  <input type="text" value={clientMb} onChange={e => setClientMb(e.target.value)} placeholder="12345678" className={II} />
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL}>Adresa (ulica i broj)</label>
                  <input type="text" value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="npr. Ulica 123" className={II} />
                </div>
                <div>
                  <label className={LABEL}>Grad</label>
                  <input type="text" value={clientCity} onChange={e => setClientCity(e.target.value)} placeholder="npr. Beograd" className={II} />
                </div>
                <div>
                  <label className={LABEL}>Poštanski broj</label>
                  <input type="text" value={clientZip} onChange={e => setClientZip(e.target.value)} placeholder="11000" className={II} />
                </div>
                <div>
                  <label className={LABEL}>Kontakt osoba</label>
                  <input type="text" value={clientContact} onChange={e => setClientContact(e.target.value)} placeholder="Ime i prezime" className={II} />
                </div>
                <div>
                  <label className={LABEL}>Telefon</label>
                  <input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+381..." className={II} />
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className={LABEL}>Ime i prezime *</label>
                  <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="npr. Marko Marković" className={II} />
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL}>Adresa (ulica i broj)</label>
                  <input type="text" value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="npr. Ulica 123" className={II} />
                </div>
                <div>
                  <label className={LABEL}>Grad</label>
                  <input type="text" value={clientCity} onChange={e => setClientCity(e.target.value)} placeholder="npr. Beograd" className={II} />
                </div>
                <div>
                  <label className={LABEL}>Poštanski broj</label>
                  <input type="text" value={clientZip} onChange={e => setClientZip(e.target.value)} placeholder="11000" className={II} />
                </div>
                <div>
                  <label className={LABEL}>Telefon</label>
                  <input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+381..." className={II} />
                </div>
                <div>
                  <label className={LABEL}>JMBG <span className="font-normal normal-case text-[var(--text-faint)]">(opcionalno)</span></label>
                  <input type="text" value={clientJmbg} onChange={e => setClientJmbg(e.target.value)} placeholder="0101990710015" className={II} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invoice details */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-3">
        <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Podaci o računu</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className={LABEL}>Broj računa</label>
            <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="npr. 001/2026" className={II} />
          </div>
          <div>
            <label className={LABEL}>Datum računa</label>
            <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={II} />
          </div>
          <div>
            <label className={LABEL}>Datum prometa</label>
            <input type="date" value={valuationDate} onChange={e => setValuationDate(e.target.value)} className={II} />
          </div>
          <div>
            <label className={LABEL}>Rok plaćanja</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={II} />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Stavke</div>
          <button onClick={addItem} className="flex items-center gap-1 text-[#C9A84C] text-xs font-semibold hover:text-[#E8C97A] transition-colors">
            <Plus size={12} weight="bold" />Dodaj stavku
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => {
            const c = calcItem(item);
            return (
              <div key={item.id} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] space-y-2.5">
                {/* Row 1: # · description · unit · delete — grid avoids w-full conflicts */}
                <div className="grid grid-cols-[20px_1fr_72px_32px] gap-2 items-center">
                  <span className="text-xs font-semibold text-[var(--text-muted)] text-center leading-none">{idx + 1}.</span>
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                    placeholder="Opis usluge ili robe"
                    className={II}
                  />
                  <select value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} className={II}>
                    {ITEM_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <button onClick={() => removeItem(item.id)} disabled={items.length === 1} className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-25">
                    <X size={13} />
                  </button>
                </div>
                {/* Row 2: qty × price · PDV · total */}
                <div className="grid grid-cols-[80px_12px_1fr_72px_108px] gap-2 items-end pl-7">
                  <div>
                    <label className={LABEL}>Količina</label>
                    <input type="number" min="0" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className={`${II} [appearance:textfield]`} />
                  </div>
                  <span className="text-[var(--text-muted)] text-sm pb-2.5 text-center">×</span>
                  <div>
                    <label className={LABEL}>Cena bez PDV</label>
                    <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', e.target.value)} placeholder="0.00" className={`${II} [appearance:textfield]`} />
                  </div>
                  <div>
                    <label className={LABEL}>PDV</label>
                    <select value={item.pdvRate} onChange={e => updateItem(item.id, 'pdvRate', Number(e.target.value))} className={II}>
                      <option value={0}>0%</option>
                      <option value={10}>10%</option>
                      <option value={20}>20%</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Ukupno</label>
                    <div className="px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[#C9A84C] font-mono font-semibold text-right">
                      {fmtInv(c.total)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="mt-6 pt-5 border-t border-[var(--border)] flex justify-end">
          <div className="space-y-2.5 min-w-[288px]">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-muted)]">Ukupno bez PDV</span>
              <span className="font-mono text-[var(--text)]">{fmtInv(totals.subtotal)} RSD</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-muted)]">Ukupno PDV</span>
              <span className="font-mono text-[var(--text)]">{fmtInv(totals.totalPdv)} RSD</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-[var(--border)]">
              <span className="text-sm font-bold text-[var(--text)]">Ukupno za plaćanje</span>
              <span className="font-mono font-bold text-xl text-[#C9A84C]">{fmtInv(totals.grandTotal)} RSD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]">
        <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest block mb-3">Napomena</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Dodatne napomene koje će se pojaviti na računu..." className={`${II} resize-none`} />
      </div>
      </div>

      {/* Live preview panel */}
      <div className="hidden xl:block w-[480px] flex-shrink-0 sticky top-[72px]">
        <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2 flex items-center justify-between">
          <span>Pregled</span>
          <span className="font-normal normal-case text-[var(--text-faint)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ažurira se u realnom vremenu
          </span>
        </div>
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden shadow-xl">
          <div ref={previewContainerRef} className="w-full relative overflow-hidden" style={{ height: `${Math.round(1123 * previewScale)}px` }}>
            <iframe
              srcDoc={previewHtml}
              title="Pregled računa"
              style={{
                width: '794px',
                height: '1123px',
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
                border: 'none',
                pointerEvents: 'none',
                display: 'block',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Order aging helpers ──────────────────────────────────────────────────────

function orderAgingDays(order: Order): number {
  if (order.status !== 'na_cekanju' && order.status !== 'u_proizvodnji') return 0;
  return Math.floor((Date.now() - new Date(order.created_at).getTime()) / 86400000);
}

function AgingBadge({ order }: { order: Order }) {
  const warn = parseInt(ls('crm-aging-warn', '7'), 10);
  const danger = parseInt(ls('crm-aging-danger', '14'), 10);
  const days = orderAgingDays(order);
  if (days < warn) return null;
  const isDanger = days >= danger;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0 ${isDanger ? 'bg-red-500/15 text-red-500 border border-red-500/25' : 'bg-amber-500/15 text-amber-500 border border-amber-500/25'}`}>
      <ClockCountdown size={10} weight="bold" />
      {days}d
    </span>
  );
}

// ─── SettingsSection ──────────────────────────────────────────────────────────

function SaveButton({ saved, onClick }: { saved: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9A84C] text-slate-950 font-bold text-sm hover:bg-[#E8C97A] transition-colors">
      {saved ? <><Check size={14} weight="bold" />Sačuvano</> : 'Sačuvaj'}
    </button>
  );
}

function SettingsSection() {
  const yr = String(new Date().getFullYear()).slice(-2);

  // ── Invoice ──────────────────────────────────────────────────────────────────
  const [nextNum, setNextNum] = useState(() => ls('crm-invoice-next', '1'));
  const [invSaved, setInvSaved] = useState(false);
  const invoicePreview = `${String(parseInt(nextNum, 10) || 1).padStart(2, '0')}/${yr}`;

  function saveInvoice() {
    const n = parseInt(nextNum, 10);
    if (!isNaN(n) && n >= 1) {
      localStorage.setItem('crm-invoice-next', String(n));
      setInvSaved(true); setTimeout(() => setInvSaved(false), 2000);
    }
  }

  // ── Company ──────────────────────────────────────────────────────────────────
  const ci = getCompanyInfo();
  const [coName, setCoName] = useState(ci.name);
  const [coPib, setCoPib] = useState(ci.pib);
  const [coMb, setCoMb] = useState(ci.mb);
  const [coAddress, setCoAddress] = useState(ci.address);
  const [coCity, setCoCity] = useState(ci.city);
  const [coCountry, setCoCountry] = useState(ci.country);
  const [coSaved, setCoSaved] = useState(false);

  function saveCompany() {
    localStorage.setItem('crm-company-info', JSON.stringify({ name: coName, pib: coPib, mb: coMb, address: coAddress, city: coCity, country: coCountry }));
    setCoSaved(true); setTimeout(() => setCoSaved(false), 2000);
  }

  // ── Aging ─────────────────────────────────────────────────────────────────────
  const [agingWarn, setAgingWarn] = useState(() => ls('crm-aging-warn', '7'));
  const [agingDanger, setAgingDanger] = useState(() => ls('crm-aging-danger', '14'));
  const [agingSaved, setAgingSaved] = useState(false);

  function saveAging() {
    const w = parseInt(agingWarn, 10), d = parseInt(agingDanger, 10);
    if (!isNaN(w) && !isNaN(d) && w >= 1 && d > w) {
      localStorage.setItem('crm-aging-warn', String(w));
      localStorage.setItem('crm-aging-danger', String(d));
      setAgingSaved(true); setTimeout(() => setAgingSaved(false), 2000);
    }
  }

  // ── Defaults ─────────────────────────────────────────────────────────────────
  const [defSort, setDefSort] = useState(() => ls('crm-default-sort', 'date'));
  const [defDir, setDefDir] = useState(() => ls('crm-default-sort-dir', 'desc'));
  const [defDate, setDefDate] = useState(() => ls('crm-default-date-filter', 'all'));
  const [defPayment, setDefPayment] = useState(() => ls('crm-default-payment', 'cash_on_delivery'));
  const [defSaved, setDefSaved] = useState(false);

  function saveDefaults() {
    localStorage.setItem('crm-default-sort', defSort);
    localStorage.setItem('crm-default-sort-dir', defDir);
    localStorage.setItem('crm-default-date-filter', defDate);
    localStorage.setItem('crm-default-payment', defPayment);
    setDefSaved(true); setTimeout(() => setDefSaved(false), 2000);
  }

  const cardCls = 'p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-4';
  const sectionLabel = 'text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest';

  return (
    <div className="max-w-xl space-y-5">
      <h2 className="text-lg font-bold text-[var(--text)]">Podešavanja</h2>

      {/* Invoice */}
      <div className={cardCls}>
        <div className={sectionLabel}>Fakturisanje</div>
        <div>
          <label className={LABEL}>Sledeći broj računa</label>
          <div className="flex gap-3 items-center">
            <input type="number" min="1" value={nextNum} onChange={e => { setNextNum(e.target.value); setInvSaved(false); }} className={`${INPUT} w-28 [appearance:textfield]`} />
            <span className="text-[var(--text-muted)] text-sm font-mono">→ {invoicePreview}</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">Automatski se povećava posle svakog štampanja.</p>
        </div>
        <SaveButton saved={invSaved} onClick={saveInvoice} />
      </div>

      {/* Company info */}
      <div className={cardCls}>
        <div className={sectionLabel}>Podaci o firmi</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className={LABEL}>Naziv firme</label><input type="text" value={coName} onChange={e => { setCoName(e.target.value); setCoSaved(false); }} className={INPUT} /></div>
          <div><label className={LABEL}>PIB</label><input type="text" value={coPib} onChange={e => { setCoPib(e.target.value); setCoSaved(false); }} className={INPUT} /></div>
          <div><label className={LABEL}>Matični broj</label><input type="text" value={coMb} onChange={e => { setCoMb(e.target.value); setCoSaved(false); }} className={INPUT} /></div>
          <div className="col-span-2"><label className={LABEL}>Adresa</label><input type="text" value={coAddress} onChange={e => { setCoAddress(e.target.value); setCoSaved(false); }} className={INPUT} /></div>
          <div><label className={LABEL}>Grad</label><input type="text" value={coCity} onChange={e => { setCoCity(e.target.value); setCoSaved(false); }} className={INPUT} /></div>
          <div><label className={LABEL}>Država</label><input type="text" value={coCountry} onChange={e => { setCoCountry(e.target.value); setCoSaved(false); }} className={INPUT} /></div>
        </div>
        <p className="text-xs text-[var(--text-muted)]">Prikazuje se na izlaznim računima.</p>
        <SaveButton saved={coSaved} onClick={saveCompany} />
      </div>

      {/* Order aging */}
      <div className={cardCls}>
        <div className={sectionLabel}>Starenje narudžbina</div>
        <p className="text-xs text-[var(--text-muted)] -mt-2">Aktivne narudžbine starije od zadatog broja dana dobijaju oznaku upozorenja.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Upozorenje (dani) <span className="text-amber-500">●</span></label>
            <input type="number" min="1" value={agingWarn} onChange={e => { setAgingWarn(e.target.value); setAgingSaved(false); }} className={`${INPUT} [appearance:textfield]`} />
          </div>
          <div>
            <label className={LABEL}>Kritično (dani) <span className="text-red-500">●</span></label>
            <input type="number" min="1" value={agingDanger} onChange={e => { setAgingDanger(e.target.value); setAgingSaved(false); }} className={`${INPUT} [appearance:textfield]`} />
          </div>
        </div>
        {parseInt(agingDanger, 10) <= parseInt(agingWarn, 10) && (
          <p className="text-xs text-red-500 flex items-center gap-1"><WarningCircle size={12} />Kritično mora biti veće od upozorenja.</p>
        )}
        <SaveButton saved={agingSaved} onClick={saveAging} />
      </div>

      {/* Display defaults */}
      <div className={cardCls}>
        <div className={sectionLabel}>Podrazumevano prikazivanje</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Sortiranje</label>
            <select value={defSort} onChange={e => { setDefSort(e.target.value); setDefSaved(false); }} className={INPUT}>
              <option value="date">Datum</option>
              <option value="name">Ime</option>
              <option value="status">Status</option>
              <option value="value">Vrednost</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Smer</label>
            <select value={defDir} onChange={e => { setDefDir(e.target.value); setDefSaved(false); }} className={INPUT}>
              <option value="desc">Opadajuće</option>
              <option value="asc">Rastuće</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Filter perioda</label>
            <select value={defDate} onChange={e => { setDefDate(e.target.value); setDefSaved(false); }} className={INPUT}>
              <option value="all">Sve</option>
              <option value="today">Danas</option>
              <option value="week">7 dana</option>
              <option value="month">Ovaj mesec</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Način plaćanja</label>
            <select value={defPayment} onChange={e => { setDefPayment(e.target.value); setDefSaved(false); }} className={INPUT}>
              <option value="cash_on_delivery">Pouzećem</option>
              <option value="racun">Račun</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)]">Važi pri svakom otvaranju CRM-a i za nove narudžbine.</p>
        <SaveButton saved={defSaved} onClick={saveDefaults} />
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function CrmDashboardPage() {
  const router = useRouter();

  // ── Theme ────────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('crm-theme') as 'dark' | 'light' | null;
    const initial = saved ?? 'dark';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
    return () => { document.documentElement.classList.remove('dark'); };
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('crm-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }

  // ── Data ──────────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [activeSection, setActiveSection] = useState<'orders' | 'tasks' | 'users' | 'finance' | 'racun' | 'settings'>('orders');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [errorToast, setErrorToast] = useState('');
  const [confirmTaskId, setConfirmTaskId] = useState<string | null>(null);
  const [addingOrder, setAddingOrder] = useState(false);
  const [duplicatingOrder, setDuplicatingOrder] = useState<Order | null>(null);
  const [successToast, setSuccessToast] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'status' | 'name'>(
    () => ls('crm-default-sort', 'date') as 'date' | 'value' | 'status' | 'name'
  );
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>(
    () => ls('crm-default-sort-dir', 'desc') as 'desc' | 'asc'
  );
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>(
    () => ls('crm-default-date-filter', 'all') as 'all' | 'today' | 'week' | 'month'
  );
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>('u_proizvodnji');
  const [bulkApplying, setBulkApplying] = useState(false);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setSelectedIds(new Set());
    try {
      const p = new URLSearchParams();
      if (statusFilter !== 'all') p.set('status', statusFilter);
      p.set('pageSize', '100');
      const res = await fetch(`/api/orders?${p}`);
      if (res.status === 401) { router.push('/crm/login'); return; }
      if (!res.ok) throw new Error('Greška pri učitavanju narudžbina');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally { setOrdersLoading(false); }
  }, [statusFilter, router]);

  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const res = await fetch('/api/tasks');
      if (res.status === 401) { router.push('/crm/login'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch { /* silent */ } finally { setTasksLoading(false); }
  }, [router]);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) return;
      const data = await res.json();
      setWorkers(data.users || []);
      setCurrentUserRole(data.currentRole ?? null);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { if (currentUserRole === 'worker') setActiveSection('tasks'); }, [currentUserRole]);
  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { fetchTasks(); fetchWorkers(); }, [fetchTasks, fetchWorkers]);
  useEffect(() => { localStorage.setItem('crm-default-sort', sortBy); }, [sortBy]);
  useEffect(() => { localStorage.setItem('crm-default-sort-dir', sortDir); }, [sortDir]);
  useEffect(() => { localStorage.setItem('crm-default-date-filter', dateFilter); }, [dateFilter]);
  useEffect(() => {
    if (pendingOrderId && !ordersLoading) {
      const o = orders.find(x => x.id === pendingOrderId);
      if (o) { setSelectedOrder(o); setPendingOrderId(null); }
    }
  }, [orders, pendingOrderId, ordersLoading]);

  const handleOrderEdit = useCallback(async (id: string, updates: Partial<Order>) => {
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const updated = data.order as Order;
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updated } : o));
      setSelectedOrder(prev => prev?.id === id ? { ...prev, ...updated } : prev);
      setEditingOrder(null);
      setSuccessToast('Narudžbina sačuvana');
    } catch { setErrorToast('Greška pri ažuriranju narudžbine'); }
  }, []);

  const handleOrderDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setOrders(prev => prev.filter(o => o.id !== id));
      setSelectedOrder(null);
    } catch { setErrorToast('Greška pri brisanju narudžbine'); }
  }, []);

  const handleTaskStatusChange = useCallback(async (id: string, status: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (!res.ok) throw new Error();
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    } catch { setErrorToast('Greška pri ažuriranju zadatka'); }
  }, []);

  const handleAddTask = useCallback(async (title: string, description: string, assignedTo: string, dueDate: string) => {
    try {
      const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description, assigned_to: assignedTo || null, due_date: dueDate || null }) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTasks(prev => [data.task, ...prev]);
      setSuccessToast('Zadatak dodat');
    } catch { setErrorToast('Greška pri dodavanju zadatka'); }
  }, []);

  const handleDeleteTask = useCallback((id: string) => {
    setConfirmTaskId(id);
  }, []);

  const performDeleteTask = useCallback(async () => {
    if (!confirmTaskId) return;
    const id = confirmTaskId;
    setConfirmTaskId(null);
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch { setErrorToast('Greška pri brisanju zadatka'); }
  }, [confirmTaskId]);

  const handleEditTask = useCallback(async (id: string, updates: TaskUpdates) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTasks(prev => prev.map(t => t.id === id ? data.task : t));
      setSuccessToast('Zadatak ažuriran');
    } catch { setErrorToast('Greška pri ažuriranju zadatka'); }
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    setShowLogoutConfirm(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/crm/login');
  }

  const handleNewOrder = useCallback((order: Order) => {
    setOrders(prev => [order, ...prev]);
    setAddingOrder(false);
    setSelectedOrder(order);
    setSuccessToast('Narudžbina kreirana');
  }, []);

  const filteredOrders = useMemo(() => orders.filter(o => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!o.customer_name.toLowerCase().includes(q) && !o.phone.includes(q) && !(o.email || '').toLowerCase().includes(q)) return false;
    }
    if (dateFilter !== 'all') {
      const d = new Date(o.created_at);
      const now = new Date();
      if (dateFilter === 'today' && d.toDateString() !== now.toDateString()) return false;
      if (dateFilter === 'week') { const w = new Date(now); w.setDate(now.getDate() - 7); if (d < w) return false; }
      if (dateFilter === 'month' && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())) return false;
    }
    return true;
  }), [orders, searchQuery, dateFilter]);

  const toggleSort = useCallback((col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  }, [sortBy]);

  const sortedOrders = useMemo(() => [...filteredOrders].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'date') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    else if (sortBy === 'value') cmp = a.total_price - b.total_price;
    else if (sortBy === 'status') cmp = ORDER_STATUSES.indexOf(a.status) - ORDER_STATUSES.indexOf(b.status);
    else if (sortBy === 'name') cmp = a.customer_name.localeCompare(b.customer_name, 'sr');
    return sortDir === 'desc' ? -cmp : cmp;
  }), [filteredOrders, sortBy, sortDir]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const activeOrdersCount = useMemo(() =>
    orders.filter(o => o.status === 'na_cekanju' || o.status === 'u_proizvodnji').length
  , [orders]);

  const overdueTasksCount = useMemo(() => {
    const now = Date.now();
    return tasks.filter(t => t.status !== 'done' && !!t.due_date && new Date(t.due_date).getTime() < now).length;
  }, [tasks]);

  const exportCSV = useCallback(() => {
    const headers = ['Klijent', 'Telefon', 'Email', 'Grad', 'Adresa', 'Status', 'Vrednost (RSD)', 'Plaćanje', 'Datum'];
    const rows = sortedOrders.map(o => [
      o.customer_name, o.phone, o.email || '', o.town || '', o.address || '',
      ORDER_STATUS_CONFIG[o.status].label, String(o.total_price),
      o.payment_method === 'cash_on_delivery' ? 'Pouzećem' : 'Račun',
      new Date(o.created_at).toLocaleDateString('sr-RS'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `narudzbine-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }, [sortedOrders]);

  const handleBulkStatusChange = useCallback(async () => {
    if (!selectedIds.size) return;
    setBulkApplying(true);
    const ids = [...selectedIds];
    await Promise.allSettled(
      ids.map(id => fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: bulkStatus }) }))
    );
    setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, status: bulkStatus } : o));
    setSelectedIds(new Set());
    setBulkApplying(false);
    setSuccessToast(`${ids.length} narudžbina ažurirano`);
  }, [selectedIds, bulkStatus]);

  // ── Nav items ────────────────────────────────────────────────────────────────
  const navItems = ([
    { key: 'orders',   label: 'Narudžbine',   minRole: 'manager' as UserRole, Icon: Package },
    { key: 'tasks',    label: 'Zadaci',        minRole: 'worker'  as UserRole, Icon: CheckSquare },
    { key: 'users',    label: 'Korisnici',     minRole: 'admin'   as UserRole, Icon: Users },
    { key: 'finance',  label: 'Finansije',     minRole: 'admin'   as UserRole, Icon: CurrencyDollar },
    { key: 'racun',    label: 'Račun',         minRole: 'manager' as UserRole, Icon: Receipt },
  ] as const).filter(item => canAccess(currentUserRole, item.minRole));

  const sectionTitle = { orders: 'Narudžbine', tasks: 'Zadaci', users: 'Korisnici', finance: 'Finansije', racun: 'Račun', settings: 'Podešavanja' }[activeSection];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] relative">
      {/* Ambient glow backdrop — gives glass something to blur against */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -right-48 w-[700px] h-[700px] rounded-full bg-[#C9A84C]/[0.07] blur-[130px]" />
        <div className="absolute top-1/2 -left-64 w-[600px] h-[600px] rounded-full bg-blue-700/[0.09] blur-[120px]" />
        <div className="absolute -bottom-48 right-1/3 w-[500px] h-[500px] rounded-full bg-[#C9A84C]/[0.04] blur-[100px]" />
      </div>

        {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
        <aside className="fixed left-0 top-0 bottom-0 w-56 border-r border-[var(--border)] bg-[var(--bg-surface)]/80 backdrop-blur-xl flex flex-col z-30 hidden lg:flex">
          <div className="px-5 h-14 flex items-center gap-2.5 border-b border-[var(--border)] flex-shrink-0">
            <div className="w-7 h-7 relative flex-shrink-0 overflow-hidden">
              <Image src="/logo.png" alt="Jović Group" width={28} height={28} className="w-full h-full object-contain" />
            </div>
            <span className="font-display text-sm font-bold text-[var(--text)]">
              Jović <span className="text-[#C9A84C]">CRM</span>
            </span>
          </div>

          <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
            {navItems.map(({ key, label, Icon }) => {
              const active = activeSection === key;
              const badge = key === 'orders' ? activeOrdersCount : key === 'tasks' ? overdueTasksCount : 0;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSection(key as typeof activeSection)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${active ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)]'}`}
                >
                  <div className="relative flex-shrink-0">
                    <Icon size={16} weight={active ? 'fill' : 'regular'} />
                    {badge > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center leading-none px-0.5">{badge > 99 ? '99+' : badge}</span>}
                  </div>
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="px-2.5 pb-4 pt-2 border-t border-[var(--border)] space-y-0.5 flex-shrink-0">
            <a href="/" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)] transition-colors">
              <ArrowSquareOut size={16} />Sajt
            </a>
            {canAccess(currentUserRole, 'manager') && (
              <button
                onClick={() => setActiveSection('settings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${activeSection === 'settings' ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)]'}`}
              >
                <Gear size={16} weight={activeSection === 'settings' ? 'fill' : 'regular'} />Podešavanja
              </button>
            )}
            <button onClick={() => setShowLogoutConfirm(true)} disabled={loggingOut} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50">
              <SignOut size={16} />{loggingOut ? 'Odjava...' : 'Odjava'}
            </button>
          </div>
        </aside>

        {/* ── Main ──────────────────────────────────────────────────────── */}
        <main className="lg:pl-56 pb-20 lg:pb-0">

          {/* Top bar */}
          <div className="sticky top-0 z-20 bg-[var(--bg-surface)]/70 backdrop-blur-2xl border-b border-[var(--border)] h-14 flex items-center px-4 sm:px-6 gap-3 flex-shrink-0 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
            <h1 className="text-base font-semibold text-[var(--text)] flex-1 truncate">{sectionTitle}</h1>
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)] transition-colors"
                title={theme === 'dark' ? 'Svetla tema' : 'Tamna tema'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <NotificationBell
                onOrderClick={async (orderId) => {
                  setActiveSection('orders');
                  setStatusFilter('all');
                  setSearchQuery('');
                  const o = orders.find(x => x.id === orderId);
                  if (o) { setSelectedOrder(o); return; }
                  setPendingOrderId(orderId);
                  try {
                    const res = await fetch('/api/orders?pageSize=100');
                    if (res.ok) { const d = await res.json(); setOrders(d.orders || []); }
                  } catch { /* silent */ }
                }}
              />
              <div className="hidden sm:flex items-center gap-1.5 text-[var(--text-muted)] text-xs ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Online
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-5 max-w-[1400px]">

            {/* Stats */}
            {canAccess(currentUserRole, 'manager') && (
              <StatsSummary orders={orders} tasks={tasks} userRole={currentUserRole} />
            )}

            {/* ── Orders ────────────────────────────────────────────────── */}
            {activeSection === 'orders' && canAccess(currentUserRole, 'manager') && (
              <div>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
                  <div className="relative flex-1">
                    <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      placeholder="Pretraga po imenu, telefonu..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className={`${INPUT} pl-9`}
                    />
                  </div>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className={`${INPUT} w-auto`}>
                    <option value="all">Svi statusi ({orders.length})</option>
                    <option value="na_cekanju">Na čekanju ({statusCounts.na_cekanju ?? 0})</option>
                    <option value="u_proizvodnji">U proizvodnji ({statusCounts.u_proizvodnji ?? 0})</option>
                    <option value="isporuceno">Isporučeno ({statusCounts.isporuceno ?? 0})</option>
                    <option value="otkazano">Otkazano ({statusCounts.otkazano ?? 0})</option>
                  </select>
                  <button onClick={fetchOrders} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-sm hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors flex-shrink-0">
                    <ArrowClockwise size={14} />Osveži
                  </button>
                  <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-sm hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors flex-shrink-0" title="Izvezi CSV">
                    <DownloadSimple size={14} />
                    <span className="hidden sm:inline">CSV</span>
                  </button>
                  <button
                    onClick={() => setAddingOrder(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#C9A84C] text-slate-950 font-semibold text-sm hover:bg-[#E8C97A] active:scale-[0.97] transition-all flex-shrink-0"
                  >
                    <Plus size={15} weight="bold" />
                    <span className="sm:inline">Nova narudžbina</span>
                  </button>
                </div>

                {/* Date filter + sort */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="flex gap-1">
                    {(['all', 'today', 'week', 'month'] as const).map(df => (
                      <button key={df} onClick={() => setDateFilter(df)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${dateFilter === df ? 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30' : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                      >
                        {{ all: 'Sve', today: 'Danas', week: '7 dana', month: 'Ovaj mesec' }[df]}
                      </button>
                    ))}
                  </div>
                  <div className="ml-auto flex gap-1">
                    {([
                      ['date',   'Datum'],
                      ['name',   'Ime'],
                      ['status', 'Status'],
                      ...(canAccess(currentUserRole, 'admin') ? [['value', 'Vrednost']] : []),
                    ] as [typeof sortBy, string][]).map(([col, label]) => (
                      <button key={col} onClick={() => toggleSort(col)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${sortBy === col ? 'bg-[var(--bg-raised)] text-[var(--text)] border border-[var(--border-strong)]' : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                      >
                        {label}
                        {sortBy === col && (sortDir === 'desc' ? <CaretDown size={9} /> : <CaretUp size={9} />)}
                      </button>
                    ))}
                  </div>
                </div>

                {fetchError && (
                  <div className="mb-4 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm flex items-center gap-2">
                    <WarningCircle size={15} />{fetchError}
                  </div>
                )}

                {ordersLoading ? (
                  <LoadingSpinner label="Učitavanje narudžbina..." />
                ) : sortedOrders.length === 0 ? (
                  <div className="py-16 text-center text-[var(--text-muted)] text-sm">
                    {searchQuery || statusFilter !== 'all' ? 'Nijedna narudžbina ne odgovara filteru' : 'Nema narudžbina'}
                  </div>
                ) : (
                  <>
                    {/* Mobile: card list */}
                    <div className="space-y-2 md:hidden">
                      {sortedOrders.map(order => (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`p-4 rounded-2xl backdrop-blur-md border hover:border-[#C9A84C]/40 active:scale-[0.99] transition-all cursor-pointer shadow-sm ${selectedIds.has(order.id) ? 'bg-[#C9A84C]/5 border-[#C9A84C]/30' : orderAgingDays(order) >= parseInt(ls('crm-aging-warn', '7'), 10) ? 'bg-amber-500/[0.04] border-amber-500/30 hover:border-amber-500/50' : 'bg-[var(--bg-surface)]/70 border-[var(--border)] hover:bg-[var(--bg-surface)]/90'}`}
                        >
                          <div className="flex items-start gap-2.5 mb-2.5">
                            <div className="flex-shrink-0 pt-0.5" onClick={e => e.stopPropagation()}>
                              <input type="checkbox"
                                checked={selectedIds.has(order.id)}
                                onChange={e => setSelectedIds(prev => { const n = new Set(prev); if (e.target.checked) n.add(order.id); else n.delete(order.id); return n; })}
                                className="w-3.5 h-3.5 accent-[#C9A84C] cursor-pointer"
                              />
                            </div>
                            <div className="flex-1 flex items-start justify-between gap-3 min-w-0">
                              <div className="min-w-0">
                                <div className="font-semibold text-[var(--text)] text-sm leading-tight truncate">{order.customer_name}</div>
                                <div className="text-[var(--text-muted)] text-xs mt-0.5">{order.phone}</div>
                                {(order.town || order.location) && (
                                  <div className="flex items-center gap-1 text-[var(--text-muted)] text-xs mt-0.5">
                                    <MapPin size={10} />{order.town || order.location}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <StatusBadge status={order.status} />
                                <AgingBadge order={order} />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs gap-2">
                            {canAccess(currentUserRole, 'admin')
                              ? <span className="font-mono font-semibold text-[#C9A84C]">{formatRSD(order.total_price)}</span>
                              : <span />}
                            <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                              <select
                                value={order.status}
                                onChange={e => handleOrderEdit(order.id, { status: e.target.value as OrderStatus })}
                                className={`text-[10px] rounded-lg px-1.5 py-1 border focus:outline-none cursor-pointer transition-colors bg-transparent ${ORDER_STATUS_CONFIG[order.status].badge}`}
                              >
                                {ORDER_STATUSES.map(s => <option key={s} value={s}>{ORDER_STATUS_CONFIG[s].label}</option>)}
                              </select>
                              <span className="text-[var(--text-muted)]">{new Date(order.created_at).toLocaleDateString('sr-RS')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop: table */}
                    <div className="hidden md:block rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--bg-surface)]/60 backdrop-blur-md">
                      <div className={`grid gap-4 px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-raised)] text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest sticky top-14 z-10 ${canAccess(currentUserRole, 'admin') ? 'grid-cols-[auto_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto]' : 'grid-cols-[auto_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto]'}`}>
                        <span>
                          <input type="checkbox"
                            checked={sortedOrders.length > 0 && sortedOrders.every(o => selectedIds.has(o.id))}
                            onChange={e => setSelectedIds(e.target.checked ? new Set(sortedOrders.map(o => o.id)) : new Set())}
                            className="w-3.5 h-3.5 accent-[#C9A84C] cursor-pointer"
                          />
                        </span>
                        <span>Klijent</span><span>Kontakt</span><span>Lokacija</span><span>Proizvodi</span>
                        {canAccess(currentUserRole, 'admin') && <span>Vrednost</span>}
                        <span>Status</span><span>Akcija</span>
                      </div>

                      <div className="divide-y divide-[var(--border)]">
                        {sortedOrders.map(order => (
                          <div
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className={`grid gap-4 px-5 py-3.5 items-start hover:bg-[var(--bg-raised)] transition-colors cursor-pointer border-l-2 ${selectedIds.has(order.id) ? 'bg-[#C9A84C]/5 border-l-[#C9A84C]/40' : orderAgingDays(order) >= parseInt(ls('crm-aging-warn', '7'), 10) ? 'border-l-amber-500/60 bg-amber-500/[0.03]' : 'border-l-transparent'} ${canAccess(currentUserRole, 'admin') ? 'grid-cols-[auto_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto]' : 'grid-cols-[auto_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto]'}`}
                          >
                            <div className="flex items-center pt-0.5" onClick={e => e.stopPropagation()}>
                              <input type="checkbox"
                                checked={selectedIds.has(order.id)}
                                onChange={e => setSelectedIds(prev => { const n = new Set(prev); if (e.target.checked) n.add(order.id); else n.delete(order.id); return n; })}
                                className="w-3.5 h-3.5 accent-[#C9A84C] cursor-pointer"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-[var(--text)] text-sm">{order.customer_name}</div>
                              <div className="text-[var(--text-muted)] text-xs mt-0.5">{new Date(order.created_at).toLocaleDateString('sr-RS')}</div>
                            </div>
                            <div>
                              <div className="text-[var(--text)] text-sm">{order.phone}</div>
                              {order.email && <div className="text-[var(--text-muted)] text-xs mt-0.5 truncate">{order.email}</div>}
                            </div>
                            <div>
                              {order.town
                                ? <><div className="text-[var(--text)] text-sm">{order.town}</div>{order.address && <div className="text-[var(--text-muted)] text-xs mt-0.5 truncate">{order.address}</div>}</>
                                : <span className="text-[var(--text-muted)] text-xs">—</span>}
                            </div>
                            <OrderItemsCell items={order.items} />
                            {canAccess(currentUserRole, 'admin') && (
                              <div>
                                <div className="text-[#C9A84C] font-mono font-semibold text-sm">{formatRSD(order.total_price)}</div>
                                <div className="text-[var(--text-muted)] text-xs mt-0.5">{order.payment_method === 'cash_on_delivery' ? 'Pouzećem' : 'Račun'}</div>
                              </div>
                            )}
                            <div className="flex flex-col gap-1">
                              <StatusBadge status={order.status} />
                              <AgingBadge order={order} />
                            </div>
                            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                              <select
                                value={order.status}
                                onChange={e => handleOrderEdit(order.id, { status: e.target.value as OrderStatus })}
                                className={`text-[10px] rounded-lg px-1.5 py-1 border focus:outline-none focus:border-[#C9A84C]/50 cursor-pointer transition-colors bg-transparent ${ORDER_STATUS_CONFIG[order.status].badge}`}
                              >
                                {ORDER_STATUSES.map(s => <option key={s} value={s}>{ORDER_STATUS_CONFIG[s].label}</option>)}
                              </select>
                              <button onClick={() => setSelectedOrder(order)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors flex-shrink-0" title="Otvori detalje">
                                <PencilSimple size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-raised)] text-xs text-[var(--text-muted)] flex items-center justify-between">
                        <span>Prikazano {sortedOrders.length} od {orders.length}</span>
                        {canAccess(currentUserRole, 'admin') && (
                          <span className="text-[#C9A84C] font-semibold font-mono">
                            Ukupno: {formatRSD(sortedOrders.reduce((s, o) => s + o.total_price, 0))}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Bulk action bar ───────────────────────────────────── */}
            <AnimatePresence>
              {selectedIds.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.18 }}
                  className="fixed bottom-20 lg:bottom-6 left-0 right-0 flex justify-center px-4 z-30 pointer-events-none"
                >
                  <div className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl backdrop-blur-xl">
                    <span className="text-[var(--text)] text-sm font-semibold whitespace-nowrap">{selectedIds.size} {selectedIds.size === 1 ? 'izabrana' : 'izabrano'}</span>
                    <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value as OrderStatus)} onClick={e => e.stopPropagation()} className={`${INPUT} w-auto py-1.5 text-xs`}>
                      {ORDER_STATUSES.map(s => <option key={s} value={s}>{ORDER_STATUS_CONFIG[s].label}</option>)}
                    </select>
                    <button onClick={handleBulkStatusChange} disabled={bulkApplying} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#C9A84C] text-slate-950 font-bold text-xs hover:bg-[#E8C97A] transition-colors disabled:opacity-50 whitespace-nowrap">
                      {bulkApplying ? 'Primenjujem...' : 'Primeni'}
                    </button>
                    <button onClick={() => setSelectedIds(new Set())} className="w-7 h-7 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)] transition-colors flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Račun ───────────────────────────────────────────────── */}
            {activeSection === 'racun' && canAccess(currentUserRole, 'manager') && <RacunSection />}

            {/* ── Finance ─────────────────────────────────────────────── */}
            {activeSection === 'finance' && currentUserRole === 'admin' && <FinanceSection />}

            {/* ── Users ───────────────────────────────────────────────── */}
            {activeSection === 'users' && currentUserRole === 'admin' && (
              <UsersSection users={workers} onRefresh={fetchWorkers} />
            )}

            {/* ── Tasks ───────────────────────────────────────────────── */}
            {activeSection === 'tasks' && (
              tasksLoading ? <LoadingSpinner label="Učitavanje zadataka..." /> : (
                <TaskBoard
                  tasks={tasks} workers={workers}
                  canManage={canAccess(currentUserRole, 'manager')}
                  onStatusChange={handleTaskStatusChange}
                  onAddTask={handleAddTask}
                  onDeleteTask={handleDeleteTask}
                  onEditTask={handleEditTask}
                />
              )
            )}

            {/* ── Settings ────────────────────────────────────────────── */}
            {activeSection === 'settings' && canAccess(currentUserRole, 'manager') && <SettingsSection />}
          </div>
        </main>

        {/* ── Mobile Bottom Nav ─────────────────────────────────────────── */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[var(--bg-surface)]/75 backdrop-blur-2xl border-t border-[var(--border)] shadow-[0_-4px_30px_rgba(0,0,0,0.12)]">
          <div className="flex items-center h-16 px-1 max-w-lg mx-auto">
            {navItems.map(({ key, label, Icon }) => {
              const active = activeSection === key;
              const badge = key === 'orders' ? activeOrdersCount : key === 'tasks' ? overdueTasksCount : 0;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSection(key as typeof activeSection)}
                  className="flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors"
                >
                  <div className="relative">
                    <Icon size={22} weight={active ? 'fill' : 'regular'} className={active ? 'text-[#C9A84C]' : 'text-[var(--text-muted)]'} />
                    {badge > 0 && <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center leading-none px-0.5">{badge > 99 ? '99+' : badge}</span>}
                  </div>
                  <span className={`text-[9px] font-semibold ${active ? 'text-[#C9A84C]' : 'text-[var(--text-muted)]'}`}>{label}</span>
                </button>
              );
            })}
            {canAccess(currentUserRole, 'manager') && (
              <button
                onClick={() => setActiveSection('settings')}
                className="flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors"
              >
                <Gear size={22} weight={activeSection === 'settings' ? 'fill' : 'regular'} className={activeSection === 'settings' ? 'text-[#C9A84C]' : 'text-[var(--text-muted)]'} />
                <span className={`text-[9px] font-semibold ${activeSection === 'settings' ? 'text-[#C9A84C]' : 'text-[var(--text-muted)]'}`}>Podešavanja</span>
              </button>
            )}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              disabled={loggingOut}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors disabled:opacity-50"
            >
              <SignOut size={22} className="text-[var(--text-muted)]" />
              <span className="text-[9px] font-semibold text-[var(--text-muted)]">Odjava</span>
            </button>
          </div>
        </nav>

        {/* ── Order Detail Drawer ───────────────────────────────────────── */}
        <AnimatePresence>
          {selectedOrder && (
            <OrderDetailDrawer
              order={selectedOrder}
              userRole={currentUserRole}
              orders={orders}
              tasks={tasks}
              onClose={() => setSelectedOrder(null)}
              onEdit={order => { setSelectedOrder(null); setEditingOrder(order); }}
              onDelete={handleOrderDelete}
              onDuplicate={order => { setSelectedOrder(null); setDuplicatingOrder(order); }}
            />
          )}
        </AnimatePresence>

        {/* ── Edit Modal ────────────────────────────────────────────────── */}
        {editingOrder && (
          <EditOrderModal
            order={editingOrder}
            userRole={currentUserRole}
            onClose={() => setEditingOrder(null)}
            onSave={handleOrderEdit}
          />
        )}

        {/* ── Task Delete Confirm ───────────────────────────────────────── */}
        {confirmTaskId && (
          <ConfirmModal
            title="Obriši zadatak"
            message="Da li ste sigurni da želite da obrišete ovaj zadatak?"
            onConfirm={performDeleteTask}
            onCancel={() => setConfirmTaskId(null)}
          />
        )}

        {/* ── Toasts ────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {errorToast && <ErrorToast message={errorToast} onClose={() => setErrorToast('')} />}
        </AnimatePresence>
        <AnimatePresence>
          {successToast && <SuccessToast message={successToast} onClose={() => setSuccessToast('')} />}
        </AnimatePresence>

        {/* ── Logout Confirm ────────────────────────────────────────────── */}
        {showLogoutConfirm && (
          <ConfirmModal
            title="Odjava"
            message="Da li ste sigurni da se želite odjaviti?"
            confirmLabel="Odjavi se"
            variant="warning"
            onConfirm={handleLogout}
            onCancel={() => setShowLogoutConfirm(false)}
          />
        )}

        {/* ── Add Order Modal ───────────────────────────────────────────── */}
        {addingOrder && (
          <AddOrderModal
            userRole={currentUserRole}
            onClose={() => setAddingOrder(false)}
            onSave={handleNewOrder}
          />
        )}
        {duplicatingOrder && (
          <AddOrderModal
            userRole={currentUserRole}
            initialData={duplicatingOrder}
            onClose={() => setDuplicatingOrder(null)}
            onSave={order => { handleNewOrder(order); setDuplicatingOrder(null); }}
          />
        )}
    </div>
  );
}
