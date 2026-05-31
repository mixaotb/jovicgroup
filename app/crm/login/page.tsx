'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function CrmLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [light, setLight] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError('Unesite email i lozinku');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Greška pri prijavi');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Greška. Proverite internet konekciju.');
    } finally {
      setLoading(false);
    }
  }

  const t = {
    bg: light ? 'bg-slate-100' : 'bg-[#0B1120]',
    card: light ? 'bg-white border-slate-200 shadow-[0_24px_80px_rgba(0,0,0,0.10)]' : 'bg-[#111827] border-slate-800 shadow-[0_24px_80px_rgba(0,0,0,0.6)]',
    heading: light ? 'text-slate-900' : 'text-white',
    sub: light ? 'text-slate-500' : 'text-slate-500',
    label: light ? 'text-slate-700' : 'text-slate-300',
    input: light
      ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#C9A84C]/70 focus:ring-[#C9A84C]/15'
      : 'bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:border-[#C9A84C]/60 focus:ring-[#C9A84C]/20',
    eyeBtn: light ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300',
    footer: light ? 'text-slate-400' : 'text-slate-700',
    toggleBtn: light ? 'text-slate-500 hover:text-slate-800' : 'text-slate-600 hover:text-slate-300',
    gridColor: light ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.8)',
    gridOpacity: light ? 'opacity-[0.07]' : 'opacity-[0.025]',
  };

  return (
    <div className={`min-h-screen ${t.bg} flex items-center justify-center px-6 transition-colors duration-300`}>
      {/* Background grid */}
      <div
        className={`fixed inset-0 pointer-events-none ${t.gridOpacity}`}
        style={{
          backgroundImage: `
            linear-gradient(${t.gridColor} 1px, transparent 1px),
            linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Theme toggle */}
      <button
        type="button"
        onClick={() => setLight(!light)}
        aria-label="Promeni temu"
        className={`fixed top-5 right-5 p-2 rounded-lg transition-colors ${t.toggleBtn}`}
      >
        {light ? (
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className={`rounded-2xl border ${t.card} overflow-hidden transition-colors duration-300`}>
          {/* Top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[#C9A84C] via-[#E8C97A] to-[#C9A84C]" />

          <div className="px-8 py-10">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-10">
              <div className="w-9 h-9 relative">
                <Image
                  src="/logo.png"
                  alt="Jović Group"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <div className="font-display text-xl font-bold">
                <span className={t.heading}>Jović </span><span className="text-[#C9A84C]">Group</span>
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className={`font-display text-2xl font-bold mb-2 ${t.heading}`}>CRM Prijava</h1>
              <p className={`${t.sub} text-sm`}>Interni sistem upravljanja narudžbinama</p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center gap-2">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${t.label}`}>
                  Email adresa
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jovicgroup.rs"
                  autoComplete="email"
                  required
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-1 transition-colors ${t.input}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${t.label}`}>
                  Lozinka
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm focus:outline-none focus:ring-1 transition-colors ${t.input}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1 ${t.eyeBtn}`}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
                        <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                        <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#C9A84C] text-slate-950 font-bold text-sm hover:bg-[#E8C97A] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 mt-2 shadow-[0_4px_20px_rgba(201,168,76,0.2)]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Prijavljivanje...
                  </span>
                ) : (
                  'Prijavite se'
                )}
              </button>
            </form>
          </div>
        </div>

        <p className={`text-center text-xs mt-5 ${t.footer}`}>
          Jović Group CRM · Interni pristup
        </p>
      </div>
    </div>
  );
}
