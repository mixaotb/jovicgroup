'use client';

import { useState, useCallback, useId } from 'react';

type ChatState = 'idle' | 'loading' | 'success' | 'error';

interface FormValues {
  name: string;
  phone: string;
  email: string;
  message: string;
  website: string; // honeypot
}

const EMPTY_FORM: FormValues = { name: '', phone: '', email: '', message: '', website: '' };

const inputClass =
  'w-full px-3 py-3 rounded-xl text-[14px] text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 transition-colors';
const inputStyle = { background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' };
const labelClass = 'block text-[var(--text-muted)] text-[11px] font-semibold uppercase tracking-wide mb-1.5';

function PanelHeader({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="flex items-center justify-between px-5 pt-4 pb-3"
      style={{ borderBottom: '1px solid var(--glass-border)' }}
    >
      <div>
        <div className="font-display font-bold text-[var(--text)] text-[14px]">Zatražite ponudu</div>
        <div className="text-[var(--text-faint)] text-[11px] mt-0.5">Javljamo se u roku od 48 sati</div>
      </div>
      <button
        onClick={onClose}
        aria-label="Zatvori"
        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-faint)] hover:text-[var(--text)] transition-colors"
        style={{ background: 'var(--glass-bg)' }}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}

function PanelBody({
  values, setField,
  chatState, errorMsg, onSubmit, onClose,
}: {
  values: FormValues;
  setField: (field: keyof FormValues, value: string) => void;
  chatState: ChatState; errorMsg: string;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  // Panel renders twice (mobile sheet + desktop popover) — ids must be unique per instance
  const uid = useId();
  const id = (field: string) => `${uid}-${field}`;

  if (chatState === 'success') {
    return (
      <div className="px-5 py-10 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="font-display font-bold text-[var(--text)] text-[16px] mb-2">Poruka poslata!</div>
        <div className="text-[var(--text-muted)] text-[14px] leading-relaxed mb-6">
          Javićemo vam se na{' '}
          <span className="text-[var(--text)] font-semibold">{values.phone.trim()}</span>{' '}
          u roku od 48 sati.
        </div>
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl border text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          Zatvori
        </button>
      </div>
    );
  }

  const req = <span className="text-[#C9A84C]">*</span>;

  return (
    <form onSubmit={onSubmit} className="px-5 py-5 space-y-4">
      <div>
        <label htmlFor={id('name')} className={labelClass}>Ime i prezime {req}</label>
        <input
          id={id('name')}
          type="text"
          autoComplete="name"
          value={values.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder="Petar Petrović"
          required
          minLength={2}
          maxLength={100}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={id('phone')} className={labelClass}>Telefon {req}</label>
          <input
            id={id('phone')}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => setField('phone', e.target.value)}
            placeholder="06x xxx xxxx"
            required
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor={id('email')} className={labelClass}>Email {req}</label>
          <input
            id={id('email')}
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="vas@email.com"
            required
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Honeypot — hidden from people and screen readers; bots fill it */}
      <div aria-hidden className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none">
        <label htmlFor={id('website')}>Website</label>
        <input
          id={id('website')}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => setField('website', e.target.value)}
        />
      </div>

      <div>
        <label htmlFor={id('message')} className={labelClass}>
          Poruka {req}
        </label>
        <textarea
          id={id('message')}
          value={values.message}
          onChange={(e) => setField('message', e.target.value)}
          placeholder="Npr. 3 PVC prozora 120×140 cm i balkonska vrata, Stara Pazova"
          required
          rows={4}
          minLength={10}
          maxLength={2000}
          className={`${inputClass} resize-none`}
          style={inputStyle}
        />
        <div className="text-right text-[10px] text-[var(--text-faint)] mt-1 tabular-nums">
          {values.message.length}/2000
        </div>
      </div>

      {chatState === 'error' && errorMsg && (
        <p className="text-red-400 text-[12px]" role="alert">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={chatState === 'loading'}
        className="w-full py-3 rounded-xl font-bold text-[14px] text-[#06080F] bg-[#C9A84C] hover:bg-[#E8C97A] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {chatState === 'loading' ? 'Slanje...' : 'Pošalji upit →'}
      </button>
    </form>
  );
}

export default function FloatingContact() {
  const phone = '381653999555';
  const [chatOpen, setChatOpen]   = useState(false);
  const [values, setValues]       = useState<FormValues>(EMPTY_FORM);
  const [chatState, setChatState] = useState<ChatState>('idle');
  const [errorMsg, setErrorMsg]   = useState('');

  const setField = useCallback((field: keyof FormValues, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
  }, []);

  const handleClose = useCallback(() => {
    setChatOpen(false);
    if (chatState === 'success') {
      setTimeout(() => {
        setValues(EMPTY_FORM);
        setChatState('idle');
        setErrorMsg('');
      }, 300);
    }
  }, [chatState]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setChatState('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    values.name.trim(),
          phone:   values.phone.trim(),
          email:   values.email.trim(),
          message: values.message.trim(),
          website: values.website,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Greška pri slanju.');
      setChatState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Greška pri slanju. Pokušajte ponovo.');
      setChatState('error');
    }
  }, [values]);

  const panelProps = { values, setField, chatState, errorMsg, onSubmit: handleSubmit, onClose: handleClose };

  return (
    <>
      {/* ── Mobile bottom sheet ─────────────────────────────────────── */}
      {chatOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[48] bg-black/60 backdrop-blur-sm sm:hidden"
            onClick={handleClose}
            aria-hidden
          />
          {/* Sheet */}
          <div
            className="fixed inset-x-0 bottom-0 z-[49] sm:hidden rounded-t-3xl overflow-y-auto max-h-[92dvh]"
            style={{
              background: 'var(--glass-bg-strong)',
              backdropFilter: 'blur(28px) saturate(160%)',
              WebkitBackdropFilter: 'blur(28px) saturate(160%)',
              borderTop: '1px solid var(--glass-border)',
            }}
          >
            {/* Gold accent line */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[var(--glass-border)]" />
            </div>
            <PanelHeader onClose={handleClose} />
            <PanelBody {...panelProps} />
            {/* Safe-area spacing */}
            <div className="h-safe-bottom h-6" />
          </div>
        </>
      )}

      {/* ── Floating button stack ───────────────────────────────────── */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-3">

        {/* Desktop floating panel */}
        <div
          className={`hidden sm:block transition-all duration-300 origin-bottom-right ${
            chatOpen
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
          aria-hidden={!chatOpen}
        >
          <div
            className="w-[22rem] rounded-2xl overflow-hidden shadow-2xl shadow-black/40"
            style={{
              background: 'var(--glass-bg-strong)',
              backdropFilter: 'blur(28px) saturate(160%)',
              WebkitBackdropFilter: 'blur(28px) saturate(160%)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />
            <PanelHeader onClose={handleClose} />
            <PanelBody {...panelProps} />
          </div>
        </div>

        {/* ── Viber ────────────────────────────────────────────────── */}
        <a
          href={`viber://chat?number=%2B${phone}`}
          aria-label="Pošaljite poruku na Viber"
          className="md:hidden group relative w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-110 hover:-translate-y-0.5 active:scale-95"
          style={{ background: '#7360F2', boxShadow: '0 6px 24px rgba(115,96,242,0.45)', transition: 'transform 300ms ease', willChange: 'transform' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-[24px] h-[24px]" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {/* Viber: rounded speech bubble with a tail, handset and signal arcs */}
            <path d="M12 2.6c-4.9 0-8.4 2-8.4 7.4v1.9c0 3.5 1.5 5.6 4.2 6.6v3.1l2.9-2.6H12c4.9 0 8.4-2 8.4-7.1V10c0-5.4-3.5-7.4-8.4-7.4z" />
            <path d="M9.1 7.3c.4-.4 1-.4 1.3.1l.8 1.1c.3.4.2.9-.1 1.2l-.5.4c.5 1.1 1.4 2 2.5 2.5l.4-.5c.3-.3.8-.4 1.2-.1l1.1.8c.5.3.5.9.1 1.3l-.5.5c-.6.6-1.5.8-2.3.4-1.9-.9-3.4-2.4-4.3-4.3-.4-.8-.2-1.7.4-2.3z" fill="white" stroke="none" />
            <path d="M13.2 6.4a3.6 3.6 0 0 1 3 3" />
            <path d="M13.2 4.5a5.5 5.5 0 0 1 4.9 4.9" />
          </svg>
          <span
            className="absolute right-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[12px] font-semibold text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block"
            style={{ background: '#7360F2', boxShadow: '0 2px 8px rgba(115,96,242,0.4)' }}
            aria-hidden
          >
            Viber
          </span>
        </a>

        {/* ── WhatsApp ──────────────────────────────────────────────── */}
        <a
          href={`https://wa.me/${phone}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Pošaljite poruku na WhatsApp"
          className="md:hidden group relative w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-110 hover:-translate-y-0.5 active:scale-95"
          style={{ background: '#25D366', boxShadow: '0 6px 24px rgba(37,211,102,0.45)', transition: 'transform 300ms ease', willChange: 'transform' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="white" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.113 1.528 5.836L.057 23.877l6.253-1.641A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.817 9.817 0 01-5.016-1.374l-.36-.214-3.728.898.934-3.614-.235-.371A9.773 9.773 0 012.182 12C2.182 6.575 6.575 2.182 12 2.182S21.818 6.575 21.818 12 17.425 21.818 12 21.818z" />
          </svg>
          <span
            className="absolute right-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[12px] font-semibold text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block"
            style={{ background: '#25D366', boxShadow: '0 2px 8px rgba(37,211,102,0.4)' }}
            aria-hidden
          >
            WhatsApp
          </span>
        </a>

        {/* ── Chat toggle ───────────────────────────────────────────── */}
        <button
          onClick={() => setChatOpen((o) => !o)}
          aria-label={chatOpen ? 'Zatvori kontakt formu' : 'Zatražite ponudu'}
          className="w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-110 hover:-translate-y-0.5 active:scale-95"
          style={{
            background: chatOpen ? '#374151' : 'var(--glass-bg-strong)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: chatOpen ? '1px solid #4b5563' : '1px solid var(--glass-border)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
            transition: 'transform 300ms ease, border-color 300ms ease, background-color 300ms ease',
            willChange: 'transform',
          }}
        >
          {chatOpen ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-300" aria-hidden>
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[var(--text)]" aria-hidden>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          )}
        </button>

      </div>
    </>
  );
}
