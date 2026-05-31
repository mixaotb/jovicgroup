'use client';

// app/crm/dashboard/page.tsx
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package, CheckSquare, Users, CurrencyDollar, SignOut, ArrowSquareOut,
  Sun, Moon, MagnifyingGlass, ArrowClockwise, PencilSimple, Trash, X,
  Check, Plus, CaretDown, MapPin, Phone, EnvelopeSimple, CalendarBlank,
  CreditCard, Tag, ArrowLeft, WarningCircle, Spinner,
} from '@phosphor-icons/react';
import { formatRSD } from '@/lib/pricing';
import NotificationBell from '@/components/NotificationBell';
import type { Order, Task, OrderStatus, TaskStatus, User, UserRole, FinanceData } from '@/types';

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

// ─── Shared CSS helpers ───────────────────────────────────────────────────────

const INPUT = 'w-full px-3 py-2 rounded-xl bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors placeholder:text-[var(--text-muted)]';
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

// ─── OrderDetailDrawer ────────────────────────────────────────────────────────

function OrderDetailDrawer({
  order, userRole, onClose, onEdit, onDelete,
}: {
  order: Order; userRole: UserRole | null;
  onClose: () => void; onEdit: (o: Order) => void; onDelete: (id: string) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Obrisati narudžbinu klijenta "${order.customer_name}"?`)) return;
    setDeleting(true);
    await onDelete(order.id);
    setDeleting(false);
  }

  return (
    <>
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
            <div className="text-[var(--text-muted)] text-xs">
              {new Date(order.created_at).toLocaleDateString('sr-RS', { day: '2-digit', month: 'long', year: 'numeric' })}
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
                <a href={`tel:${order.phone}`} className="text-sm text-[var(--text)] hover:text-[#C9A84C] transition-colors">{order.phone}</a>
              </div>
              {order.email && (
                <div className="flex items-center gap-2.5">
                  <EnvelopeSimple size={13} className="text-[var(--text-muted)] flex-shrink-0" />
                  <a href={`mailto:${order.email}`} className="text-sm text-[var(--text)] hover:text-[#C9A84C] transition-colors truncate">{order.email}</a>
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
            Uredi narudžbinu
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

// ─── TaskBoard ────────────────────────────────────────────────────────────────

function TaskBoard({
  tasks, workers, canManage, onStatusChange, onAddTask, onDeleteTask,
}: {
  tasks: Task[]; workers: User[]; canManage: boolean;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onAddTask: (title: string, desc: string, assignedTo: string, dueDate: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}) {
  const [showAdd, setShowAdd] = useState(false);
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
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-[var(--text)]">Zadaci</h2>
        {canManage && (
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] text-sm font-semibold hover:bg-[#C9A84C]/20 transition-colors">
            <Plus size={14} weight="bold" />
            Novi zadatak
          </button>
        )}
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

      <div className="grid md:grid-cols-3 gap-4">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.status);
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
                {colTasks.map(task => (
                  <div key={task.id} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] hover:border-[var(--border-strong)] transition-colors group">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[var(--text)] text-sm font-medium leading-snug">{task.title}</span>
                      {canManage && (
                        <button onClick={() => onDeleteTask(task.id)} className="text-[var(--text-muted)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                          <Trash size={13} />
                        </button>
                      )}
                    </div>
                    {task.description && <p className="text-[var(--text-muted)] text-xs mb-2 leading-relaxed">{task.description}</p>}
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <div className="text-[var(--text-muted)] text-xs flex items-center gap-1.5">
                        {task.users && <span>{task.users.full_name || task.users.email?.split('@')[0]}</span>}
                        {task.due_date && <span>· {new Date(task.due_date).toLocaleDateString('sr-RS')}</span>}
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
                ))}
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

  async function handleDelete(u: User) {
    if (!confirm(`Obrisati korisnika ${u.full_name || u.email}?`)) return;
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Greška pri brisanju'); return; }
      await onRefresh();
    } catch { alert('Greška pri brisanju korisnika'); }
  }

  const ROLE_CONFIG: Record<UserRole, { label: string; cls: string }> = {
    admin:   { label: 'Admin',     cls: 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30' },
    manager: { label: 'Menadžer', cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
    worker:  { label: 'Radnik',   cls: 'bg-[var(--bg-raised)] text-[var(--text-muted)]' },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-[var(--text)]">Korisnici</h2>
        <button onClick={() => { setShowAdd(!showAdd); setAddErr(''); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] text-sm font-semibold hover:bg-[#C9A84C]/20 transition-colors">
          <Plus size={14} weight="bold" />
          Novi korisnik
        </button>
      </div>

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
  window_single: 'Jednokrilni prozor', window_double: 'Dvokrilni prozor', door: 'Vrata',
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
  const [activeSection, setActiveSection] = useState<'orders' | 'tasks' | 'users' | 'finance'>('orders');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
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

  const handleOrderEdit = useCallback(async (id: string, updates: Partial<Order>) => {
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...data.order } : o));
      setEditingOrder(null);
    } catch { alert('Greška pri ažuriranju narudžbine'); }
  }, []);

  const handleOrderDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setOrders(prev => prev.filter(o => o.id !== id));
      setSelectedOrder(null);
    } catch { alert('Greška pri brisanju narudžbine'); }
  }, []);

  const handleTaskStatusChange = useCallback(async (id: string, status: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (!res.ok) throw new Error();
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    } catch { alert('Greška pri ažuriranju zadatka'); }
  }, []);

  const handleAddTask = useCallback(async (title: string, description: string, assignedTo: string, dueDate: string) => {
    try {
      const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description, assigned_to: assignedTo || null, due_date: dueDate || null }) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTasks(prev => [data.task, ...prev]);
    } catch { alert('Greška pri dodavanju zadatka'); }
  }, []);

  const handleDeleteTask = useCallback(async (id: string) => {
    if (!confirm('Obrisati zadatak?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch { alert('Greška pri brisanju zadatka'); }
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/crm/login');
  }

  const filteredOrders = orders.filter(o => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return o.customer_name.toLowerCase().includes(q) || o.phone.includes(q) || (o.email || '').toLowerCase().includes(q);
  });

  // ── Nav items ────────────────────────────────────────────────────────────────
  const navItems = ([
    { key: 'orders',  label: 'Narudžbine', minRole: 'manager' as UserRole, Icon: Package },
    { key: 'tasks',   label: 'Zadaci',     minRole: 'worker'  as UserRole, Icon: CheckSquare },
    { key: 'users',   label: 'Korisnici',  minRole: 'admin'   as UserRole, Icon: Users },
    { key: 'finance', label: 'Finansije',  minRole: 'admin'   as UserRole, Icon: CurrencyDollar },
  ] as const).filter(item => canAccess(currentUserRole, item.minRole));

  const sectionTitle = { orders: 'Narudžbine', tasks: 'Zadaci', users: 'Korisnici', finance: 'Finansije' }[activeSection];

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
            <div className="w-7 h-7 relative flex-shrink-0">
              <Image src="/logo.png" alt="Jović Group" width={28} height={28} className="object-contain" />
            </div>
            <span className="font-display text-sm font-bold text-[var(--text)]">
              Jović <span className="text-[#C9A84C]">CRM</span>
            </span>
          </div>

          <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
            {navItems.map(({ key, label, Icon }) => {
              const active = activeSection === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSection(key as typeof activeSection)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${active ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)]'}`}
                >
                  <Icon size={16} weight={active ? 'fill' : 'regular'} />
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="px-2.5 pb-4 pt-2 border-t border-[var(--border)] space-y-0.5 flex-shrink-0">
            <a href="/" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)] transition-colors">
              <ArrowSquareOut size={16} />Sajt
            </a>
            <button onClick={handleLogout} disabled={loggingOut} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50">
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
                onOrderClick={(orderId) => {
                  setActiveSection('orders');
                  const o = orders.find(x => x.id === orderId);
                  if (o) setSelectedOrder(o);
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
                <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
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
                    <option value="all">Svi statusi</option>
                    <option value="na_cekanju">Na čekanju</option>
                    <option value="u_proizvodnji">U proizvodnji</option>
                    <option value="isporuceno">Isporučeno</option>
                    <option value="otkazano">Otkazano</option>
                  </select>
                  <button onClick={fetchOrders} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-sm hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors flex-shrink-0">
                    <ArrowClockwise size={14} />Osveži
                  </button>
                </div>

                {fetchError && (
                  <div className="mb-4 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm flex items-center gap-2">
                    <WarningCircle size={15} />{fetchError}
                  </div>
                )}

                {ordersLoading ? (
                  <LoadingSpinner label="Učitavanje narudžbina..." />
                ) : filteredOrders.length === 0 ? (
                  <div className="py-16 text-center text-[var(--text-muted)] text-sm">
                    {searchQuery || statusFilter !== 'all' ? 'Nijedna narudžbina ne odgovara filteru' : 'Nema narudžbina'}
                  </div>
                ) : (
                  <>
                    {/* Mobile: card list */}
                    <div className="space-y-2 md:hidden">
                      {filteredOrders.map(order => (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className="p-4 rounded-2xl bg-[var(--bg-surface)]/70 backdrop-blur-md border border-[var(--border)] hover:border-[#C9A84C]/40 hover:bg-[var(--bg-surface)]/90 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="min-w-0">
                              <div className="font-semibold text-[var(--text)] text-sm leading-tight truncate">{order.customer_name}</div>
                              <div className="text-[var(--text-muted)] text-xs mt-0.5">{order.phone}</div>
                              {(order.town || order.location) && (
                                <div className="flex items-center gap-1 text-[var(--text-muted)] text-xs mt-0.5">
                                  <MapPin size={10} />{order.town || order.location}
                                </div>
                              )}
                            </div>
                            <StatusBadge status={order.status} />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            {canAccess(currentUserRole, 'admin')
                              ? <span className="font-mono font-semibold text-[#C9A84C]">{formatRSD(order.total_price)}</span>
                              : <span />}
                            <span className="text-[var(--text-muted)]">{new Date(order.created_at).toLocaleDateString('sr-RS')}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop: table */}
                    <div className="hidden md:block rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--bg-surface)]/60 backdrop-blur-md">
                      <div className={`grid gap-4 px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-raised)] text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest ${canAccess(currentUserRole, 'admin') ? 'grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto]' : 'grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto]'}`}>
                        <span>Klijent</span><span>Kontakt</span><span>Lokacija</span><span>Proizvodi</span>
                        {canAccess(currentUserRole, 'admin') && <span>Vrednost</span>}
                        <span>Status</span><span>Akcija</span>
                      </div>

                      <div className="divide-y divide-[var(--border)]">
                        {filteredOrders.map(order => (
                          <div
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className={`grid gap-4 px-5 py-3.5 items-start hover:bg-[var(--bg-raised)] transition-colors cursor-pointer ${canAccess(currentUserRole, 'admin') ? 'grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto]' : 'grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto]'}`}
                          >
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
                            <div><StatusBadge status={order.status} /></div>
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              {order.status !== 'isporuceno' && order.status !== 'otkazano' && (
                                <button onClick={() => handleOrderEdit(order.id, { status: 'isporuceno' })} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors" title="Označi kao isporučeno">
                                  <Check size={13} weight="bold" />
                                </button>
                              )}
                              <button onClick={() => setSelectedOrder(order)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors" title="Otvori detalje">
                                <PencilSimple size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-raised)] text-xs text-[var(--text-muted)] flex items-center justify-between">
                        <span>Prikazano {filteredOrders.length} od {orders.length}</span>
                        {canAccess(currentUserRole, 'admin') && (
                          <span className="text-[#C9A84C] font-semibold font-mono">
                            Ukupno: {formatRSD(filteredOrders.reduce((s, o) => s + o.total_price, 0))}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

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
                />
              )
            )}
          </div>
        </main>

        {/* ── Mobile Bottom Nav ─────────────────────────────────────────── */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[var(--bg-surface)]/75 backdrop-blur-2xl border-t border-[var(--border)] shadow-[0_-4px_30px_rgba(0,0,0,0.12)]">
          <div className="flex items-center h-16 px-1 max-w-lg mx-auto">
            {navItems.map(({ key, label, Icon }) => {
              const active = activeSection === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSection(key as typeof activeSection)}
                  className="flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors"
                >
                  <Icon size={22} weight={active ? 'fill' : 'regular'} className={active ? 'text-[#C9A84C]' : 'text-[var(--text-muted)]'} />
                  <span className={`text-[9px] font-semibold ${active ? 'text-[#C9A84C]' : 'text-[var(--text-muted)]'}`}>{label}</span>
                </button>
              );
            })}
            <button
              onClick={handleLogout}
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
              onClose={() => setSelectedOrder(null)}
              onEdit={order => { setSelectedOrder(null); setEditingOrder(order); }}
              onDelete={handleOrderDelete}
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
    </div>
  );
}
