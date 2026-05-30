'use client';

// app/crm/dashboard/page.tsx
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatRSD } from '@/lib/pricing';
import NotificationBell from '@/components/NotificationBell';
import type { Order, Task, OrderStatus, TaskStatus, User, UserRole, FinanceData } from '@/types';

// ─── Status helpers ───────────────────────────────────────────────────────────

const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string; dotClass: string }
> = {
  na_cekanju: {
    label: 'Na čekanju',
    className: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
  u_proizvodnji: {
    label: 'U proizvodnji',
    className: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    dotClass: 'bg-blue-400',
  },
  isporuceno: {
    label: 'Isporučeno',
    className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    dotClass: 'bg-emerald-400',
  },
  otkazano: {
    label: 'Otkazano',
    className: 'bg-red-500/15 text-red-400 border border-red-500/30',
    dotClass: 'bg-red-400',
  },
};

const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  todo: { label: 'Čeka', className: 'bg-slate-700/60 text-slate-400' },
  in_progress: { label: 'U toku', className: 'bg-blue-500/15 text-blue-400' },
  done: { label: 'Završeno', className: 'bg-emerald-500/15 text-emerald-400' },
};

const ORDER_STATUSES: OrderStatus[] = [
  'na_cekanju',
  'u_proizvodnji',
  'isporuceno',
  'otkazano',
];

// Product type label helper
function getProductLabel(type: string): string {
  return type === 'window_single' ? 'Jednokrilni prozor' :
    type === 'window_double' ? 'Dvokrilni prozor' : 'Vrata';
}

// ─── Role helper ──────────────────────────────────────────────────────────────

const ROLE_RANKS: Record<UserRole, number> = { worker: 1, manager: 2, admin: 3 };
function canAccess(role: UserRole | null, minRole: UserRole): boolean {
  if (!role) return false;
  return ROLE_RANKS[role] >= ROLE_RANKS[minRole];
}

// ─── Edit Order Modal ─────────────────────────────────────────────────────────

function EditOrderModal({
  order,
  userRole,
  onClose,
  onSave,
}: {
  order: Order;
  userRole: UserRole | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Order>) => Promise<void>;
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
    setSaving(true);
    setError('');
    await onSave(order.id, {
      customer_name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      town: town.trim() || undefined,
      address: address.trim() || undefined,
      total_price: Number(price) || 0,
      payment_method: paymentMethod,
      status,
      notes: notes.trim() || undefined,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0E1625] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="font-display text-base font-bold text-white">Uredi narudžbinu</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Klijent */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1.5">Ime klijenta *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1.5">Telefon *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
            />
          </div>

          {/* Lokacija */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1.5">Grad / Opština</label>
              <input
                type="text"
                value={town}
                onChange={(e) => setTown(e.target.value)}
                placeholder="npr. Beograd"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors placeholder-slate-600"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1.5">Adresa</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="npr. Ulica i broj"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors placeholder-slate-600"
              />
            </div>
          </div>

          {/* Vrednost i plaćanje — admin only */}
          {canAccess(userRole, 'admin') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs font-medium block mb-1.5">Cena (RSD)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors [appearance:textfield]"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium block mb-1.5">Način plaćanja</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as Order['payment_method'])}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
                >
                  <option value="cash_on_delivery">Pouzećem</option>
                  <option value="racun">Račun</option>
                </select>
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{ORDER_STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>

          {/* Napomena */}
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1.5">Napomena</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Dodatne napomene..."
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors placeholder-slate-600 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-[#C9A84C] text-slate-950 font-bold text-sm hover:bg-[#E8C97A] transition-colors disabled:opacity-50"
            >
              {saving ? 'Čuvanje...' : 'Sačuvaj'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-400 font-medium text-sm hover:border-slate-600 transition-colors"
            >
              Otkaži
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = ORDER_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  );
}

// Expandable items cell for orders with multiple items
function OrderItemsCell({ items }: { items: Order['items'] }) {
  const [expanded, setExpanded] = useState(false);

  if (!items || items.length === 0) {
    return <div className="text-slate-600 text-xs">—</div>;
  }

  const totalPieces = items.reduce((sum, it) => sum + it.quantity, 0);

  if (items.length === 1) {
    const item = items[0];
    return (
      <div>
        <div className="text-slate-300 text-xs leading-tight">
          {getProductLabel(item.type)}
        </div>
        <div className="text-slate-500 text-xs mt-0.5">
          {item.material} · {item.width}×{item.height}mm
        </div>
        {item.quantity > 1 && (
          <div className="text-slate-600 text-xs">{item.quantity} kom</div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-slate-300 text-xs leading-tight hover:text-white transition-colors flex items-center gap-1"
      >
        <span className="font-medium">{items.length} stavki</span>
        <span className="text-slate-600">· {totalPieces} kom</span>
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          className={`w-3 h-3 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5 pl-2 border-l border-slate-700">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="text-xs">
              <div className="text-slate-400">{getProductLabel(item.type)}</div>
              <div className="text-slate-600">
                {item.material} · {item.width}×{item.height}mm · {item.quantity} kom
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  sub,
  icon,
  accent,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="p-5 rounded-2xl border border-slate-800 bg-[#0E1625] relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-[48px] opacity-10 ${accent}`} />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div className="text-slate-500 text-xs font-medium mb-3 uppercase tracking-widest">{title}</div>
          <div className="font-display text-2xl font-bold text-white">{value}</div>
          <div className="text-slate-500 text-xs mt-1">{sub}</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Task Board ───────────────────────────────────────────────────────────────

function TaskBoard({
  tasks,
  workers,
  canManage,
  onStatusChange,
  onAddTask,
  onDeleteTask,
}: {
  tasks: Task[];
  workers: User[];
  canManage: boolean;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onAddTask: (title: string, description: string, assignedTo: string, dueDate: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssigned, setNewAssigned] = useState('');
  const [newDue, setNewDue] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const columns: { status: TaskStatus; label: string }[] = [
    { status: 'todo', label: 'Čeka' },
    { status: 'in_progress', label: 'U toku' },
    { status: 'done', label: 'Završeno' },
  ];

  async function handleAdd() {
    if (!newTitle.trim()) {
      setAddError('Unesite naslov zadatka');
      return;
    }
    setAdding(true);
    setAddError('');
    await onAddTask(newTitle.trim(), newDesc.trim(), newAssigned, newDue);
    setNewTitle('');
    setNewDesc('');
    setNewAssigned('');
    setNewDue('');
    setShowAdd(false);
    setAdding(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-bold text-white">Zadaci</h2>
        {canManage && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] text-sm font-semibold hover:bg-[#C9A84C]/20 transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z" />
            </svg>
            Novi zadatak
          </button>
        )}
      </div>

      {showAdd && (
        <div className="mb-5 p-5 rounded-xl border border-slate-700 bg-slate-900/50">
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1.5">Naslov *</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="npr. Ugradnja prozora, Beograd"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors placeholder-slate-600"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1.5">Dodeliti radniku</label>
              <select
                value={newAssigned}
                onChange={(e) => setNewAssigned(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
              >
                <option value="">— Izaberi radnika —</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.full_name || w.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1.5">Opis</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Detalji zadatka..."
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors placeholder-slate-600"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1.5">Rok</label>
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors [color-scheme:dark]"
              />
            </div>
          </div>
          {addError && <p className="text-red-400 text-xs mb-2">{addError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="px-4 py-2 rounded-lg bg-[#C9A84C] text-slate-950 font-bold text-sm hover:bg-[#E8C97A] transition-colors disabled:opacity-50"
            >
              {adding ? 'Čuvanje...' : 'Sačuvaj'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setAddError(''); }}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 font-medium text-sm hover:border-slate-600 transition-colors"
            >
              Otkaži
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          const cfg = TASK_STATUS_CONFIG[col.status];
          return (
            <div key={col.status} className="rounded-xl border border-slate-800 bg-[#0E1625] overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
                  {col.label}
                </span>
                <span className="text-slate-600 text-xs">{colTasks.length}</span>
              </div>

              <div className="p-3 space-y-2 min-h-[160px]">
                {colTasks.length === 0 && (
                  <div className="text-center text-slate-700 text-sm py-8">
                    Nema zadataka
                  </div>
                )}
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg border border-slate-700/60 bg-slate-800/30 hover:border-slate-600 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-slate-200 text-sm font-medium leading-snug">
                        {task.title}
                      </span>
                      {canManage && (
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                        >
                          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 000 1.5h.3l.815 8.15A1.5 1.5 0 005.357 15h5.285a1.5 1.5 0 001.493-1.35l.815-8.15h.3a.75.75 0 000-1.5H11v-.75A2.25 2.25 0 008.75 1h-1.5A2.25 2.25 0 005 3.25zm2.25-.75a.75.75 0 00-.75.75V4h3v-.75a.75.75 0 00-.75-.75h-1.5zM6.05 6a.75.75 0 01.787.713l.275 5.5a.75.75 0 01-1.498.075l-.275-5.5A.75.75 0 016.05 6zm3.9 0a.75.75 0 01.712.787l-.275 5.5a.75.75 0 01-1.498-.075l.275-5.5a.75.75 0 01.786-.711z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-slate-500 text-xs mb-2 leading-relaxed">{task.description}</p>
                    )}

                    <div className="flex items-center justify-between mt-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        {task.users && (
                          <span className="text-slate-500 text-xs">
                            {task.users.full_name || task.users.email?.split('@')[0]}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="text-slate-600 text-xs">
                            · {new Date(task.due_date).toLocaleDateString('sr-RS')}
                          </span>
                        )}
                      </div>

                      <select
                        value={task.status}
                        onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                        className="text-xs bg-slate-700 border border-slate-600 text-slate-300 rounded-md px-1.5 py-0.5 focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
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

// ─── Users Section ───────────────────────────────────────────────────────────

function UsersSection({
  users,
  onRefresh,
}: {
  users: User[];
  onRefresh: () => Promise<void>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // ── Add user form state ──────────────────────────────────────────────────
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('worker');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  async function handleAdd() {
    if (!addEmail.trim()) { setAddError('Email je obavezan'); return; }
    if (addPassword.length < 6) { setAddError('Lozinka mora imati najmanje 6 karaktera'); return; }
    setAdding(true);
    setAddError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail.trim(), password: addPassword, full_name: addName.trim() || undefined, role: addRole }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || 'Greška pri kreiranju korisnika'); return; }
      setAddName(''); setAddEmail(''); setAddPassword(''); setAddRole('worker');
      setShowAdd(false);
      await onRefresh();
    } catch {
      setAddError('Greška pri kreiranju korisnika');
    } finally {
      setAdding(false);
    }
  }

  // ── Edit user form state ──────────────────────────────────────────────────
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('worker');
  const [editPassword, setEditPassword] = useState('');
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');

  function openEdit(u: User) {
    setEditName(u.full_name || '');
    setEditRole(u.role);
    setEditPassword('');
    setEditError('');
    setEditingUser(u);
  }

  async function handleEdit() {
    if (!editingUser) return;
    if (editPassword && editPassword.length < 6) { setEditError('Lozinka mora imati najmanje 6 karaktera'); return; }
    setEditing(true);
    setEditError('');
    try {
      const body: Record<string, unknown> = { full_name: editName.trim() || null, role: editRole };
      if (editPassword) body.password = editPassword;
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || 'Greška'); return; }
      setEditingUser(null);
      await onRefresh();
    } catch {
      setEditError('Greška pri čuvanju');
    } finally {
      setEditing(false);
    }
  }

  async function handleDelete(u: User) {
    if (!confirm(`Obrisati korisnika ${u.full_name || u.email}?`)) return;
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Greška pri brisanju');
        return;
      }
      await onRefresh();
    } catch {
      alert('Greška pri brisanju korisnika');
    }
  }

  const ROLE_CONFIG: Record<UserRole, { label: string; className: string }> = {
    admin: { label: 'Admin', className: 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30' },
    manager: { label: 'Menadžer', className: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
    worker: { label: 'Radnik', className: 'bg-slate-700/60 text-slate-300' },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-bold text-white">Korisnici</h2>
        <button
          onClick={() => { setShowAdd(!showAdd); setAddError(''); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] text-sm font-semibold hover:bg-[#C9A84C]/20 transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
            <path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z" />
          </svg>
          Novi korisnik
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mb-5 p-5 rounded-xl border border-slate-700 bg-slate-900/50">
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1.5">Ime i prezime</label>
              <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="npr. Marko Jović" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors placeholder-slate-600" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1.5">Email *</label>
              <input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="korisnik@email.com" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors placeholder-slate-600" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1.5">Lozinka *</label>
              <input type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} placeholder="Min. 6 karaktera" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors placeholder-slate-600" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1.5">Rola</label>
              <select value={addRole} onChange={(e) => setAddRole(e.target.value as UserRole)} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors">
                <option value="worker">Radnik</option>
                <option value="manager">Menadžer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          {addError && <p className="text-red-400 text-xs mb-2">{addError}</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={adding} className="px-4 py-2 rounded-lg bg-[#C9A84C] text-slate-950 font-bold text-sm hover:bg-[#E8C97A] transition-colors disabled:opacity-50">
              {adding ? 'Kreiranje...' : 'Kreiraj'}
            </button>
            <button onClick={() => { setShowAdd(false); setAddError(''); }} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 font-medium text-sm hover:border-slate-600 transition-colors">
              Otkaži
            </button>
          </div>
        </div>
      )}

      {/* User table */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden">
        <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_auto] gap-4 px-5 py-3 border-b border-slate-800 bg-slate-900/50 text-xs font-semibold text-slate-500 uppercase tracking-widest">
          <span>Ime</span>
          <span>Email</span>
          <span>Rola</span>
          <span>Akcija</span>
        </div>

        {users.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">Nema korisnika</div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {users.map((u) => (
              <div key={u.id} className="md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_auto] gap-4 px-5 py-4 items-center hover:bg-slate-900/30 transition-colors">
                <div className="font-medium text-white text-sm">{u.full_name || <span className="text-slate-500 italic">Bez imena</span>}</div>
                <div className="text-slate-400 text-sm">{u.email}</div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_CONFIG[u.role].className}`}>
                    {ROLE_CONFIG[u.role].label}
                  </span>
                </div>
                <div className="flex items-center gap-3 justify-end">
                  <button onClick={() => openEdit(u)} className="text-slate-500 hover:text-[#C9A84C] transition-colors" title="Uredi">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.25.25 0 00.108-.064z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(u)} className="text-slate-500 hover:text-red-400 transition-colors" title="Obriši">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 000 1.5h.3l.815 8.15A1.5 1.5 0 005.357 15h5.285a1.5 1.5 0 001.493-1.35l.815-8.15h.3a.75.75 0 000-1.5H11v-.75A2.25 2.25 0 008.75 1h-1.5A2.25 2.25 0 005 3.25zm2.25-.75a.75.75 0 00-.75.75V4h3v-.75a.75.75 0 00-.75-.75h-1.5zM6.05 6a.75.75 0 01.787.713l.275 5.5a.75.75 0 01-1.498.075l-.275-5.5A.75.75 0 016.05 6zm3.9 0a.75.75 0 01.712.787l-.275 5.5a.75.75 0 01-1.498-.075l.275-5.5a.75.75 0 01.786-.711z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
          <div className="relative w-full max-w-sm bg-[#0E1625] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="font-display text-base font-bold text-white">Uredi korisnika</h2>
              <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-white transition-colors">
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div>
                <label className="text-slate-400 text-xs font-medium block mb-1.5">Ime i prezime</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium block mb-1.5">Rola</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors">
                  <option value="worker">Radnik</option>
                  <option value="manager">Menadžer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium block mb-1.5">Nova lozinka <span className="text-slate-600">(ostavi prazno da ne menjаš)</span></label>
                <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Min. 6 karaktera" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors placeholder-slate-600" />
              </div>
              {editError && <p className="text-red-400 text-xs">{editError}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={handleEdit} disabled={editing} className="flex-1 py-2.5 rounded-lg bg-[#C9A84C] text-slate-950 font-bold text-sm hover:bg-[#E8C97A] transition-colors disabled:opacity-50">
                  {editing ? 'Čuvanje...' : 'Sačuvaj'}
                </button>
                <button onClick={() => setEditingUser(null)} className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-400 font-medium text-sm hover:border-slate-600 transition-colors">
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

// ─── Finance Section ─────────────────────────────────────────────────────────

const PRODUCT_LABELS: Record<string, string> = {
  window_single: 'Jednokrilni prozor',
  window_double: 'Dvokrilni prozor',
  door: 'Vrata',
};

function FinanceSection() {
  const [period, setPeriod] = useState<'month' | 'year' | 'all'>('year');
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/finance?period=${period}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError('Greška pri učitavanju'))
      .finally(() => setLoading(false));
  }, [period]);

  const PERIOD_LABELS = { month: 'Ovaj mesec', year: 'Ova godina', all: 'Sve vreme' };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 text-sm">
        <svg className="animate-spin w-6 h-6 mx-auto mb-3 text-[#C9A84C]/50" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Učitavanje finansija...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>
    );
  }

  if (!data) return null;

  const { summary, byStatus, byProductType, byMaterial, byPaymentMethod, byLocation, monthlyTrend } = data;

  const maxTrendRevenue = Math.max(...monthlyTrend.map(m => m.revenue), 1);

  const STATUS_META: Record<string, { label: string; color: string }> = {
    na_cekanju: { label: 'Na čekanju', color: 'bg-amber-400' },
    u_proizvodnji: { label: 'U proizvodnji', color: 'bg-blue-400' },
    isporuceno: { label: 'Isporučeno', color: 'bg-emerald-400' },
    otkazano: { label: 'Otkazano', color: 'bg-red-400' },
  };

  const totalOrders = summary.totalOrdersCount;

  return (
    <div className="space-y-6">
      {/* Header + period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-xl font-bold text-white">Finansijski pregled</h2>
        <div className="flex gap-1 p-1 rounded-xl bg-slate-800/60 border border-slate-700">
          {(['month', 'year', 'all'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                period === p
                  ? 'bg-[#C9A84C] text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-[#0E1625] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-[48px] opacity-10 bg-[#C9A84C]" />
          <div className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-widest">Prihod</div>
          <div className="font-display text-2xl font-bold text-[#C9A84C]">{formatRSD(summary.totalRevenue)}</div>
          <div className="text-slate-500 text-xs mt-1">{summary.deliveredCount} isporučenih narudžbina</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-[#0E1625] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-[48px] opacity-10 bg-red-500" />
          <div className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-widest">Trošak materijala</div>
          <div className="font-display text-2xl font-bold text-red-400">{formatRSD(summary.materialCost)}</div>
          <div className="text-slate-500 text-xs mt-1">
            {summary.totalRevenue > 0 ? Math.round((summary.materialCost / summary.totalRevenue) * 100) : 0}% od prihoda
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-[#0E1625] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-[48px] opacity-10 bg-emerald-500" />
          <div className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-widest">Bruto profit</div>
          <div className="font-display text-2xl font-bold text-emerald-400">{formatRSD(summary.grossProfit)}</div>
          <div className="text-slate-500 text-xs mt-1">Prihod − trošak materijala</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-[#0E1625] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-[48px] opacity-10 bg-blue-500" />
          <div className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-widest">Marža</div>
          <div className="font-display text-2xl font-bold text-blue-400">{summary.marginPercent}%</div>
          <div className="text-slate-500 text-xs mt-1">
            Na čekanju: {formatRSD(summary.pendingRevenue)}
          </div>
        </div>
      </div>

      {/* Monthly trend + Status breakdown */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Monthly bar chart */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-[#0E1625]">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">Mesečni prihod (12 meseci)</div>
          <div className="flex items-end gap-1.5 h-32">
            {monthlyTrend.map(m => (
              <div key={m.yearMonth} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`${m.month}: ${formatRSD(m.revenue)} (${m.orders} nar.)`}>
                <div className="w-full flex flex-col justify-end h-full gap-px">
                  {m.revenue > 0 && (
                    <div
                      className="w-full rounded-t bg-[#C9A84C]/30 border-t border-[#C9A84C]/40 transition-all"
                      style={{ height: `${Math.max(4, (m.revenue / maxTrendRevenue) * 100)}%` }}
                    />
                  )}
                  {m.revenue === 0 && (
                    <div className="w-full h-1 rounded bg-slate-800" />
                  )}
                </div>
                <span className="text-[9px] text-slate-600 leading-none">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
            <span>0</span>
            <span>{formatRSD(maxTrendRevenue)}</span>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-[#0E1625]">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">Raspodela narudžbina</div>
          <div className="space-y-3">
            {(['isporuceno', 'u_proizvodnji', 'na_cekanju', 'otkazano'] as const).map(s => {
              const stat = byStatus[s];
              if (!stat) return null;
              const meta = STATUS_META[s];
              const pct = totalOrders > 0 ? Math.round((stat.count / totalOrders) * 100) : 0;
              return (
                <div key={s}>
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${meta.color}`} />
                      <span className="text-slate-300">{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                      <span>{stat.count} nar.</span>
                      <span className="text-slate-300 font-mono">{formatRSD(stat.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${meta.color} opacity-70`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {summary.cancelledValue > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-600">
              Izgubljeno (otkazano): <span className="text-red-500/70">{formatRSD(summary.cancelledValue)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Product type breakdown */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-[#0E1625]">
        <div className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">Raspodela po tipu proizvoda (isporučeno)</div>
        {Object.keys(byProductType).length === 0 ? (
          <div className="text-slate-600 text-sm py-4 text-center">Nema podataka</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-600 text-xs uppercase tracking-widest">
                  <th className="text-left pb-3 font-semibold">Tip</th>
                  <th className="text-right pb-3 font-semibold">Komada</th>
                  <th className="text-right pb-3 font-semibold">Kalk. vrednost</th>
                  <th className="text-right pb-3 font-semibold">Trošak mat.</th>
                  <th className="text-right pb-3 font-semibold">Marža</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {Object.entries(byProductType).map(([type, stat]) => {
                  const margin = stat.calcRevenue > 0
                    ? Math.round(((stat.calcRevenue - stat.cost) / stat.calcRevenue) * 100)
                    : 0;
                  return (
                    <tr key={type} className="text-slate-300">
                      <td className="py-3">{PRODUCT_LABELS[type] || type}</td>
                      <td className="text-right py-3 font-mono text-slate-400">{stat.units}</td>
                      <td className="text-right py-3 font-mono text-[#C9A84C]">{formatRSD(stat.calcRevenue)}</td>
                      <td className="text-right py-3 font-mono text-red-400">{formatRSD(stat.cost)}</td>
                      <td className="text-right py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-slate-700 text-xs mt-3">* Kalk. vrednost je cena po formuli, ne konačna cena narudžbine</p>
      </div>

      {/* Bottom row: Material | Payment | Location */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Material split */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-[#0E1625]">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">Materijal</div>
          {Object.keys(byMaterial).length === 0 ? (
            <div className="text-slate-600 text-sm">Nema podataka</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(byMaterial).map(([mat, stat]) => {
                const total = Object.values(byMaterial).reduce((s, m) => s + m.units, 0);
                const pct = total > 0 ? Math.round((stat.units / total) * 100) : 0;
                return (
                  <div key={mat}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-semibold">{mat}</span>
                      <span className="text-slate-500">{stat.units} kom · {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${mat === 'PVC' ? 'bg-blue-400' : 'bg-violet-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Trošak: {formatRSD(stat.cost)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment method */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-[#0E1625]">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">Način plaćanja</div>
          {Object.keys(byPaymentMethod).length === 0 ? (
            <div className="text-slate-600 text-sm">Nema podataka</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(byPaymentMethod).map(([pm, stat]) => {
                const total = Object.values(byPaymentMethod).reduce((s, v) => s + v.count, 0);
                const pct = total > 0 ? Math.round((stat.count / total) * 100) : 0;
                const label = pm === 'cash_on_delivery' ? 'Pouzećem' : 'Račun';
                return (
                  <div key={pm}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-300">{label}</span>
                      <span className="text-slate-500">{stat.count} nar. · {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${pm === 'cash_on_delivery' ? 'bg-amber-400' : 'bg-cyan-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-600 mt-1">{formatRSD(stat.revenue)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-[#0E1625]">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">Lokacija dostave</div>
          {Object.keys(byLocation).length === 0 ? (
            <div className="text-slate-600 text-sm">Nema podataka</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(byLocation).map(([loc, stat]) => {
                const total = Object.values(byLocation).reduce((s, v) => s + v.count, 0);
                const pct = total > 0 ? Math.round((stat.count / total) * 100) : 0;
                return (
                  <div key={loc}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-300">{loc}</span>
                      <span className="text-slate-500">{stat.count} nar. · {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${loc === 'Srbija' ? 'bg-emerald-400' : 'bg-orange-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-600 mt-1">{formatRSD(stat.revenue)}</div>
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

  const [loggingOut, setLoggingOut] = useState(false);

  // ── Fetch orders ──────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('pageSize', '100');

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.status === 401) {
        router.push('/crm/login');
        return;
      }
      if (!res.ok) throw new Error('Greška pri učitavanju narudžbina');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setOrdersLoading(false);
    }
  }, [statusFilter, router]);

  // ── Fetch tasks ───────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const res = await fetch('/api/tasks');
      if (res.status === 401) {
        router.push('/crm/login');
        return;
      }
      if (!res.ok) throw new Error('Greška pri učitavanju zadataka');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch {
      // silently fail for tasks
    } finally {
      setTasksLoading(false);
    }
  }, [router]);

  // ── Fetch users (workers + role check) ───────────────────────────────────
  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) return;
      const data = await res.json();
      setWorkers(data.users || []);
      setCurrentUserRole(data.currentRole ?? null);
    } catch {
      // Non-critical
    }
  }, []);

  // Workers land on tasks; they cannot access orders
  useEffect(() => {
    if (currentUserRole === 'worker') setActiveSection('tasks');
  }, [currentUserRole]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { fetchTasks(); fetchWorkers(); }, [fetchTasks, fetchWorkers]);

  // ── Order edit ────────────────────────────────────────────────────────────
  const handleOrderEdit = useCallback(async (id: string, updates: Partial<Order>) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...data.order } : o))
      );
      setEditingOrder(null);
    } catch {
      alert('Greška pri ažuriranju narudžbine');
    }
  }, []);

  // ── Task operations ───────────────────────────────────────────────────────
  const handleTaskStatusChange = useCallback(async (id: string, status: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      );
    } catch {
      alert('Greška pri ažuriranju zadatka');
    }
  }, []);

  const handleAddTask = useCallback(async (
    title: string,
    description: string,
    assignedTo: string,
    dueDate: string
  ) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          assigned_to: assignedTo || null,
          due_date: dueDate || null,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTasks((prev) => [data.task, ...prev]);
    } catch {
      alert('Greška pri dodavanju zadatka');
    }
  }, []);

  const handleDeleteTask = useCallback(async (id: string) => {
    if (!confirm('Obrisati zadatak?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      alert('Greška pri brisanju zadatka');
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/crm/login');
  }

  // ── Derived metrics ────────────────────────────────────────────────────────
  const totalRevenue = orders
    .filter((o) => o.status === 'isporuceno')
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  const activeOrdersCount = orders.filter((o) =>
    o.status === 'na_cekanju' || o.status === 'u_proizvodnji'
  ).length;

  const tasksPending = tasks.filter((t) => t.status !== 'done').length;

  const thisMonthOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // ── Search filter ──────────────────────────────────────────────────────────
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.customer_name.toLowerCase().includes(q) ||
      o.phone.includes(q) ||
      (o.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#080E1A] text-slate-100">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 bottom-0 w-56 border-r border-slate-800/60 bg-[#0B1120] flex flex-col z-30 hidden lg:flex">
        {/* Logo */}
        <div className="px-5 h-16 flex items-center gap-2.5 border-b border-slate-800/60">
          <div className="w-7 h-7 relative">
            <Image src="/logo.png" alt="Jović Group" width={28} height={28} className="object-contain" />
          </div>
          <span className="font-display text-sm font-bold">
            Jović <span className="text-[#C9A84C]">CRM</span>
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {([
            {
              key: 'orders',
              label: 'Narudžbine',
              minRole: 'manager' as UserRole,
              icon: (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H18v8.75A2.75 2.75 0 0115.25 15h-1.072l.798 3.06a.75.75 0 01-1.452.38L13.41 18H6.59l-.114.44a.75.75 0 01-1.452-.38L5.823 15H4.75A2.75 2.75 0 012 12.25V3.5h-.25A.75.75 0 011 2.75zm6.373 12.25l-.391 1.5h6.037l-.392-1.5H7.373zm7.49-8.931a.75.75 0 01-.232 1.036l-3.75 2.5a.75.75 0 01-.878-.06L8 7.56 5.797 9.763a.75.75 0 01-1.061-1.06l2.75-2.75a.75.75 0 011.006-.055l1.96 1.766 3.2-2.133a.75.75 0 011.211.538z" clipRule="evenodd" />
                </svg>
              ),
            },
            {
              key: 'tasks',
              label: 'Zadaci',
              minRole: 'worker' as UserRole,
              icon: (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              ),
            },
            {
              key: 'users',
              label: 'Korisnici',
              minRole: 'admin' as UserRole,
              icon: (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 17a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
                </svg>
              ),
            },
            {
              key: 'finance',
              label: 'Finansije',
              minRole: 'admin' as UserRole,
              icon: (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H18v8.75A2.75 2.75 0 0115.25 15h-1.072l.798 3.06a.75.75 0 01-1.452.38L13.41 18H6.59l-.114.44a.75.75 0 01-1.452-.38L5.823 15H4.75A2.75 2.75 0 012 12.25V3.5h-.25A.75.75 0 011 2.75zM10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.615z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M9.99 2a.75.75 0 01.75.75v.575a3.878 3.878 0 011.445.636A3.608 3.608 0 0113.5 7.165a.75.75 0 01-1.5.007 2.135 2.135 0 00-.507-1.373 2.374 2.374 0 00-.744-.456v2.35l.2.063a3.48 3.48 0 011.89 1.084c.47.5.77 1.142.77 1.87 0 .773-.257 1.5-.818 2.02-.552.513-1.282.805-2.042.88v.73a.75.75 0 01-1.5 0v-.73a3.633 3.633 0 01-1.44-.636 3.573 3.573 0 01-1.315-3.066.75.75 0 111.499.062 2.11 2.11 0 00.53 1.51c.27.287.602.49.977.622V9.498l-.197-.058A3.476 3.476 0 016.4 8.36 2.947 2.947 0 015.61 6.32c0-.76.252-1.48.81-2.002.55-.515 1.278-.808 2.03-.88V3a.75.75 0 01.54-.72z" clipRule="evenodd" />
                </svg>
              ),
            },
          ] as { key: string; label: string; minRole: UserRole; icon: React.ReactNode }[])
            .filter((item) => canAccess(currentUserRole, item.minRole))
            .map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key as typeof activeSection)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  activeSection === item.key
                    ? 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 border-t border-slate-800/60 pt-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
            </svg>
            Sajt
          </a>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
            </svg>
            {loggingOut ? 'Odjava...' : 'Odjava'}
          </button>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────── */}
      <main className="lg:pl-56">
        {/* Top bar */}
        <div className="sticky top-0 z-20 border-b border-slate-800/60 bg-[#080E1A]/90 backdrop-blur-md h-16 flex items-center px-6 gap-4">
          <h1 className="font-display text-lg font-bold text-white flex-1">
            {activeSection === 'orders' ? 'Narudžbine' : activeSection === 'tasks' ? 'Zadaci' : activeSection === 'finance' ? 'Finansije' : 'Korisnici'}
          </h1>

          <div className="flex items-center gap-3">
            <NotificationBell
              onOrderClick={(orderId) => {
                setActiveSection('orders');
                setEditingOrder(orders.find(o => o.id === orderId) ?? null);
              }}
            />
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </div>
          </div>
        </div>

        <div className="px-6 py-8 max-w-[1400px]">
          {/* ── Metrics — manager/admin only ────────────────────── */}
          {canAccess(currentUserRole, 'manager') && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {canAccess(currentUserRole, 'admin') && (
                <MetricCard
                  title="Ukupan prihod"
                  value={formatRSD(totalRevenue)}
                  sub="Isporučene narudžbine"
                  accent="bg-[#C9A84C]"
                  icon={
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.615z" />
                      <path fillRule="evenodd" d="M9.99 2a.75.75 0 01.75.75v.575a3.878 3.878 0 011.445.636A3.608 3.608 0 0113.5 7.165a.75.75 0 01-1.5.007 2.135 2.135 0 00-.507-1.373 2.374 2.374 0 00-.744-.456v2.35l.2.063a3.48 3.48 0 011.89 1.084c.47.5.77 1.142.77 1.87 0 .773-.257 1.5-.818 2.02-.552.513-1.282.805-2.042.88v.73a.75.75 0 01-1.5 0v-.73a3.633 3.633 0 01-1.44-.636 3.573 3.573 0 01-1.315-3.066.75.75 0 111.499.062 2.11 2.11 0 00.53 1.51c.27.287.602.49.977.622V9.498l-.197-.058A3.476 3.476 0 016.4 8.36 2.947 2.947 0 015.61 6.32c0-.76.252-1.48.81-2.002.55-.515 1.278-.808 2.03-.88V3a.75.75 0 01.54-.72z" clipRule="evenodd" />
                    </svg>
                  }
                />
              )}
              <MetricCard
                title="Aktivne narudžbine"
                value={String(activeOrdersCount)}
                sub="Na čekanju ili u prod."
                accent="bg-blue-500"
                icon={
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M2.695 14.762l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                  </svg>
                }
              />
              <MetricCard
                title="Zadaci na čekanju"
                value={String(tasksPending)}
                sub="Dodeljeni i aktivni"
                accent="bg-amber-500"
                icon={
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1H3a1 1 0 110 2h-.01a1 1 0 01-1-1zm0 5.25a1 1 0 011-1H3a1 1 0 110 2h-.01a1 1 0 01-1-1zm0 5.25a1 1 0 011-1H3a1 1 0 110 2h-.01a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                }
              />
              <MetricCard
                title="Ovaj mesec"
                value={String(thisMonthOrders)}
                sub="Novih narudžbina"
                accent="bg-emerald-500"
                icon={
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                }
              />
            </div>
          )}

          {/* ── Orders Section — manager/admin only ─────────────── */}
          {activeSection === 'orders' && canAccess(currentUserRole, 'manager') && (
            <div>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Pretraga po imenu, telefonu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
                  />
                </div>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
                >
                  <option value="all">Svi statusi</option>
                  <option value="na_cekanju">Na čekanju</option>
                  <option value="u_proizvodnji">U proizvodnji</option>
                  <option value="isporuceno">Isporučeno</option>
                  <option value="otkazano">Otkazano</option>
                </select>

                <button
                  onClick={fetchOrders}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm hover:border-slate-500 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M13.836 2.477a.75.75 0 01.75.75v3.182a.75.75 0 01-.75.75h-3.182a.75.75 0 010-1.5h1.37l-.84-.841a4.5 4.5 0 00-7.08.932.75.75 0 01-1.3-.75 6 6 0 0111.521-1.241l.63.63V3.227a.75.75 0 01.75-.75zm-7.588 8.71a.75.75 0 010-1.5h3.182a.75.75 0 01.75.75v3.182a.75.75 0 01-1.5 0v-1.37l-.84.841a4.5 4.5 0 01-7.08-.932.75.75 0 011.3-.75 3 3 0 004.72.621l1.06-1.06H6.248z" clipRule="evenodd" />
                  </svg>
                  Osveži
                </button>
              </div>

              {/* Table */}
              {fetchError && (
                <div className="mb-4 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                  {fetchError}
                </div>
              )}

              <div className="rounded-2xl border border-slate-800 overflow-hidden">
                {/* Table header */}
                <div className={`hidden md:grid gap-4 px-5 py-3 border-b border-slate-800 bg-slate-900/50 text-xs font-semibold text-slate-500 uppercase tracking-widest ${canAccess(currentUserRole, 'admin') ? 'grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto]' : 'grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto]'}`}>
                  <span>Klijent</span>
                  <span>Kontakt</span>
                  <span>Lokacija</span>
                  <span>Proizvodi</span>
                  {canAccess(currentUserRole, 'admin') && <span>Vrednost</span>}
                  <span>Status</span>
                  <span>Akcija</span>
                </div>

                {ordersLoading ? (
                  <div className="py-16 text-center text-slate-500 text-sm">
                    <svg className="animate-spin w-6 h-6 mx-auto mb-3 text-[#C9A84C]/50" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Učitavanje narudžbina...
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-sm">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Nijedna narudžbina ne odgovara filteru'
                      : 'Nema narudžbina'}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/60">
                    {filteredOrders.map((order, i) => (
                      <div
                        key={order.id}
                        className={`md:grid gap-4 px-5 py-4 items-start hover:bg-slate-900/30 transition-colors ${canAccess(currentUserRole, 'admin') ? 'md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto]' : 'md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto]'}`}
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        {/* Klijent */}
                        <div>
                          <div className="font-medium text-white text-sm">{order.customer_name}</div>
                          <div className="text-slate-500 text-xs mt-0.5">
                            {new Date(order.created_at).toLocaleDateString('sr-RS')}
                          </div>
                        </div>

                        {/* Kontakt */}
                        <div>
                          <div className="text-slate-300 text-sm">{order.phone}</div>
                          {order.email && (
                            <div className="text-slate-500 text-xs mt-0.5 truncate">{order.email}</div>
                          )}
                        </div>

                        {/* Lokacija */}
                        <div>
                          {order.town ? (
                            <>
                              <div className="text-slate-300 text-sm">{order.town}</div>
                              {order.address && (
                                <div className="text-slate-500 text-xs mt-0.5 truncate">{order.address}</div>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </div>

                        {/* Proizvodi */}
                        <OrderItemsCell items={order.items} />

                        {/* Vrednost — admin only */}
                        {canAccess(currentUserRole, 'admin') && (
                          <div>
                            <div className="text-[#C9A84C] font-mono font-semibold text-sm">
                              {formatRSD(order.total_price)}
                            </div>
                            <div className="text-slate-500 text-xs mt-0.5">
                              {order.payment_method === 'cash_on_delivery' ? 'Pouzećem' : 'Račun'}
                            </div>
                          </div>
                        )}

                        {/* Status */}
                        <div>
                          <StatusBadge status={order.status} />
                        </div>

                        {/* Action */}
                        <div className="flex items-center justify-end gap-2">
                          {order.status !== 'isporuceno' && order.status !== 'otkazano' && (
                            <button
                              onClick={() => handleOrderEdit(order.id, { status: 'isporuceno' })}
                              className="text-slate-500 hover:text-emerald-400 transition-colors"
                              title="Označi kao isporučeno"
                            >
                              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => setEditingOrder(order)}
                            className="text-slate-500 hover:text-[#C9A84C] transition-colors"
                            title="Uredi narudžbinu"
                          >
                            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                              <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.25.25 0 00.108-.064z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!ordersLoading && filteredOrders.length > 0 && (
                  <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/30 text-xs text-slate-500 flex items-center justify-between">
                    <span>
                      Prikazano {filteredOrders.length} od {orders.length} narudžbina
                    </span>
                    {canAccess(currentUserRole, 'admin') && (
                      <span className="text-[#C9A84C] font-semibold">
                        Ukupno: {formatRSD(filteredOrders.reduce((s, o) => s + o.total_price, 0))}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Finance Section — admin only ─────────────────────── */}
          {activeSection === 'finance' && currentUserRole === 'admin' && (
            <FinanceSection />
          )}

          {/* ── Users Section ────────────────────────────────────── */}
          {activeSection === 'users' && currentUserRole === 'admin' && (
            <UsersSection
              users={workers}
              onRefresh={fetchWorkers}
            />
          )}

          {/* ── Tasks Section ────────────────────────────────────── */}
          {activeSection === 'tasks' && (
            tasksLoading ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                <svg className="animate-spin w-6 h-6 mx-auto mb-3 text-[#C9A84C]/50" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Učitavanje zadataka...
              </div>
            ) : (
              <TaskBoard
                tasks={tasks}
                workers={workers}
                canManage={canAccess(currentUserRole, 'manager')}
                onStatusChange={handleTaskStatusChange}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
              />
            )
          )}
        </div>
      </main>

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