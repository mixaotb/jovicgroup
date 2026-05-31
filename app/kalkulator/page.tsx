'use client';

// app/kalkulator/page.tsx
import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { calculatePrice, formatRSD } from '@/lib/pricing';
import ThemeToggle from '@/components/ThemeToggle';
import type {
  ProductType,
  Material,
  OrderLocation,
  PaymentMethod,
  OrderFormData,
  CartItem,
} from '@/types';

type WizardStep = 'config' | 'cart' | 'checkout' | 'success';

const PRODUCT_TYPES: { value: ProductType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: 'window_single',
    label: 'Jednokrilni prozor',
    desc: 'Klasičan, kompaktan dizajn',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <rect x="4" y="4" width="24" height="24" rx="1" />
        <line x1="16" y1="4" x2="16" y2="28" />
        <line x1="4" y1="16" x2="28" y2="16" />
      </svg>
    ),
  },
  {
    value: 'window_double',
    label: 'Dvokrilni prozor',
    desc: 'Idealan za velike otvore',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <rect x="2" y="4" width="12" height="24" rx="1" />
        <rect x="18" y="4" width="12" height="24" rx="1" />
        <line x1="8" y1="4" x2="8" y2="28" />
        <line x1="24" y1="4" x2="24" y2="28" />
      </svg>
    ),
  },
  {
    value: 'door',
    label: 'Vrata',
    desc: 'PVC ili ALU ulazna vrata',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <rect x="6" y="2" width="20" height="28" rx="1" />
        <circle cx="22" cy="16" r="1.5" fill="currentColor" />
        <line x1="6" y1="8" x2="26" y2="8" strokeDasharray="2 2" />
      </svg>
    ),
  },
];

const MATERIALS: { value: Material; label: string; desc: string }[] = [
  { value: 'PVC', label: 'PVC', desc: 'Alphacan profili · Odlična toplotna izolacija · Niska cena održavanja' },
  { value: 'ALU', label: 'ALU', desc: 'Profilink i Schüco sistemi · Premium estetika · Za komercijalne objekte' },
];

const LOCATIONS: { value: OrderLocation; label: string; desc: string; fee: string }[] = [
  { value: 'Srbija',       label: 'Srbija',       desc: 'Ugradnja i dostava na teritoriji Srbije', fee: '+2.500 RSD dostava' },
  { value: 'Inostranstvo', label: 'Inostranstvo', desc: 'Isporuka za dijasporu u EU i šire',        fee: '+18.000 RSD dostava' },
];

interface FormErrors { customer_name?: string; phone?: string; email?: string; }

function validateForm(data: Partial<OrderFormData>): FormErrors {
  const errors: FormErrors = {};
  if (!data.customer_name?.trim()) errors.customer_name = 'Unesite ime i prezime';
  if (!data.phone?.trim()) errors.phone = 'Unesite broj telefona';
  else if (!/^[\d\s\+\-\(\)]{7,15}$/.test(data.phone.trim())) errors.phone = 'Unesite ispravan broj telefona';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Unesite ispravnu email adresu';
  return errors;
}

/* ─── Re-usable styled sub-components ─────────────────── */
function CardSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-[1.2rem] font-bold text-[var(--text)] mb-5">{children}</h2>;
}

function FieldLabel({ children, required, optional }: { children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label className="block text-[var(--text)] text-[13px] font-medium mb-2">
      {children}
      {required && <span className="text-[#C9A84C] ml-0.5">*</span>}
      {optional && <span className="text-[var(--text-faint)] font-normal ml-1.5">(opciono)</span>}
    </label>
  );
}

function TextInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input
        {...props}
        className={`w-full px-4 py-3 rounded-xl bg-[var(--bg-raised)] border text-[var(--text)] placeholder-[var(--text-faint)] text-[14px] focus:outline-none focus:ring-2 transition-colors
          ${error
            ? 'border-red-400/60 focus:ring-red-400/20'
            : 'border-[var(--border)] focus:border-[#C9A84C]/60 focus:ring-[#C9A84C]/15'
          }`}
      />
      {error && <p className="mt-1.5 text-red-400 text-[12px]">{error}</p>}
    </div>
  );
}

export default function KalkulatorPage() {
  const [step, setStep] = useState<WizardStep>('config');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const [productType, setProductType] = useState<ProductType>('window_single');
  const [material, setMaterial] = useState<Material>('PVC');
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(1200);
  const [quantity, setQuantity] = useState(1);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [location, setLocation] = useState<OrderLocation>('Srbija');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const cartTotals = useMemo(() => {
    return cartItems.reduce((totals, item) => {
      const p = calculatePrice(item.width, item.height, item.material, item.type, location, item.quantity);
      return { basePrice: totals.basePrice + p.basePrice, deliveryFee: p.deliveryFee, total: totals.total + p.total };
    }, { basePrice: 0, deliveryFee: 0, total: 0 });
  }, [cartItems, location]);

  const addToCart = useCallback(() => {
    setCartItems(prev => [...prev, { id: Date.now().toString(), type: productType, material, width, height, quantity }]);
    setStep('cart');
  }, [productType, material, width, height, quantity]);

  const removeItem = useCallback((id: string) => setCartItems(prev => prev.filter(i => i.id !== id)), []);

  const editItem = useCallback((item: CartItem) => {
    setEditingItemId(item.id);
    setProductType(item.type);
    setMaterial(item.material);
    setWidth(item.width);
    setHeight(item.height);
    setQuantity(item.quantity);
    setStep('config');
  }, []);

  const updateItem = useCallback(() => {
    if (!editingItemId) return;
    setCartItems(prev => prev.map(i => i.id === editingItemId ? { ...i, type: productType, material, width, height, quantity } : i));
    setEditingItemId(null);
    setStep('cart');
  }, [editingItemId, productType, material, width, height, quantity]);

  const resetConfigForm = useCallback(() => {
    setProductType('window_single');
    setMaterial('PVC');
    setWidth(1000);
    setHeight(1200);
    setQuantity(1);
    setEditingItemId(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    const formErrors = validateForm({ customer_name: customerName, phone, email });
    if (Object.keys(formErrors).length > 0) { setErrors(formErrors); return; }
    if (cartItems.length === 0) { setServerError('Dodajte barem jednu stavku u korpu'); return; }

    setErrors({}); setLoading(true); setServerError('');

    const payload: OrderFormData = {
      customer_name: customerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      location,
      payment_method: paymentMethod,
      notes: notes.trim(),
      total_price: cartTotals.total,
      items: cartItems.map(item => ({ dimensions_data: { type: item.type, material: item.material, width: item.width, height: item.height, quantity: item.quantity } })),
    };

    try {
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Greška pri slanju narudžbine'); }
      setStep('success');
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Greška. Pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  }, [customerName, phone, email, location, paymentMethod, notes, cartTotals.total, cartItems]);

  /* ── Success screen ─────────────────────────────────── */
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/12 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-emerald-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-display text-[2.2rem] font-bold text-[var(--text)] mb-3">Narudžbina primljena!</h1>
          <p className="text-[var(--text-muted)] text-[15px] leading-relaxed mb-2">
            Hvala, <strong className="text-[var(--text)]">{customerName}</strong>!
          </p>
          <p className="text-[var(--text-muted)] text-[14px] leading-relaxed mb-2">
            Naš tim će vas kontaktirati na <strong className="text-[var(--text)]">{phone}</strong> u roku od 24 sata.
          </p>
          <p className="text-[var(--text-faint)] text-[13px] mb-10">
            Ukupno: <span className="text-[#C9A84C] font-bold">{formatRSD(cartTotals.total)}</span>
            {paymentMethod === 'cash_on_delivery' ? ' · Pouzećem' : ' · Računom'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--text-muted)] font-semibold hover:text-[var(--text)] transition-colors text-[14px]">
              Nazad na početnu
            </Link>
            <button
              onClick={() => { setStep('config'); setCustomerName(''); setPhone(''); setEmail(''); setNotes(''); setCartItems([]); resetConfigForm(); }}
              className="px-6 py-3 rounded-xl bg-[#C9A84C] text-[#0B1120] font-bold hover:bg-[#E8C97A] transition-colors text-[14px]"
            >
              Nova narudžbina
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Step indicator ─────────────────────────────────── */
  const stepIndex = { config: 0, cart: 1, checkout: 2, success: 3 }[step];
  const steps = ['Konfiguracija', 'Korpa', 'Narudžbina'];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-surface)] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[60px] flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-6 h-6 relative">
              <Image src="/logo.png" alt="Jović Group" width={24} height={24} className="object-contain" />
            </div>
            <span className="font-display text-[15px] font-bold text-[var(--text)]">
              Jović <span className="text-[#C9A84C]">Group</span>
            </span>
          </Link>

          {/* Steps */}
          <div className="flex items-center gap-2 text-[13px]">
            {steps.map((label, i) => {
              const isActive = i === stepIndex;
              const isDone   = i < stepIndex;
              return (
                <div key={label} className="flex items-center gap-1.5">
                  {i > 0 && <div className="w-7 h-px bg-[var(--border)]" />}
                  <div className={`flex items-center gap-1.5 ${isActive ? 'text-[#C9A84C]' : isDone ? 'text-emerald-500' : 'text-[var(--text-faint)]'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                      isActive ? 'bg-[#C9A84C] text-[#0B1120]' :
                      isDone   ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-500' :
                                 'bg-[var(--bg-raised)] border border-[var(--border)]'
                    }`}>
                      {isDone ? (
                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
                        </svg>
                      ) : i + 1}
                    </div>
                    <span className="hidden sm:inline font-medium">{label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
        <div className="mb-8">
          <div className="gold-rule mb-4" />
          <h1 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-[var(--text)] mb-2">
            Kalkulator cene
          </h1>
          <p className="text-[var(--text-muted)] text-[15px]">
            Konfigurišite prozore i vrata i odmah dobijte okvirnu cenu.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* ── Left panel ── */}
          <div className="space-y-5">

            {/* ── CONFIG STEP ── */}
            {step === 'config' && (
              <>
                {/* Product type */}
                <CardSection>
                  <SectionTitle>1. Tip proizvoda</SectionTitle>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {PRODUCT_TYPES.map((pt) => (
                      <button
                        key={pt.value}
                        onClick={() => setProductType(pt.value)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          productType === pt.value
                            ? 'border-[#C9A84C] bg-[#C9A84C]/8'
                            : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg-raised)]'
                        }`}
                      >
                        <div className={`mb-3 ${productType === pt.value ? 'text-[#C9A84C]' : 'text-[var(--text-muted)]'}`}>
                          {pt.icon}
                        </div>
                        <div className="font-semibold text-[var(--text)] text-[13px]">{pt.label}</div>
                        <div className="text-[var(--text-faint)] text-[12px] mt-0.5">{pt.desc}</div>
                      </button>
                    ))}
                  </div>
                </CardSection>

                {/* Material */}
                <CardSection>
                  <SectionTitle>2. Materijal</SectionTitle>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {MATERIALS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setMaterial(m.value)}
                        className={`p-5 rounded-xl border text-left transition-all ${
                          material === m.value
                            ? 'border-[#C9A84C] bg-[#C9A84C]/8'
                            : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg-raised)]'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-[13px] ${material === m.value ? 'bg-[#C9A84C] text-[#0B1120]' : 'bg-[var(--border)] text-[var(--text-muted)]'}`}>
                            {m.value}
                          </div>
                          <span className="font-bold text-[var(--text)] text-[14px]">{m.label}</span>
                        </div>
                        <p className="text-[var(--text-muted)] text-[12.5px] leading-relaxed">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </CardSection>

                {/* Dimensions */}
                <CardSection>
                  <SectionTitle>3. Dimenzije i količina</SectionTitle>
                  <div className="space-y-7">
                    {/* Width */}
                    <div>
                      <div className="flex justify-between items-baseline mb-3">
                        <label className="text-[var(--text-muted)] text-[13px] font-medium">Širina</label>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono font-bold text-[#C9A84C] text-[1.1rem]">{width}</span>
                          <span className="text-[var(--text-faint)] text-[13px]">mm</span>
                        </div>
                      </div>
                      <input
                        type="range" min={400} max={2500} step={50} value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ background: `linear-gradient(to right, #C9A84C ${((width - 400) / 2100) * 100}%, var(--border) ${((width - 400) / 2100) * 100}%)` }}
                      />
                      <div className="flex justify-between text-[11px] text-[var(--text-faint)] mt-1.5">
                        <span>400mm</span><span>2500mm</span>
                      </div>
                    </div>

                    {/* Height */}
                    <div>
                      <div className="flex justify-between items-baseline mb-3">
                        <label className="text-[var(--text-muted)] text-[13px] font-medium">Visina</label>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono font-bold text-[#C9A84C] text-[1.1rem]">{height}</span>
                          <span className="text-[var(--text-faint)] text-[13px]">mm</span>
                        </div>
                      </div>
                      <input
                        type="range" min={400} max={2800} step={50} value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ background: `linear-gradient(to right, #C9A84C ${((height - 400) / 2400) * 100}%, var(--border) ${((height - 400) / 2400) * 100}%)` }}
                      />
                      <div className="flex justify-between text-[11px] text-[var(--text-faint)] mt-1.5">
                        <span>400mm</span><span>2800mm</span>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="text-[var(--text-muted)] text-[13px] font-medium block mb-3">Količina</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text)] font-bold hover:border-[var(--border-strong)] transition-colors flex items-center justify-center text-lg"
                        >−</button>
                        <div className="w-14 text-center font-mono font-bold text-[#C9A84C] text-xl">{quantity}</div>
                        <button
                          onClick={() => setQuantity(Math.min(50, quantity + 1))}
                          className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text)] font-bold hover:border-[var(--border-strong)] transition-colors flex items-center justify-center text-lg"
                        >+</button>
                        <span className="text-[var(--text-faint)] text-[13px] ml-1">kom</span>
                      </div>
                    </div>
                  </div>
                </CardSection>

                <div className="flex gap-3">
                  {editingItemId ? (
                    <>
                      <button onClick={updateItem} className="flex-1 py-4 rounded-xl bg-[#C9A84C] text-[#0B1120] font-bold text-[14px] hover:bg-[#E8C97A] transition-all">
                        Ažuriraj stavku
                      </button>
                      <button onClick={() => { resetConfigForm(); setStep('cart'); }} className="px-6 py-4 rounded-xl border border-[var(--border)] text-[var(--text-muted)] font-semibold hover:text-[var(--text)] transition-colors text-[14px]">
                        Otkaži
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={addToCart} className="flex-1 py-4 rounded-xl bg-[#C9A84C] text-[#0B1120] font-bold text-[14px] hover:bg-[#E8C97A] transition-all">
                        Dodaj u korpu
                      </button>
                      {cartItems.length > 0 && (
                        <button onClick={() => setStep('cart')} className="px-6 py-4 rounded-xl border border-[var(--border)] text-[var(--text-muted)] font-semibold hover:text-[var(--text)] transition-colors text-[14px]">
                          Korpa ({cartItems.length})
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {/* ── CART STEP ── */}
            {step === 'cart' && (
              <CardSection>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display text-[1.4rem] font-bold text-[var(--text)]">Vaša korpa</h2>
                  <span className="text-[var(--text-faint)] text-[13px]">
                    {cartItems.length} {cartItems.length === 1 ? 'stavka' : cartItems.length < 5 ? 'stavke' : 'stavki'}
                  </span>
                </div>

                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-[var(--text-faint)] mb-4 text-[14px]">Korpa je prazna</div>
                    <button onClick={() => setStep('config')} className="px-4 py-2 rounded-lg bg-[#C9A84C] text-[#0B1120] font-semibold text-[14px]">
                      Dodaj prvu stavku
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6">
                      {cartItems.map((item) => {
                        const pricing = calculatePrice(item.width, item.height, item.material, item.type, location, item.quantity);
                        const pt = PRODUCT_TYPES.find(p => p.value === item.type);
                        return (
                          <div key={item.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)]">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2.5">
                                  <div className="text-[#C9A84C]">{pt?.icon}</div>
                                  <div className="font-semibold text-[var(--text)] text-[14px]">{pt?.label}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 text-[13px] text-[var(--text-muted)]">
                                  <div>Materijal: <span className="text-[var(--text)]">{item.material}</span></div>
                                  <div>Dim: <span className="text-[var(--text)]">{item.width}×{item.height}mm</span></div>
                                  <div>Kom: <span className="text-[var(--text)]">{item.quantity}</span></div>
                                  <div>Cena: <span className="text-[#C9A84C] font-medium">{formatRSD(pricing.total)}</span></div>
                                </div>
                              </div>
                              <div className="flex gap-1.5 flex-shrink-0">
                                <button onClick={() => editItem(item)} className="p-2 rounded-lg hover:bg-[var(--border)] transition-colors">
                                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[var(--text-muted)]">
                                    <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                                    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                                  </svg>
                                </button>
                                <button onClick={() => removeItem(item.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-400">
                                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-[var(--border)] pt-4 mb-5 space-y-2.5 text-[14px]">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Ukupno proizvodi:</span>
                        <span className="text-[var(--text)] font-medium">{formatRSD(cartTotals.basePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Dostava:</span>
                        <span className="text-[var(--text)] font-medium">+{formatRSD(cartTotals.deliveryFee)}</span>
                      </div>
                      <div className="flex justify-between pt-2.5 border-t border-[var(--border)]">
                        <span className="text-[var(--text)] font-bold">Ukupno:</span>
                        <span className="text-[#C9A84C] font-bold text-[1.1rem]">{formatRSD(cartTotals.total)}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setStep('config')} className="flex-1 py-4 rounded-xl border border-[var(--border)] text-[var(--text-muted)] font-semibold hover:text-[var(--text)] transition-colors text-[14px]">
                        + Dodaj stavku
                      </button>
                      <button onClick={() => setStep('checkout')} className="flex-1 py-4 rounded-xl bg-[#C9A84C] text-[#0B1120] font-bold hover:bg-[#E8C97A] transition-colors text-[14px]">
                        Nastavi →
                      </button>
                    </div>
                  </>
                )}
              </CardSection>
            )}

            {/* ── CHECKOUT STEP ── */}
            {step === 'checkout' && (
              <CardSection>
                <button onClick={() => setStep('cart')} className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-[13px] mb-6">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                  </svg>
                  Nazad na korpu
                </button>

                <h2 className="font-display text-[1.4rem] font-bold text-[var(--text)] mb-6">Vaši podaci</h2>

                {serverError && (
                  <div className="mb-5 px-4 py-3 rounded-xl border border-red-400/30 bg-red-500/8 text-red-400 text-[13px]">
                    {serverError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <FieldLabel required>Ime i prezime</FieldLabel>
                    <TextInput type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="npr. Marko Marković" error={errors.customer_name} />
                  </div>
                  <div>
                    <FieldLabel required>Broj telefona</FieldLabel>
                    <TextInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+381 60 000 0000" error={errors.phone} />
                  </div>
                  <div>
                    <FieldLabel optional>Email adresa</FieldLabel>
                    <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="marko@gmail.com" error={errors.email} />
                  </div>

                  {/* Location */}
                  <div>
                    <FieldLabel>Lokacija dostave</FieldLabel>
                    <div className="grid grid-cols-2 gap-3">
                      {LOCATIONS.map((loc) => (
                        <button key={loc.value} onClick={() => setLocation(loc.value)}
                          className={`p-4 rounded-xl border text-left transition-all ${location === loc.value ? 'border-[#C9A84C] bg-[#C9A84C]/8' : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg-raised)]'}`}
                        >
                          <div className="font-semibold text-[var(--text)] text-[13px] mb-0.5">{loc.label}</div>
                          <div className="text-[var(--text-faint)] text-[11px]">{loc.fee}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment */}
                  <div>
                    <FieldLabel>Način plaćanja</FieldLabel>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'cash_on_delivery' as PaymentMethod, label: 'Pouzećem', icon: '💵', desc: 'Plaćate pri dostavi' },
                        { value: 'racun'            as PaymentMethod, label: 'Račun',    icon: '🏦', desc: 'Predračun na firmu' },
                      ].map((pm) => (
                        <button key={pm.value} onClick={() => setPaymentMethod(pm.value)}
                          className={`p-4 rounded-xl border text-left transition-all ${paymentMethod === pm.value ? 'border-[#C9A84C] bg-[#C9A84C]/8' : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg-raised)]'}`}
                        >
                          <div className="text-xl mb-1">{pm.icon}</div>
                          <div className="font-semibold text-[var(--text)] text-[13px]">{pm.label}</div>
                          <div className="text-[var(--text-faint)] text-[11px] mt-0.5">{pm.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <FieldLabel optional>Napomena</FieldLabel>
                    <textarea
                      value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                      placeholder="Posebni zahtevi, pristup objektu, preferirano vreme dostave..."
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-faint)] text-[14px] focus:outline-none focus:border-[#C9A84C]/60 focus:ring-2 focus:ring-[#C9A84C]/15 resize-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit} disabled={loading}
                  className="mt-6 w-full py-4 rounded-xl bg-[#C9A84C] text-[#0B1120] font-bold text-[15px] hover:bg-[#E8C97A] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-[0_4px_24px_rgba(201,168,76,0.2)]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Slanje...
                    </span>
                  ) : `Pošalji narudžbinu · ${formatRSD(cartTotals.total)}`}
                </button>
                <p className="text-center text-[var(--text-faint)] text-[11px] mt-3">
                  Kontaktiraćemo vas u roku od 24h.
                </p>
              </CardSection>
            )}
          </div>

          {/* ── Right: Live price card ── */}
          <div className="lg:sticky lg:top-[76px]">
            <div className="rounded-2xl border border-[#C9A84C]/25 bg-[var(--bg-surface)] overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/30">

              {step === 'config' && (
                <>
                  <div className="px-6 py-5 border-b border-[var(--border)] bg-[#C9A84C]/6">
                    <div className="text-[#C9A84C] font-semibold text-[11px] tracking-[0.1em] uppercase mb-1">Cena za ovu stavku</div>
                    <div className="font-display text-[2.2rem] font-bold text-[var(--text)]">
                      {formatRSD(calculatePrice(width, height, material, productType, location, quantity).total)}
                    </div>
                    <div className="text-[var(--text-faint)] text-[13px] mt-0.5">sa PDV-om i dostavom</div>
                  </div>
                  <div className="px-6 py-5 space-y-3 text-[13px]">
                    {[
                      ['Cena po komadu', formatRSD(calculatePrice(width, height, material, productType, location, 1).perUnit)],
                      ['Količina',       `× ${quantity} kom`],
                      ['Cena proizvoda', formatRSD(calculatePrice(width, height, material, productType, location, quantity).basePrice)],
                      [`Dostava (${location})`, `+${formatRSD(calculatePrice(width, height, material, productType, location, 1).deliveryFee)}`],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-[var(--text-muted)]">{label}</span>
                        <span className="font-mono text-[var(--text)] font-medium">{val}</span>
                      </div>
                    ))}
                    <div className="border-t border-[var(--border)] pt-3 flex justify-between">
                      <span className="text-[var(--text)] font-semibold">Ukupno</span>
                      <span className="font-mono text-[#C9A84C] font-bold">
                        {formatRSD(calculatePrice(width, height, material, productType, location, quantity).total)}
                      </span>
                    </div>
                  </div>
                  <div className="px-6 pb-5 space-y-2 text-[12.5px]">
                    {[
                      ['Tip',       PRODUCT_TYPES.find(p => p.value === productType)?.label],
                      ['Materijal', material],
                      ['Dimenzije', `${width} × ${height} mm`],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between">
                        <span className="text-[var(--text-faint)]">{l}</span>
                        <span className="text-[var(--text-muted)] font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {(step === 'cart' || step === 'checkout') && (
                <>
                  <div className="px-6 py-5 border-b border-[var(--border)] bg-[#C9A84C]/6">
                    <div className="text-[#C9A84C] font-semibold text-[11px] tracking-[0.1em] uppercase mb-1">Ukupna korpa</div>
                    <div className="font-display text-[2.2rem] font-bold text-[var(--text)]">{formatRSD(cartTotals.total)}</div>
                    <div className="text-[var(--text-faint)] text-[13px] mt-0.5">
                      {cartItems.length} {cartItems.length === 1 ? 'stavka' : cartItems.length < 5 ? 'stavke' : 'stavki'} · sa PDV-om
                    </div>
                  </div>
                  <div className="px-6 py-5 space-y-3 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Proizvodi</span>
                      <span className="font-mono text-[var(--text)] font-medium">{formatRSD(cartTotals.basePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Dostava ({location})</span>
                      <span className="font-mono text-[var(--text)] font-medium">+{formatRSD(cartTotals.deliveryFee)}</span>
                    </div>
                    <div className="border-t border-[var(--border)] pt-3 flex justify-between">
                      <span className="text-[var(--text)] font-semibold">Ukupno</span>
                      <span className="font-mono text-[#C9A84C] font-bold">{formatRSD(cartTotals.total)}</span>
                    </div>
                  </div>
                  {cartItems.length > 0 && (
                    <div className="px-6 pb-5">
                      <div className="text-[var(--text-faint)] text-[11px] font-semibold tracking-widest uppercase mb-3">Stavke</div>
                      <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                        {cartItems.map((item) => {
                          const pt = PRODUCT_TYPES.find(p => p.value === item.type);
                          return (
                            <div key={item.id} className="flex items-center gap-3 text-[12px]">
                              <div className="text-[#C9A84C] flex-shrink-0">{pt?.icon}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[var(--text)] truncate">{pt?.label}</div>
                                <div className="text-[var(--text-faint)]">{item.material} · {item.width}×{item.height}mm · {item.quantity}kom</div>
                              </div>
                              <div className="text-[#C9A84C] font-medium">
                                {formatRSD(calculatePrice(item.width, item.height, item.material, item.type, location, item.quantity).total)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="px-6 pb-6">
                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-[12px] leading-relaxed">
                  Ovo je okvirna cena. Konačna cena potvrđuje se nakon detaljnog merenja.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Range thumb styles */}
      <style jsx global>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #C9A84C;
          cursor: pointer;
          border: 2px solid var(--bg-surface);
          box-shadow: 0 0 0 1px rgba(201,168,76,0.4);
        }
        input[type='range']::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #C9A84C;
          cursor: pointer;
          border: 2px solid var(--bg-surface);
        }
      `}</style>
    </div>
  );
}
