'use client';

import { useState, useCallback, useMemo, useRef, useEffect, useId } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { calculatePrice, formatRSD, getDeliveryFee, getAddonCosts, getGlassPriceDelta, getOkovPriceDelta, getColorPriceDelta, getMaterialPriceDelta, DIMENSION_LIMITS, DEFAULT_DIMENSIONS } from '@/lib/pricing';
import ThemeToggle from '@/components/ThemeToggle';
import type {
  ProductType, Material, GlassType, OkovType, ColorType, KomarnikType,
  OrderLocation, PaymentMethod, OrderFormData, CartItem,
} from '@/types';

type WizardStep = 'config' | 'cart' | 'checkout' | 'success';

// ─── Product / material / location data ──────────────────────────────────────

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
    value: 'trokrilni_prozor',
    label: 'Trokrilni prozor',
    desc: 'Tri krila za široke otvore',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <rect x="1" y="4" width="9" height="24" rx="1" />
        <rect x="12" y="4" width="8" height="24" rx="1" />
        <rect x="22" y="4" width="9" height="24" rx="1" />
      </svg>
    ),
  },
  {
    value: 'fiksni_prozor',
    label: 'Fiksni prozor',
    desc: 'Nepokretno, maksimalna svetlost',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <rect x="4" y="4" width="24" height="24" rx="1" />
        <line x1="4" y1="16" x2="28" y2="16" strokeWidth="0.8" />
        <line x1="16" y1="4" x2="16" y2="28" strokeWidth="0.8" />
        <circle cx="16" cy="16" r="3.5" />
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
  {
    value: 'balkonska_vrata',
    label: 'Balkonska vrata',
    desc: 'Velika ostakljena vrata za terasu',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <rect x="3" y="2" width="11" height="28" rx="1" />
        <rect x="18" y="2" width="11" height="28" rx="1" />
        <line x1="3" y1="17" x2="14" y2="17" />
        <line x1="18" y1="17" x2="29" y2="17" />
        <circle cx="12" cy="15" r="1.2" fill="currentColor" />
        <circle cx="20" cy="15" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: 'klizna_vrata',
    label: 'Klizna vrata',
    desc: 'Klizni sistem za terase i verande',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <rect x="2" y="2" width="13" height="28" rx="1" />
        <rect x="17" y="2" width="13" height="28" rx="1" />
        <line x1="2" y1="30" x2="30" y2="30" strokeWidth="2" />
        <polyline points="22,11 26,15 22,19" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="17" y1="15" x2="26" y2="15" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'plisirani_komarnik',
    label: 'Plisirani komarnik',
    desc: 'Harmonikaststy sistem bez okvira',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <rect x="4" y="4" width="24" height="24" rx="1" />
        <line x1="4" y1="10.7" x2="28" y2="10.7" strokeWidth="0.8" />
        <line x1="4" y1="16"   x2="28" y2="16"   strokeWidth="0.8" />
        <line x1="4" y1="21.3" x2="28" y2="21.3" strokeWidth="0.8" />
        <line x1="10.7" y1="4" x2="10.7" y2="28" strokeWidth="0.8" />
        <line x1="16"   y1="4" x2="16"   y2="28" strokeWidth="0.8" />
        <line x1="21.3" y1="4" x2="21.3" y2="28" strokeWidth="0.8" />
      </svg>
    ),
  },
];

const MATERIALS: { value: Material; label: string; desc: string }[] = [
  { value: 'PVC', label: 'PVC', desc: 'Schüco & Alphacan profili · Odlična toplotna izolacija · Niski troškovi održavanja' },
  { value: 'ALU', label: 'ALU', desc: 'Elvial & Profilco sistemi · Premium estetika · Za komercijalne objekte' },
];

const LOCATIONS: { value: OrderLocation; label: string; desc: string; fee: string }[] = [
  { value: 'Srbija',       label: 'Srbija',       desc: 'Ugradnja i dostava na teritoriji Srbije', fee: '+3.500 RSD dostava' },
  { value: 'Inostranstvo', label: 'Inostranstvo', desc: 'Isporuka za dijasporu u EU i šire',        fee: '+25.000 RSD dostava' },
];

const GLASS_INFO: Record<GlassType, { label: string; sublabel: string; tooltip: string }> = {
  dvoslojno: {
    label: 'Standard', sublabel: 'Standardna izolacija',
    tooltip: 'Standardno dvoslojno staklo punjeno argonom. Dobar balans cene i izolacije, preporučujemo za unutrašnje prostorije ili zaštićene fasade.',
  },
  dvoslojno_niskoemisiono: {
    label: 'Niskoemisiono', sublabel: 'Poboljšana izolacija',
    tooltip: 'Dvoslojno staklo sa Low-E premazom koji odbija infracrveno zračenje. Bolja izolacija od standarda uz isti razmak stakla. Idealno kada ne želite troslojno ali tražite veću efikasnost.',
  },
  dvoslojno_peskirano: {
    label: 'Peskirano', sublabel: 'Dekorativno',
    tooltip: 'Dvoslojni sistem sa matiranim (peskirano) staklom. Propušta difuznu svetlost uz potpunu privatnost. Idealno za kupatila, stepenišne otvore i pregrade.',
  },
  niskoemisiono: {
    label: 'Niskoemisiono', sublabel: 'Visoka izolacija',
    tooltip: 'Troslojno staklo sa Low-E premazom. Do 45% manji gubitak toplote u poređenju sa dvoslojnim. Preporučujemo za spavaće sobe i dnevne boravke.',
  },
  '4_godisnja_doba': {
    label: '4 godišnja doba', sublabel: 'Maksimalna izolacija',
    tooltip: 'Napredni troslojni sistem sa dvostrukim Low-E premazom. Optimalno za pasivne kuće i hladne regione, maksimalna energetska efikasnost kroz sve sezone.',
  },
  peskirano: {
    label: 'Peskirano', sublabel: 'Dekorativno',
    tooltip: 'Troslojni sistem sa matiranim centralnim staklom. Potpuna privatnost uz tristruku izolaciju. Premium opcija za kupatila i reprezentativne prostore gde su važni i estetika i izolacija.',
  },
};

const COLOR_OPTIONS: { value: ColorType; label: string; swatch: string; note: string; icon?: React.ReactNode }[] = [
  { value: 'white',      label: 'Bela',     swatch: 'bg-gray-100 border-gray-300',   note: 'Klasična bela, RAL 9016' },
  { value: 'anthracite', label: 'Antracit', swatch: 'bg-slate-700 border-slate-600', note: 'Tamno siva, RAL 7016' },
  {
    value: 'wood', label: 'Drvo', swatch: '', note: 'Sve vrste drvnih folija',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7 rounded-lg mb-2.5" xmlns="http://www.w3.org/2000/svg">
        <rect width="28" height="28" rx="5" fill="#92400e"/>
        <path d="M0 4 Q7 2.5 14 4.5 Q21 6.5 28 4" stroke="#5c2200" strokeWidth="1.4" opacity="0.55"/>
        <path d="M0 9 Q6 7 14 9.5 Q22 12 28 9" stroke="#5c2200" strokeWidth="1.8" opacity="0.65"/>
        <path d="M0 15 Q7 13 14 15.5 Q21 18 28 15" stroke="#5c2200" strokeWidth="1.4" opacity="0.55"/>
        <path d="M0 20.5 Q6 19 14 21 Q22 23 28 20.5" stroke="#5c2200" strokeWidth="1.8" opacity="0.65"/>
        <path d="M0 26 Q7 24 14 26 Q21 28 28 26" stroke="#5c2200" strokeWidth="1.2" opacity="0.45"/>
        <rect width="28" height="28" rx="5" fill="rgba(255,220,150,0.06)"/>
      </svg>
    ),
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const productHasGlass      = (t: ProductType) => t !== 'plisirani_komarnik';
const productHasOkov       = (t: ProductType) => t !== 'plisirani_komarnik' && t !== 'fiksni_prozor' && t !== 'klizna_vrata';

// Returns which komarnik types are selectable for a given product.
// Plisirani is only offered as an add-on on doors (not on windows — order standalone instead).
const availableKomarnikTypes = (t: ProductType): KomarnikType[] => {
  if (t === 'door' || t === 'balkonska_vrata') return ['none', 'fiksni', 'plisirani', 'rolo'];
  if (['window_single', 'window_double', 'trokrilni_prozor', 'klizna_vrata'].includes(t)) return ['none', 'fiksni', 'rolo'];
  return [];
};
const productHasKomarnik = (t: ProductType) => availableKomarnikTypes(t).length > 1;
const productHasRoletna    = (t: ProductType) => t !== 'plisirani_komarnik';
const productHasOkapnica   = (t: ProductType) => ['window_single', 'window_double', 'trokrilni_prozor', 'fiksni_prozor'].includes(t);
const productHasSillInside = (t: ProductType) => ['window_single', 'window_double', 'trokrilni_prozor', 'fiksni_prozor'].includes(t);

const isTroslojnoTier = (g: GlassType) => g === 'niskoemisiono' || g === '4_godisnja_doba' || g === 'peskirano';

interface FormErrors { customer_name?: string; phone?: string; email?: string; }
function validateForm(data: Partial<OrderFormData>): FormErrors {
  const errors: FormErrors = {};
  if (!data.customer_name?.trim()) errors.customer_name = 'Unesite ime i prezime';
  if (!data.phone?.trim()) errors.phone = 'Unesite broj telefona';
  else if (!/^[\d\s\+\-\(\)]{7,15}$/.test(data.phone.trim())) errors.phone = 'Unesite ispravan broj telefona';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Unesite ispravnu email adresu';
  return errors;
}

async function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (file.size < 300_000) { resolve(dataUrl); return; }
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 900;
        const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.80));
      };
      img.onerror = reject;
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function CardSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-[1.1rem] font-bold text-[var(--text)] mb-5">{children}</h2>;
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
          ${error ? 'border-red-400/60 focus:ring-red-400/20' : 'border-[var(--border)] focus:border-[#C9A84C]/60 focus:ring-[#C9A84C]/15'}`}
      />
      {error && <p className="mt-1.5 text-red-400 text-[12px]">{error}</p>}
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [tipStyle, setTipStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLSpanElement>(null);

  const computeStyle = useCallback(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const TW = 220;
    const left = Math.max(8, Math.min(r.left + r.width / 2 - TW / 2, window.innerWidth - TW - 8));
    setTipStyle({ position: 'fixed', top: r.top, left, width: TW, transform: 'translateY(-100%) translateY(-8px)' });
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('touchstart', close, { passive: true, capture: true });
    return () => document.removeEventListener('touchstart', close, true);
  }, [open]);

  return (
    <span
      ref={ref}
      className="relative inline-block align-middle ml-1.5 cursor-help select-none"
      onMouseEnter={() => { computeStyle(); setOpen(true); }}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => { e.stopPropagation(); if (open) { setOpen(false); } else { computeStyle(); setOpen(true); } }}
    >
      <span className="w-4 h-4 rounded-full bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text-faint)] text-[10px] font-bold inline-flex items-center justify-center leading-none">i</span>
      {open && (
        <span
          className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] text-[12px] leading-relaxed z-[200] shadow-xl shadow-black/20 pointer-events-none"
          style={tipStyle}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function ToggleChip({ checked, onChange, label, icon, tooltip, price }: { checked: boolean; onChange: (v: boolean) => void; label: string; icon?: React.ReactNode; tooltip?: string; price?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${
        checked ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[var(--text)]' : 'border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
      }`}
    >
      <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-[#C9A84C] border-[#C9A84C]' : 'border-[var(--border)]'}`}>
        {checked && (
          <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
            <path d="M2 6l3 3 5-5" stroke="#0B1120" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {icon && <span className="flex-shrink-0 opacity-80">{icon}</span>}
      {label}
      {price && <span className="text-[#C9A84C] text-[11px] font-semibold ml-0.5">+{price}</span>}
      {tooltip && <InfoTooltip text={tooltip} />}
    </button>
  );
}

function GlassButton({
  children, onClick, disabled = false, className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const uid = useId();
  const filterId = `gbt${uid.replace(/:/g, '')}`;
  const elRef = useRef<HTMLButtonElement>(null);
  const specRef = useRef<HTMLDivElement>(null);

  const onEnter = useCallback(() => {
    if (!elRef.current || disabled) return;
    elRef.current.style.transform = 'translateY(-3px)';
    elRef.current.style.boxShadow = '0 4px 10px rgba(201,168,76,0.25)';
  }, [disabled]);

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = elRef.current;
    if (!el || disabled) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const map = el.querySelector('feDisplacementMap');
    if (map) map.setAttribute('scale', '22');
    if (specRef.current) {
      specRef.current.style.backgroundImage = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.2) 26%, transparent 58%)`;
    }
  }, [disabled]);

  const onLeave = useCallback(() => {
    if (elRef.current) {
      elRef.current.style.transform = '';
      elRef.current.style.boxShadow = '';
    }
    const map = elRef.current?.querySelector('feDisplacementMap');
    if (map) map.setAttribute('scale', '0');
    if (specRef.current) specRef.current.style.backgroundImage = '';
  }, []);

  return (
    <button
      ref={elRef}
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden rounded-xl font-bold text-[#0B1120] flex items-center justify-center transition-all duration-300
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}`}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseDown={() => { if (elRef.current) elRef.current.style.transform = 'translateY(0px)'; }}
      onMouseUp={() => { if (elRef.current && !disabled) elRef.current.style.transform = 'translateY(-3px)'; }}
    >
      <svg aria-hidden style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="turbulence" baseFrequency="0.014 0.011" numOctaves="2" result="noise" seed="5" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Backdrop distortion */}
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none" style={{
        backdropFilter: 'blur(6px) saturate(160%)',
        WebkitBackdropFilter: 'blur(6px) saturate(160%)',
        filter: `url(#${filterId}) brightness(1.05)`,
        zIndex: 1,
      }} />

      {/* Rich gradient */}
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none" style={{
        background: 'linear-gradient(135deg, #BF8F28 0%, #C9A84C 30%, #E8931A 65%, #F0BC35 100%)',
        zIndex: 2,
      }} />

      {/* Mouse-tracking specular */}
      <div ref={specRef} className="absolute inset-0 rounded-[inherit] pointer-events-none" style={{
        boxShadow: 'inset 1px 1px 1px rgba(255,255,255,0.55), inset 0 -1px 0 rgba(0,0,0,0.1)',
        zIndex: 3,
      }} />

      {/* Content */}
      <div className="relative" style={{ zIndex: 4 }}>
        {children}
      </div>
    </button>
  );
}

function GlassPricePanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const uid = useId();
  const filterId = `gpp${uid.replace(/:/g, '')}`;
  const panelRef = useRef<HTMLDivElement>(null);
  const specRef  = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = panelRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const map = el.querySelector('feDisplacementMap');
    if (map) map.setAttribute('scale', String(Math.min(15 + (x / r.width) * 55, 55)));
    if (specRef.current) {
      specRef.current.style.backgroundImage = `radial-gradient(ellipse at ${x}px ${y}px, rgba(201,168,76,0.26) 0%, rgba(255,255,255,0.08) 38%, transparent 68%)`;
    }
  }, []);

  const onLeave = useCallback(() => {
    const map = panelRef.current?.querySelector('feDisplacementMap');
    if (map) map.setAttribute('scale', '35');
    if (specRef.current) specRef.current.style.backgroundImage = '';
  }, []);

  return (
    <div ref={panelRef} className={`relative overflow-hidden ${className}`} onMouseMove={onMove} onMouseLeave={onLeave}>
      <svg aria-hidden style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feTurbulence type="turbulence" baseFrequency="0.008 0.009" numOctaves="2" result="noise" seed="4" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="35" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Backdrop blur + liquid distortion */}
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none" style={{
        backdropFilter: 'blur(22px) saturate(160%)',
        WebkitBackdropFilter: 'blur(22px) saturate(160%)',
        filter: `url(#${filterId}) brightness(1.07)`,
        zIndex: 1,
      }} />

      {/* Semi-transparent base (light/dark adaptive) */}
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none bg-white/78 dark:bg-[#0B1120]/82" style={{ zIndex: 2 }} />

      {/* Gold gradient tint — top-left bloom */}
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none" style={{
        background: 'linear-gradient(140deg, rgba(201,168,76,0.22) 0%, rgba(201,168,76,0.07) 32%, transparent 58%)',
        zIndex: 3,
      }} />

      {/* Mouse-tracking gold specular + edge inset */}
      <div ref={specRef} className="absolute inset-0 rounded-[inherit] pointer-events-none" style={{
        boxShadow: 'inset 1px 1px 1px rgba(255,255,255,0.24), inset 0 -1px 0 rgba(0,0,0,0.08)',
        zIndex: 4,
      }} />

      {/* Content */}
      <div className="relative" style={{ zIndex: 5 }}>
        {children}
      </div>
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return null;
  return (
    <span className={`text-[11px] font-semibold ${delta > 0 ? 'text-[#C9A84C]' : 'text-emerald-400'}`}>
      {delta > 0 ? '+' : ''}{formatRSD(delta)}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function KalkulatorPage() {
  const [step, setStep] = useState<WizardStep>('config');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Config state
  const [productType, setProductType]       = useState<ProductType>('window_single');
  const [material, setMaterial]             = useState<Material>('PVC');
  const [width,  setWidth]                  = useState(1000);
  const [height, setHeight]                 = useState(1200);
  const [quantity, setQuantity]             = useState(1);
  const [glassType, setGlassType]           = useState<GlassType>('dvoslojno');
  const [okovType, setOkovType]             = useState<OkovType>('agb');
  const [color, setColor]                   = useState<ColorType>('white');
  const [komarnikType, setKomarnikType]     = useState<KomarnikType>('none');
  const [hasRoletna, setHasRoletna]         = useState(false);
  const [hasOkapnica, setHasOkapnica]       = useState(false);
  const [hasInstallation, setHasInstallation] = useState(false);
  const [hasSillInside, setHasSillInside]   = useState(false);
  const [itemNotes, setItemNotes]           = useState('');
  const [imageDataUrl, setImageDataUrl]     = useState<string | undefined>(undefined);
  const [imageError, setImageError]         = useState('');
  const [isDragOver, setIsDragOver]         = useState(false);

  const [cartItems, setCartItems]           = useState<CartItem[]>([]);
  const [editingItemId, setEditingItemId]   = useState<string | null>(null);

  // Checkout state
  const [location, setLocation]           = useState<OrderLocation>('Srbija');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [customerName, setCustomerName]   = useState('');
  const [phone, setPhone]                 = useState('');
  const [email, setEmail]                 = useState('');
  const [town, setTown]                   = useState('');
  const [address, setAddress]             = useState('');
  const [notes, setNotes]                 = useState('');
  const [errors, setErrors]               = useState<FormErrors>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const limits = DIMENSION_LIMITS[productType];

  // ── Config helpers ────────────────────────────────────────────────────────

  const handleProductTypeChange = useCallback((newType: ProductType) => {
    setProductType(newType);
    const lim  = DIMENSION_LIMITS[newType];
    const defs = DEFAULT_DIMENSIONS[newType];
    setWidth(w  => (w  < lim.minW || w  > lim.maxW ? defs.w : w));
    setHeight(h => (h  < lim.minH || h  > lim.maxH ? defs.h : h));
    setKomarnikType(prev => availableKomarnikTypes(newType).includes(prev) ? prev : 'none');
    if (!productHasRoletna(newType))    setHasRoletna(false);
    if (!productHasOkapnica(newType))   setHasOkapnica(false);
    if (!productHasSillInside(newType)) setHasSillInside(false);
    // Reset glass to default if switching to plisirani_komarnik (no glass section)
    if (newType === 'plisirani_komarnik') setGlassType('dvoslojno');
  }, []);

  const handleImageFile = useCallback(async (file: File) => {
    setImageError('');
    if (file.size > 8_000_000) { setImageError('Slika ne sme biti veća od 8 MB'); return; }
    try {
      const url = await processImage(file);
      setImageDataUrl(url);
    } catch { setImageError('Greška pri učitavanju slike'); }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleImageFile(file);
  }, [handleImageFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // ── Cart helpers ──────────────────────────────────────────────────────────

  const buildCartItem = useCallback((): Omit<CartItem, 'id'> => ({
    type: productType, material, width, height, quantity,
    glassType, okovType, color,
    komarnikType, hasRoletna, hasOkapnica, hasInstallation, hasSillInside,
    itemNotes, imageDataUrl,
  }), [productType, material, width, height, quantity, glassType, okovType, color, komarnikType, hasRoletna, hasOkapnica, hasInstallation, hasSillInside, itemNotes, imageDataUrl]);

  const addToCart = useCallback(() => {
    setCartItems(prev => [...prev, { id: Date.now().toString(), ...buildCartItem() }]);
    setStep('cart');
  }, [buildCartItem]);

  const removeItem = useCallback((id: string) => setCartItems(prev => prev.filter(i => i.id !== id)), []);

  const editItem = useCallback((item: CartItem) => {
    setEditingItemId(item.id);
    setProductType(item.type);
    setMaterial(item.material);
    setWidth(item.width);
    setHeight(item.height);
    setQuantity(item.quantity);
    setGlassType(item.glassType);
    setOkovType(item.okovType);
    setColor(item.color);
    setKomarnikType(item.komarnikType);
    setHasRoletna(item.hasRoletna);
    setHasOkapnica(item.hasOkapnica);
    setHasInstallation(item.hasInstallation);
    setHasSillInside(item.hasSillInside);
    setItemNotes(item.itemNotes);
    setImageDataUrl(item.imageDataUrl);
    setStep('config');
  }, []);

  const updateItem = useCallback(() => {
    if (!editingItemId) return;
    setCartItems(prev => prev.map(i => i.id === editingItemId ? { id: i.id, ...buildCartItem() } : i));
    setEditingItemId(null);
    setStep('cart');
  }, [editingItemId, buildCartItem]);

  const resetConfigForm = useCallback(() => {
    setProductType('window_single');
    setMaterial('PVC');
    setWidth(1000);
    setHeight(1200);
    setQuantity(1);
    setGlassType('dvoslojno');
    setOkovType('agb');
    setColor('white');
    setKomarnikType('none');
    setHasRoletna(false);
    setHasOkapnica(false);
    setHasInstallation(false);
    setHasSillInside(false);
    setItemNotes('');
    setImageDataUrl(undefined);
    setEditingItemId(null);
    setImageError('');
  }, []);

  // ── Cart totals: delivery fee counted once ────────────────────────────────

  const cartTotals = useMemo(() => {
    if (cartItems.length === 0) return { basePrice: 0, deliveryFee: 0, total: 0 };
    const deliveryFee = getDeliveryFee(location);
    const basePrice = cartItems.reduce((sum, item) => {
      const p = calculatePrice(item.width, item.height, item.material, item.type, location, item.quantity, {
        glassType: item.glassType, okovType: item.okovType, color: item.color,
        komarnikType: item.komarnikType, hasRoletna: item.hasRoletna, hasOkapnica: item.hasOkapnica,
        hasInstallation: item.hasInstallation, hasSillInside: item.hasSillInside,
      });
      return sum + p.basePrice;
    }, 0);
    return { basePrice, deliveryFee, total: basePrice + deliveryFee };
  }, [cartItems, location]);

  // ── Addon costs (live, per unit) ─────────────────────────────────────────

  const addonCosts = useMemo(() => getAddonCosts(width, height, productType), [width, height, productType]);

  // ── Live preview ──────────────────────────────────────────────────────────

  const livePrice = useMemo(() => calculatePrice(width, height, material, productType, location, quantity, {
    glassType, okovType, color, komarnikType, hasRoletna, hasOkapnica, hasInstallation, hasSillInside,
  }), [width, height, material, productType, location, quantity, glassType, okovType, color, komarnikType, hasRoletna, hasOkapnica, hasInstallation, hasSillInside]);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const formErrors = validateForm({ customer_name: customerName, phone, email });
    if (Object.keys(formErrors).length > 0) { setErrors(formErrors); return; }
    if (cartItems.length === 0) { setServerError('Dodajte barem jednu stavku u korpu'); return; }

    setErrors({}); setLoading(true); setServerError('');

    const payload: OrderFormData = {
      customer_name:  customerName.trim(),
      phone:          phone.trim(),
      email:          email.trim(),
      location,
      town:           town.trim() || undefined,
      address:        address.trim() || undefined,
      payment_method: paymentMethod,
      notes:          notes.trim(),
      total_price:    cartTotals.total,
      items: cartItems.map(item => ({
        dimensions_data: {
          type: item.type, material: item.material, width: item.width, height: item.height, quantity: item.quantity,
          glassType: item.glassType, okovType: item.okovType, color: item.color,
          komarnikType: item.komarnikType, hasRoletna: item.hasRoletna, hasOkapnica: item.hasOkapnica,
          hasInstallation: item.hasInstallation, hasSillInside: item.hasSillInside,
          notes: item.itemNotes || undefined,
          imageDataUrl: item.imageDataUrl || undefined,
        },
      })),
    };

    try {
      const [res] = await Promise.all([
        fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
        new Promise<void>(resolve => setTimeout(resolve, 1000)),
      ]);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Greška pri slanju narudžbine'); }
      setStep('success');
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Greška. Pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  }, [customerName, phone, email, location, town, address, paymentMethod, notes, cartTotals.total, cartItems]);

  // ─────────────────────────────────────────────────────────────────────────
  // Success screen
  // ─────────────────────────────────────────────────────────────────────────

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
            <GlassButton
              onClick={() => { setStep('config'); setCustomerName(''); setPhone(''); setEmail(''); setTown(''); setAddress(''); setNotes(''); setCartItems([]); resetConfigForm(); }}
              className="px-6 py-3 text-[14px]"
            >
              Nova narudžbina
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }

  const stepIndex = { config: 0, cart: 1, checkout: 2, success: 3 }[step];
  const steps = ['Konfiguracija', 'Korpa', 'Narudžbina'];

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 78% 28%, rgba(201,168,76,0.09) 0%, transparent 48%), var(--bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 overflow-hidden">
        {/* Glass layers */}
        <div className="absolute inset-0 pointer-events-none" style={{ backdropFilter: 'blur(14px) saturate(150%)', WebkitBackdropFilter: 'blur(14px) saturate(150%)', zIndex: 1 }} />
        <div className="absolute inset-0 pointer-events-none bg-[var(--bg-surface)]/75 dark:bg-[var(--bg-surface)]/82" style={{ zIndex: 2 }} />
        <div className="absolute inset-0 pointer-events-none border-b border-white/10 dark:border-white/6" style={{ zIndex: 3 }} />
        <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-[#C9A84C]/35 to-transparent" style={{ zIndex: 4 }} />
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[60px] flex items-center justify-between gap-6 relative" style={{ zIndex: 5 }}>
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-6 h-6 flex items-center justify-center">
              <Image src="/logo.png" alt="Jović Group" width={24} height={24} className="object-contain" />
            </div>
            <span className="font-display text-[15px] font-bold text-[var(--text)]">
              Jović <span className="text-[#C9A84C]">Group</span>
            </span>
          </Link>

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
                      {isDone ? <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" /></svg> : i + 1}
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
          <h1 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-[var(--text)] mb-2">Kalkulator cene</h1>
          <p className="text-[var(--text-muted)] text-[15px]">Konfigurišite prozore i vrata i odmah dobijte okvirnu cenu.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* ── Left panel ── */}
          <div className="space-y-5">

            {/* ══════════ CONFIG STEP ══════════ */}
            {step === 'config' && (
              <>
                {/* 1. Tip proizvoda */}
                <CardSection>
                  <SectionTitle>1. Tip proizvoda</SectionTitle>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PRODUCT_TYPES.map((pt) => (
                      <button
                        key={pt.value}
                        onClick={() => handleProductTypeChange(pt.value)}
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

                {/* 2. Materijal */}
                {productType !== 'plisirani_komarnik' && (
                <CardSection>
                  <SectionTitle>2. Materijal</SectionTitle>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {MATERIALS.map((m) => {
                      const delta = getMaterialPriceDelta(width, height, productType, color, material, m.value);
                      return (
                      <button
                        key={m.value}
                        onClick={() => setMaterial(m.value)}
                        className={`p-5 rounded-xl border text-left transition-all ${
                          material === m.value
                            ? 'border-[#C9A84C] bg-[#C9A84C]/8'
                            : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg-raised)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-[13px] ${material === m.value ? 'bg-[#C9A84C] text-[#0B1120]' : 'bg-[var(--border)] text-[var(--text-muted)]'}`}>
                              {m.value}
                            </div>
                            <span className="font-bold text-[var(--text)] text-[14px]">{m.label}</span>
                          </div>
                          {m.value !== material && <DeltaBadge delta={delta} />}
                        </div>
                        <p className="text-[var(--text-muted)] text-[12.5px] leading-relaxed">{m.desc}</p>
                      </button>
                      );
                    })}
                  </div>
                </CardSection>
                )}

                {/* 3. Dimenzije i količina */}
                <CardSection>
                  <SectionTitle>3. Dimenzije i količina</SectionTitle>
                  <div className="space-y-7">
                    <div>
                      <div className="flex justify-between items-baseline mb-3">
                        <label className="text-[var(--text-muted)] text-[13px] font-medium">Širina</label>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono font-bold text-[#C9A84C] text-[1.1rem]">{width}</span>
                          <span className="text-[var(--text-faint)] text-[13px]">mm</span>
                        </div>
                      </div>
                      <input
                        type="range" min={limits.minW} max={limits.maxW} step={50} value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ background: `linear-gradient(to right, #C9A84C ${((width - limits.minW) / (limits.maxW - limits.minW)) * 100}%, var(--border) ${((width - limits.minW) / (limits.maxW - limits.minW)) * 100}%)` }}
                      />
                      <div className="flex justify-between text-[11px] text-[var(--text-faint)] mt-1.5">
                        <span>{limits.minW}mm</span><span>{limits.maxW}mm</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-baseline mb-3">
                        <label className="text-[var(--text-muted)] text-[13px] font-medium">Visina</label>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono font-bold text-[#C9A84C] text-[1.1rem]">{height}</span>
                          <span className="text-[var(--text-faint)] text-[13px]">mm</span>
                        </div>
                      </div>
                      <input
                        type="range" min={limits.minH} max={limits.maxH} step={50} value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ background: `linear-gradient(to right, #C9A84C ${((height - limits.minH) / (limits.maxH - limits.minH)) * 100}%, var(--border) ${((height - limits.minH) / (limits.maxH - limits.minH)) * 100}%)` }}
                      />
                      <div className="flex justify-between text-[11px] text-[var(--text-faint)] mt-1.5">
                        <span>{limits.minH}mm</span><span>{limits.maxH}mm</span>
                      </div>
                    </div>

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

                {/* 4. Staklo */}
                {productHasGlass(productType) && (
                  <CardSection>
                    <SectionTitle>4. Staklo</SectionTitle>

                    {/* Tier selector */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {(['dvoslojno', 'troslojno'] as const).map((tier) => {
                        const active = tier === 'dvoslojno' ? !isTroslojnoTier(glassType) : isTroslojnoTier(glassType);
                        const targetGlass = tier === 'dvoslojno' ? 'dvoslojno' : 'niskoemisiono';
                        const delta = active ? 0 : getGlassPriceDelta(width, height, productType, glassType, targetGlass);
                        return (
                          <button
                            key={tier}
                            onClick={() => {
                              if (tier === 'dvoslojno' && isTroslojnoTier(glassType)) setGlassType('dvoslojno');
                              if (tier === 'troslojno' && !isTroslojnoTier(glassType)) setGlassType('niskoemisiono');
                            }}
                            className={`p-4 rounded-xl border text-left transition-all ${
                              active ? 'border-[#C9A84C] bg-[#C9A84C]/8' : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg-raised)]'
                            }`}
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <div className="font-semibold text-[var(--text)] text-[13px]">
                                {tier === 'dvoslojno' ? 'Dvoslojno' : 'Troslojno'}
                              </div>
                              {!active && <DeltaBadge delta={delta} />}
                            </div>
                            <div className="text-[var(--text-faint)] text-[12px] mt-0.5">
                              {tier === 'dvoslojno' ? 'Dobar balans cene i izolacije' : 'Maksimalna toplotna izolacija'}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Dvoslojno sub-options */}
                    {!isTroslojnoTier(glassType) && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 pt-1">
                        {(['dvoslojno', 'dvoslojno_niskoemisiono', 'dvoslojno_peskirano'] as GlassType[]).map((g) => {
                          const info = GLASS_INFO[g];
                          const delta = g !== glassType ? getGlassPriceDelta(width, height, productType, glassType, g) : 0;
                          return (
                            <button
                              key={g}
                              onClick={() => setGlassType(g)}
                              className={`p-3.5 rounded-xl border text-left transition-all ${
                                glassType === g ? 'border-[#C9A84C] bg-[#C9A84C]/8' : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg-raised)]'
                              }`}
                            >
                              <div className="flex items-center gap-1 mb-1">
                                <span className="font-semibold text-[var(--text)] text-[12.5px]">{info.label}</span>
                                <InfoTooltip text={info.tooltip} />
                              </div>
                              <div className="text-[var(--text-faint)] text-[11.5px]">{info.sublabel}</div>
                              {g !== glassType && <DeltaBadge delta={delta} />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Troslojno sub-options */}
                    {isTroslojnoTier(glassType) && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 pt-1">
                        {(['niskoemisiono', '4_godisnja_doba', 'peskirano'] as GlassType[]).map((g) => {
                          const info = GLASS_INFO[g];
                          const delta = g !== glassType ? getGlassPriceDelta(width, height, productType, glassType, g) : 0;
                          return (
                            <button
                              key={g}
                              onClick={() => setGlassType(g)}
                              className={`p-3.5 rounded-xl border text-left transition-all ${
                                glassType === g ? 'border-[#C9A84C] bg-[#C9A84C]/8' : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg-raised)]'
                              }`}
                            >
                              <div className="flex items-center gap-1 mb-1">
                                <span className="font-semibold text-[var(--text)] text-[12.5px]">{info.label}</span>
                                <InfoTooltip text={info.tooltip} />
                              </div>
                              <div className="text-[var(--text-faint)] text-[11.5px]">{info.sublabel}</div>
                              {g !== glassType && <DeltaBadge delta={delta} />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </CardSection>
                )}

                {/* 5. Okov */}
                {productHasOkov(productType) && (
                  <CardSection>
                    <SectionTitle>5. Okov</SectionTitle>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {([
                        { value: 'agb'    as OkovType, name: 'AGB',    origin: 'Italija',  badge: '5 god. garancija', desc: 'Vrhunski italijanski okov. Klasa otpornosti RC2.' },
                        { value: 'schuco' as OkovType, name: 'Schüco', origin: 'Nemačka', badge: '10 god. garancija', desc: 'Premium nemački okov. Klasa otpornosti RC3.' },
                      ]).map((ok) => {
                        const delta = ok.value !== okovType ? getOkovPriceDelta(productType, okovType, ok.value) : 0;
                        return (
                        <button
                          key={ok.value}
                          onClick={() => setOkovType(ok.value)}
                          className={`p-5 rounded-xl border text-left transition-all ${
                            okovType === ok.value ? 'border-[#C9A84C] bg-[#C9A84C]/8' : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg-raised)]'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-bold text-[var(--text)] text-[14px]">{ok.name}</div>
                              <div className="text-[var(--text-faint)] text-[12px]">{ok.origin}</div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${okovType === ok.value ? 'border-[#C9A84C]/50 text-[#C9A84C] bg-[#C9A84C]/10' : 'border-[var(--border)] text-[var(--text-faint)]'}`}>
                                {ok.badge}
                              </span>
                              {ok.value !== okovType && <DeltaBadge delta={delta} />}
                            </div>
                          </div>
                          <p className="text-[var(--text-muted)] text-[12.5px]">{ok.desc}</p>
                        </button>
                        );
                      })}
                    </div>
                  </CardSection>
                )}

                {/* 6. Boja */}
                <CardSection>
                  <SectionTitle>6. Boja profila</SectionTitle>
                  <div className="grid grid-cols-3 gap-3">
                    {COLOR_OPTIONS.map((c) => {
                      const delta = c.value !== color ? getColorPriceDelta(width, height, productType, material, color, c.value) : 0;
                      return (
                      <button
                        key={c.value}
                        onClick={() => setColor(c.value)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          color === c.value ? 'border-[#C9A84C] bg-[#C9A84C]/8' : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg-raised)]'
                        }`}
                      >
                        {c.icon ?? <div className={`w-7 h-7 rounded-lg border-2 mb-2.5 ${c.swatch}`} />}
                        <div className="font-semibold text-[var(--text)] text-[13px]">{c.label}</div>
                        <div className="text-[var(--text-faint)] text-[11px] mt-0.5">{c.note}</div>
                        {c.value !== color && <DeltaBadge delta={delta} />}
                      </button>
                      );
                    })}
                  </div>
                </CardSection>

                {/* 7. Opcije */}
                <CardSection>
                  <SectionTitle>7. Opcije</SectionTitle>
                  <div className="space-y-4">
                    {productHasKomarnik(productType) && (
                      <div>
                        <div className="text-[var(--text-muted)] text-[13px] font-medium mb-2">Komarnik</div>
                        <div className="flex flex-wrap gap-2">
                          {([
                            { value: 'none' as KomarnikType, label: 'Bez', icon: (
                              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                                <rect x="6" y="6" width="20" height="20" rx="1.5" strokeDasharray="3 2.5" />
                                <line x1="12" y1="12" x2="20" y2="20" strokeLinecap="round" />
                                <line x1="20" y1="12" x2="12" y2="20" strokeLinecap="round" />
                              </svg>
                            )},
                            { value: 'fiksni' as KomarnikType, label: 'Fiksni', icon: (
                              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                                <rect x="5" y="5" width="22" height="22" rx="1.5" />
                                <line x1="5" y1="10.7" x2="27" y2="10.7" strokeWidth="0.8" />
                                <line x1="5" y1="16"   x2="27" y2="16"   strokeWidth="0.8" />
                                <line x1="5" y1="21.3" x2="27" y2="21.3" strokeWidth="0.8" />
                                <line x1="10.7" y1="5" x2="10.7" y2="27" strokeWidth="0.8" />
                                <line x1="16"   y1="5" x2="16"   y2="27" strokeWidth="0.8" />
                                <line x1="21.3" y1="5" x2="21.3" y2="27" strokeWidth="0.8" />
                              </svg>
                            )},
                            { value: 'plisirani' as KomarnikType, label: 'Plisirani', icon: (
                              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                                <rect x="5" y="5" width="22" height="22" rx="1.5" />
                                <polyline points="10,5 8,16 10,27" strokeLinecap="round" strokeLinejoin="round" />
                                <polyline points="14.5,5 12.5,16 14.5,27" strokeLinecap="round" strokeLinejoin="round" />
                                <polyline points="19,5 17,16 19,27" strokeLinecap="round" strokeLinejoin="round" />
                                <polyline points="23.5,5 21.5,16 23.5,27" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )},
                            { value: 'rolo' as KomarnikType, label: 'Rolo', icon: (
                              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                                <rect x="5" y="10" width="22" height="17" rx="1" />
                                <rect x="4" y="5" width="24" height="6" rx="2.5" />
                                <line x1="5" y1="16" x2="27" y2="16" strokeWidth="0.8" />
                                <line x1="5" y1="21" x2="27" y2="21" strokeWidth="0.8" />
                              </svg>
                            )},
                          ].filter(opt => availableKomarnikTypes(productType).includes(opt.value))).map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setKomarnikType(opt.value)}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${
                                komarnikType === opt.value
                                  ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[var(--text)]'
                                  : 'border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                              }`}
                            >
                              <span className="opacity-80">{opt.icon}</span>
                              {opt.label}
                              {opt.value === 'fiksni'    && <span className="text-[#C9A84C] text-[11px] font-semibold ml-0.5">+{formatRSD(addonCosts.komarnikFiksni)}</span>}
                              {opt.value === 'plisirani' && <span className="text-[#C9A84C] text-[11px] font-semibold ml-0.5">+{formatRSD(addonCosts.komarnikPlisirani)}</span>}
                              {opt.value === 'rolo'      && <span className="text-[#C9A84C] text-[11px] font-semibold ml-0.5">+{formatRSD(addonCosts.komarnikRolo)}</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                      {productHasRoletna(productType) && (
                        <ToggleChip checked={hasRoletna} onChange={setHasRoletna} label="Roletne" price={formatRSD(addonCosts.roletna)} tooltip="PVC ili ALU roleta montirana iznad prozora. Pruža zaštitu od sunca, toplote i buke." icon={
                          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                            <rect x="5" y="10" width="22" height="17" rx="1" />
                            <rect x="4" y="4" width="24" height="7" rx="2.5" />
                            <line x1="5" y1="16" x2="27" y2="16" strokeWidth="0.8" />
                            <line x1="5" y1="21" x2="27" y2="21" strokeWidth="0.8" />
                          </svg>
                        } />
                      )}
                      {productHasOkapnica(productType) && (
                        <ToggleChip checked={hasOkapnica} onChange={setHasOkapnica} label="Okapnica" price={formatRSD(addonCosts.okapnica)} tooltip="ALU tabla ispod prozora koja odvodi kišnicu od fasade. Sprečava vlagu i prljavštinu." icon={
                          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                            <rect x="5" y="4" width="22" height="18" rx="1" />
                            <path d="M3 22 L16 28 L29 22" strokeLinejoin="round" strokeLinecap="round" />
                          </svg>
                        } />
                      )}
                      {productHasSillInside(productType) && (
                        <ToggleChip checked={hasSillInside} onChange={setHasSillInside} label="Unutrašnja klupica" price={formatRSD(addonCosts.sillInside)} tooltip="PVC klupica koja se postavlja na unutrašnju stranu prozorskog otvora. Dostupna u beloj boji." icon={
                          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                            <rect x="5" y="4" width="22" height="19" rx="1" />
                            <rect x="3" y="22" width="26" height="4" rx="1" />
                          </svg>
                        } />
                      )}
                      <ToggleChip checked={hasInstallation} onChange={setHasInstallation} label="Ugradnja" price={formatRSD(addonCosts.installation)} tooltip="Montaža i ugradnja od strane našeg tima na vašoj lokaciji." icon={
                        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                          <path d="M22 5 C26 9 26 15 22 18 L10 29 C9 30 7 30 6 29 C5 28 5 26 6 25 L18 13 C14 9 14 4 18 2" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="7.5" cy="27.5" r="1.5" fill="currentColor" stroke="none" />
                        </svg>
                      } />
                    </div>
                  </div>
                </CardSection>

                {/* 8. Napomena i fotografija */}
                <CardSection>
                  <SectionTitle>8. Napomena i fotografija</SectionTitle>
                  <div className="space-y-4">
                    <div>
                      <FieldLabel optional>Napomena za ovu stavku</FieldLabel>
                      <textarea
                        value={itemNotes} onChange={(e) => setItemNotes(e.target.value)} rows={3}
                        placeholder="Opišite specifičnosti: poseban dizajn, položaj, boja ručice, natprozornik..."
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-faint)] text-[14px] focus:outline-none focus:border-[#C9A84C]/60 focus:ring-2 focus:ring-[#C9A84C]/15 resize-none transition-colors"
                      />
                    </div>

                    <div>
                      <FieldLabel optional>Fotografija / skica</FieldLabel>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) await handleImageFile(file);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      />

                      {imageDataUrl ? (
                        <div
                          className={`flex items-start gap-4 rounded-xl border-2 border-dashed p-3 transition-all ${isDragOver ? 'border-[#C9A84C]/60 bg-[#C9A84C]/5' : 'border-transparent'}`}
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragEnter={handleDragOver}
                          onDragLeave={handleDragLeave}
                        >
                          <div className="relative w-24 h-20 rounded-xl overflow-hidden border border-[var(--border)] flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageDataUrl} alt="Priložena fotografija" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[var(--text)] text-[13px] mb-2">Fotografija priložena</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] text-[12px] hover:text-[var(--text)] transition-colors"
                              >Promeni</button>
                              <button
                                onClick={() => setImageDataUrl(undefined)}
                                className="px-3 py-1.5 rounded-lg border border-red-400/30 text-red-400 text-[12px] hover:bg-red-500/10 transition-colors"
                              >Ukloni</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragEnter={handleDragOver}
                          onDragLeave={handleDragLeave}
                          className={`w-full py-8 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-2 ${
                            isDragOver
                              ? 'border-[#C9A84C]/60 bg-[#C9A84C]/5 text-[var(--text-muted)]'
                              : 'border-[var(--border)] hover:border-[#C9A84C]/40 bg-[var(--bg-raised)] text-[var(--text-faint)] hover:text-[var(--text-muted)]'
                          }`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                          <span className="text-[13px]">{isDragOver ? 'Otpustite da biste dodali' : 'Prevucite sliku ovde ili kliknite'}</span>
                          <span className="text-[11px]">JPG, PNG, WEBP do 8 MB</span>
                        </button>
                      )}
                      {imageError && <p className="mt-2 text-red-400 text-[12px]">{imageError}</p>}
                    </div>
                  </div>
                </CardSection>

                {/* CTA buttons */}
                <div className="flex gap-3">
                  {editingItemId ? (
                    <>
                      <GlassButton onClick={updateItem} className="flex-1 py-4 text-[14px]">
                        Ažuriraj stavku
                      </GlassButton>
                      <button onClick={() => { resetConfigForm(); setStep('cart'); }} className="px-6 py-4 rounded-xl border border-[var(--border)] text-[var(--text-muted)] font-semibold hover:text-[var(--text)] transition-colors text-[14px]">
                        Otkaži
                      </button>
                    </>
                  ) : (
                    <>
                      <GlassButton onClick={addToCart} className="flex-1 py-4 text-[14px]">
                        Dodaj u korpu
                      </GlassButton>
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

            {/* ══════════ CART STEP ══════════ */}
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
                    <GlassButton onClick={() => setStep('config')} className="px-4 py-2 text-[14px]">
                      Dodaj prvu stavku
                    </GlassButton>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6">
                      {cartItems.map((item) => {
                        const pricing = calculatePrice(item.width, item.height, item.material, item.type, location, item.quantity, {
                          glassType: item.glassType, okovType: item.okovType, color: item.color,
                          komarnikType: item.komarnikType, hasRoletna: item.hasRoletna, hasOkapnica: item.hasOkapnica,
                          hasInstallation: item.hasInstallation, hasSillInside: item.hasSillInside,
                        });
                        const pt = PRODUCT_TYPES.find(p => p.value === item.type);
                        const colorInfo = COLOR_OPTIONS.find(c => c.value === item.color);
                        const KOMARNIK_LABEL: Record<KomarnikType, string> = { none: '', plisirani: 'Plisirani komarnik', rolo: 'Rolo komarnik', fiksni: 'Fiksni komarnik' };
                        const addons = [
                          item.komarnikType !== 'none' && KOMARNIK_LABEL[item.komarnikType],
                          item.hasRoletna     && 'Roletne',
                          item.hasOkapnica    && 'Okapnica',
                          item.hasSillInside  && 'Unutrašnja klupica',
                          item.hasInstallation && 'Ugradnja',
                        ].filter(Boolean).join(', ');

                        return (
                          <div key={item.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)]">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2.5">
                                  <div className="text-[#C9A84C] flex-shrink-0">{pt?.icon}</div>
                                  <div className="font-semibold text-[var(--text)] text-[14px]">{pt?.label}</div>
                                  {item.imageDataUrl && (
                                    <div className="w-6 h-6 rounded overflow-hidden border border-[var(--border)] flex-shrink-0 ml-auto">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={item.imageDataUrl} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12.5px] text-[var(--text-muted)]">
                                  {item.type !== 'plisirani_komarnik' && (
                                    <div>Materijal: <span className="text-[var(--text)]">{item.material}</span></div>
                                  )}
                                  <div>Dim: <span className="text-[var(--text)]">{item.width}×{item.height}mm</span></div>
                                  <div>Kom: <span className="text-[var(--text)]">{item.quantity}</span></div>
                                  {item.type !== 'plisirani_komarnik' && (
                                    <div>Staklo: <span className="text-[var(--text)]">{GLASS_INFO[item.glassType]?.label}</span></div>
                                  )}
                                  {productHasOkov(item.type) && (
                                    <div>Okov: <span className="text-[var(--text)]">{item.okovType === 'agb' ? 'AGB' : 'Schüco'}</span></div>
                                  )}
                                  <div>Boja: <span className="text-[var(--text)]">{colorInfo?.label}</span></div>
                                  {addons && <div className="col-span-2">Dodaci: <span className="text-[var(--text)]">{addons}</span></div>}
                                  {item.itemNotes && <div className="col-span-2 text-[var(--text-faint)] italic truncate">&bdquo;{item.itemNotes}&ldquo;</div>}
                                  <div className="col-span-2 pt-1 font-medium">Cena: <span className="text-[#C9A84C]">{formatRSD(pricing.basePrice)}</span></div>
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
                      <button onClick={() => { resetConfigForm(); setStep('config'); }} className="flex-1 py-4 rounded-xl border border-[var(--border)] text-[var(--text-muted)] font-semibold hover:text-[var(--text)] transition-colors text-[14px]">
                        + Dodaj stavku
                      </button>
                      <GlassButton onClick={() => setStep('checkout')} className="flex-1 py-4 text-[14px]">
                        Nastavi →
                      </GlassButton>
                    </div>
                  </>
                )}
              </CardSection>
            )}

            {/* ══════════ CHECKOUT STEP ══════════ */}
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

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel optional>Grad / opština</FieldLabel>
                      <TextInput type="text" value={town} onChange={(e) => setTown(e.target.value)} placeholder="npr. Beograd, Novi Sad..." />
                    </div>
                    <div>
                      <FieldLabel optional>Adresa</FieldLabel>
                      <TextInput type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="npr. Ulica br. 12" />
                    </div>
                  </div>

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
                    <FieldLabel optional>Napomena za narudžbinu</FieldLabel>
                    <textarea
                      value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                      placeholder="Posebni zahtevi, pristup objektu, preferirano vreme dostave..."
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-faint)] text-[14px] focus:outline-none focus:border-[#C9A84C]/60 focus:ring-2 focus:ring-[#C9A84C]/15 resize-none transition-colors"
                    />
                  </div>
                </div>

                <GlassButton
                  onClick={handleSubmit}
                  disabled={loading}
                  className="mt-6 w-full py-4 text-[15px]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2.5">
                      <span
                        className="inline-block w-[18px] h-[18px] rounded-full border-[2.5px] border-[#0B1120]/20 border-t-[#0B1120] animate-spin flex-shrink-0"
                        style={{ boxShadow: '0 0 8px 2px rgba(11,17,32,0.25)' }}
                        aria-hidden
                      />
                      Slanje...
                    </span>
                  ) : `Pošalji narudžbinu · ${formatRSD(cartTotals.total)}`}
                </GlassButton>
                <p className="text-center text-[var(--text-faint)] text-[11px] mt-3">
                  Kontaktiraćemo vas u roku od 24h.
                </p>
              </CardSection>
            )}
          </div>

          {/* ── Right: Live price card ── */}
          <div className="lg:sticky lg:top-[76px]">
            <GlassPricePanel className="rounded-2xl border border-[#C9A84C]/30 shadow-xl shadow-black/10 dark:shadow-black/50">

              {step === 'config' && (
                <>
                  <div className="px-6 py-5 border-b border-[#C9A84C]/20">
                    <div className="text-[#C9A84C] font-semibold text-[11px] tracking-[0.1em] uppercase mb-1">Cena za ovu stavku</div>
                    <div className="font-display text-[2.2rem] font-bold text-[var(--text)]">
                      {formatRSD(livePrice.total)}
                    </div>
                    <div className="text-[var(--text-faint)] text-[13px] mt-0.5">sa PDV-om i dostavom</div>
                  </div>

                  <div className="px-6 py-5 space-y-2.5 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Profili</span>
                      <span className="font-mono text-[var(--text)] font-medium">{formatRSD(livePrice.profileCost)}</span>
                    </div>
                    {livePrice.glassCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Staklo</span>
                        <span className="font-mono text-[var(--text)] font-medium">{formatRSD(livePrice.glassCost)}</span>
                      </div>
                    )}
                    {livePrice.okovCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Okov</span>
                        <span className="font-mono text-[var(--text)] font-medium">{formatRSD(livePrice.okovCost)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Rad</span>
                      <span className="font-mono text-[var(--text)] font-medium">{formatRSD(livePrice.laborCost)}</span>
                    </div>
                    {livePrice.addonsCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Dodaci</span>
                        <span className="font-mono text-[var(--text)] font-medium">{formatRSD(livePrice.addonsCost)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                      <span className="text-[var(--text-muted)]">Cena po komadu</span>
                      <span className="font-mono text-[var(--text)] font-medium">{formatRSD(livePrice.perUnit)}</span>
                    </div>
                    {quantity > 1 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Količina</span>
                        <span className="font-mono text-[var(--text)] font-medium">× {quantity} kom</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Cena proizvoda</span>
                      <span className="font-mono text-[var(--text)] font-medium">{formatRSD(livePrice.basePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Dostava</span>
                      <span className="font-mono text-[var(--text)] font-medium">+{formatRSD(livePrice.deliveryFee)}</span>
                    </div>
                    <div className="border-t border-[var(--border)] pt-2.5 flex justify-between">
                      <span className="text-[var(--text)] font-semibold">Ukupno</span>
                      <span className="font-mono text-[#C9A84C] font-bold">{formatRSD(livePrice.total)}</span>
                    </div>
                  </div>

                  <div className="px-6 pb-5 space-y-1.5 text-[12px]">
                    {([
                      ['Tip',       PRODUCT_TYPES.find(p => p.value === productType)?.label],
                      ...(productType !== 'plisirani_komarnik' ? [['Materijal', material]] : []),
                      ['Dimenzije', `${width} × ${height} mm`],
                      ...(productType !== 'plisirani_komarnik' ? [
                        ['Staklo', GLASS_INFO[glassType]?.label],
                        ...(productHasOkov(productType) ? [['Okov', okovType === 'agb' ? 'AGB' : 'Schüco']] : []),
                      ] : []),
                      ['Boja', COLOR_OPTIONS.find(c => c.value === color)?.label],
                      ...(komarnikType !== 'none' ? [['Komarnik', komarnikType === 'plisirani' ? 'Plisirani' : komarnikType === 'rolo' ? 'Rolo' : 'Fiksni']] : []),
                      ...(hasInstallation ? [['Ugradnja', 'Da']] : []),
                      ...(hasSillInside   ? [['Klupica',  'Da']] : []),
                    ] as [string, string][]).map(([l, v]) => (
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
                  <div className="px-6 py-5 border-b border-[#C9A84C]/20">
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
                          const p = calculatePrice(item.width, item.height, item.material, item.type, location, item.quantity, {
                            glassType: item.glassType, okovType: item.okovType, color: item.color,
                            komarnikType: item.komarnikType, hasRoletna: item.hasRoletna, hasOkapnica: item.hasOkapnica,
                            hasInstallation: item.hasInstallation, hasSillInside: item.hasSillInside,
                          });
                          return (
                            <div key={item.id} className="flex items-center gap-3 text-[12px]">
                              <div className="text-[#C9A84C] flex-shrink-0">{pt?.icon}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[var(--text)] truncate">{pt?.label}</div>
                                <div className="text-[var(--text-faint)]">{item.material} · {item.width}×{item.height}mm · {item.quantity}kom</div>
                              </div>
                              <div className="text-[#C9A84C] font-medium">{formatRSD(p.basePrice)}</div>
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
            </GlassPricePanel>
          </div>
        </div>
      </div>

      <style jsx global>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #C9A84C;
          cursor: pointer;
          border: 2px solid var(--bg-surface);
          box-shadow: 0 0 0 1px rgba(201,168,76,0.4);
        }
        input[type='range']::-moz-range-thumb {
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #C9A84C;
          cursor: pointer;
          border: 2px solid var(--bg-surface);
        }

      `}</style>
    </div>
  );
}
