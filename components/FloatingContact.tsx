'use client';

import { useState, useCallback } from 'react';

type ChatState = 'idle' | 'loading' | 'success' | 'error';

function PanelHeader({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="flex items-center justify-between px-5 pt-4 pb-3"
      style={{ borderBottom: '1px solid var(--glass-border)' }}
    >
      <div>
        <div className="font-display font-bold text-[var(--text)] text-[14px]">Pošaljite pitanje</div>
        <div className="text-[var(--text-faint)] text-[11px] mt-0.5">Odgovaramo u roku od 24 sata</div>
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
  email, setEmail, message, setMessage,
  chatState, errorMsg, onSubmit, onClose,
}: {
  email: string; setEmail: (v: string) => void;
  message: string; setMessage: (v: string) => void;
  chatState: ChatState; errorMsg: string;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
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
          Odgovorićemo na{' '}
          <span className="text-[var(--text)] font-semibold">{email}</span>{' '}
          u roku od 24 sata.
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

  return (
    <form onSubmit={onSubmit} className="px-5 py-5 space-y-4">
      <div>
        <label className="block text-[var(--text-muted)] text-[11px] font-semibold uppercase tracking-wide mb-1.5">
          Email <span className="text-[#C9A84C]">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vas@email.com"
          required
          className="w-full px-3 py-3 rounded-xl text-[14px] text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 transition-colors"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
        />
      </div>

      <div>
        <label className="block text-[var(--text-muted)] text-[11px] font-semibold uppercase tracking-wide mb-1.5">
          Poruka <span className="text-[#C9A84C]">*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Vaše pitanje ili komentar..."
          required
          rows={5}
          minLength={10}
          maxLength={2000}
          className="w-full px-3 py-3 rounded-xl text-[14px] text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 transition-colors resize-none"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
        />
        <div className="text-right text-[10px] text-[var(--text-faint)] mt-1 tabular-nums">
          {message.length}/2000
        </div>
      </div>

      {chatState === 'error' && errorMsg && (
        <p className="text-red-400 text-[12px]">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={chatState === 'loading'}
        className="w-full py-3 rounded-xl font-bold text-[14px] text-[#06080F] bg-[#C9A84C] hover:bg-[#E8C97A] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {chatState === 'loading' ? 'Slanje...' : 'Pošalji poruku →'}
      </button>
    </form>
  );
}

export default function FloatingContact() {
  const phone = '381653999555';
  const [chatOpen, setChatOpen]   = useState(false);
  const [email, setEmail]         = useState('');
  const [message, setMessage]     = useState('');
  const [chatState, setChatState] = useState<ChatState>('idle');
  const [errorMsg, setErrorMsg]   = useState('');

  const handleClose = useCallback(() => {
    setChatOpen(false);
    if (chatState === 'success') {
      setTimeout(() => {
        setEmail('');
        setMessage('');
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
        body: JSON.stringify({ email: email.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Greška pri slanju.');
      setChatState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Greška pri slanju. Pokušajte ponovo.');
      setChatState('error');
    }
  }, [email, message]);

  const panelProps = { email, setEmail, message, setMessage, chatState, errorMsg, onSubmit: handleSubmit, onClose: handleClose };

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
            className="fixed inset-x-0 bottom-0 z-[49] sm:hidden rounded-t-3xl overflow-hidden"
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
            className="w-80 rounded-2xl overflow-hidden shadow-2xl shadow-black/40"
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
          className="group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 active:scale-95"
          style={{ background: '#7360F2', boxShadow: '0 6px 24px rgba(115,96,242,0.45)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="white" aria-hidden>
            <path d="M11.985.015C5.4.015.017 5.4.017 11.985c0 2.08.543 4.036 1.495 5.73L0 24l6.51-1.706A11.936 11.936 0 0011.985 24c6.585 0 11.968-5.383 11.968-11.968C23.953 5.447 18.57.015 11.985.015zm5.85 16.696c-.268.748-1.548 1.43-2.14 1.52-.54.082-1.225.116-1.977-.124-.455-.149-1.039-.349-1.782-.681-3.122-1.345-5.16-4.484-5.316-4.692-.155-.208-1.264-1.679-1.264-3.202 0-1.523.8-2.27 1.084-2.58.28-.307.612-.384.815-.384h.574c.26 0 .548.01.794.604.287.694.975 2.388 1.06 2.562.085.174.142.378.03.607-.114.229-.171.372-.343.572-.171.2-.361.446-.514.6-.171.17-.35.356-.15.697.2.342.89 1.469 1.907 2.38 1.31 1.168 2.415 1.53 2.758 1.703.343.172.543.144.743-.085.2-.228.855-.998 1.083-1.342.228-.343.456-.285.77-.17.314.113 1.997.942 2.338 1.114.342.17.57.257.655.4.085.141.085.82-.183 1.68z" />
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
          className="group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 active:scale-95"
          style={{ background: '#25D366', boxShadow: '0 6px 24px rgba(37,211,102,0.45)' }}
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
          aria-label={chatOpen ? 'Zatvori kontakt formu' : 'Pošaljite pitanje emailom'}
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 active:scale-95"
          style={{
            background: chatOpen ? '#374151' : 'var(--glass-bg-strong)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: chatOpen ? '1px solid #4b5563' : '1px solid var(--glass-border)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
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
