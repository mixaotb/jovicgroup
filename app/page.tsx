import React from 'react';

export default function TemporaryLanding() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans">
      
      {/* GLAVNI NAV / LOGO DEO */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              JOVIĆ GROUP
            </span>
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold -mt-1">
              PVC & ALU Stolarija
            </span>
          </div>
          <div className="hidden sm:flex space-x-6 text-sm text-slate-400">
            <span className="hover:text-blue-400 transition-colors">O nama</span>
            <span className="hover:text-blue-400 transition-colors">Uskoro</span>
            <span className="hover:text-blue-400 transition-colors">Kontakt</span>
          </div>
        </div>
      </header>

      {/* HERO / GLAVNI SADRŽAJ */}
      <main className="flex-grow flex items-center justify-center px-4 py-20 relative overflow-hidden">
        {/* Blago svetlo u pozadini da razbije crnilo (bez slika) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-3xl text-center relative z-10 space-y-8">
          {/* Tag / Status */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium uppercase tracking-wider mx-auto">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Novi sajt u izradi
          </div>

          {/* Glavni naslov */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Vrhunska stolarija <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">
              skrojena po vašoj meri.
            </span>
          </h1>

          {/* Opis biznisa */}
          <p className="text-base sm:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
            Dugogodišnja tradicija u proizvodnji i ugradnji PVC i ALU prozora i vrata. 
            Naš novi online sistem i CRM za brzu izradu ponuda stižu uskoro.
          </p>

          {/* Info kartice sa delatnostima */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto pt-6">
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide">Tradicija</h3>
              <p className="text-xs text-slate-400 mt-1">Porodični biznis zasnovan na poverenju i preporuci od 2005.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wide">Kvalitet</h3>
              <p className="text-xs text-slate-400 mt-1">Koristimo isključivo sertifikovane profile i okove.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide">Inostranstvo</h3>
              <p className="text-xs text-slate-400 mt-1">Direktna isporuka i profesionalna ugradnja u Srbiji.</p>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER / KONTAKT PODACI */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-8 text-center text-sm text-slate-500">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <p className="font-medium text-slate-400">
            Jović Group d.o.o. &copy; {new Date().getFullYear()} · Sva prava zadržana.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
            <span>📍 Srbija / Stari Banovci, Stevana Tišme 112</span>
            <span>✉️ info@jovicgroup.com</span>
          </div>
        </div>
      </footer>

    </div>
  );
}