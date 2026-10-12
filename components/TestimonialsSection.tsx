import { StarIcon, PhoneIcon } from '@phosphor-icons/react/dist/ssr';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from '@/lib/contact';

const testimonials = [
  {
    text: 'Zamenili smo sve prozore u kući za jedan dan. Ekipa tačna i uredna, bez nereda. Kuća je od tada potpuno drugačija.',
    author: 'Dajana Nikolić',
    location: 'Stara Pazova',
    rating: 5,
  },
  {
    text: 'Balkonska vrata i prozori ugrađeni za jedan dan, sve čisto i uredno. Odavno ih poznajem kao komšije, ali posao su odradili potpuno profesionalno.',
    author: 'Dragana Preradović',
    location: 'Stari Banovci',
    rating: 5,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-1" aria-label={`Ocena ${count} od 5`}>
      {Array.from({ length: count }).map((_, i) => (
        <StarIcon key={i} size={14} weight="fill" className="text-[#C9A84C]" />
      ))}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-[15px] text-[#C9A84C] flex-shrink-0"
      style={{
        background: 'rgba(201,168,76,0.12)',
        border: '1px solid rgba(201,168,76,0.2)',
      }}
    >
      {name[0]}
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {testimonials.map((t) => (
        <LiquidGlassCard
          key={t.author}
          className="p-7 rounded-[1.5rem]"
          contentClassName="flex flex-col h-full"
          style={{ border: '1px solid var(--glass-border)' }}
        >
          <div
            className="absolute -top-3 right-0 font-display font-black text-[#C9A84C]/15 leading-none select-none pointer-events-none"
            style={{ fontSize: '6rem' }}
            aria-hidden
          >&ldquo;</div>
          <Stars count={t.rating} />
          <blockquote className="text-[var(--text)] text-[15px] leading-relaxed mt-5 mb-7">
            {t.text}
          </blockquote>
          <div
            className="mt-auto flex items-center gap-3 pt-5"
            style={{ borderTop: '1px solid var(--glass-border)' }}
          >
            <Avatar name={t.author} />
            <div>
              <div className="font-display font-bold text-[var(--text)] text-[14px]">{t.author}</div>
              <div className="text-[var(--text-faint)] text-[12px] mt-0.5">{t.location}</div>
            </div>
          </div>
        </LiquidGlassCard>
      ))}

      {/* Trust card: facts, not a review */}
      <div
        className="md:col-span-2 lg:col-span-1 relative overflow-hidden rounded-[1.5rem] p-7 flex flex-col"
        style={{
          background: 'linear-gradient(135deg, rgba(201,168,76,0.16), rgba(201,168,76,0.06))',
          border: '1px solid rgba(201,168,76,0.24)',
          boxShadow: 'inset 0 1px 0 rgba(201,168,76,0.22)',
        }}
      >
        <div className="font-display font-black text-[3rem] text-[#C9A84C] leading-none tabular-nums">1.000+</div>
        <div className="text-[var(--text-faint)] text-[10px] mt-2 uppercase tracking-[0.14em] font-semibold">
          Ugradnji od 2005.
        </div>
        <p className="text-[var(--text-muted)] text-[14px] leading-relaxed mt-5 mb-7">
          Većina naših klijenata dolazi preko preporuke komšija, rodbine i prijatelja.
          Pozovite i dogovorite besplatnu ponudu.
        </p>
        <a
          href={CONTACT_PHONE_HREF}
          className="mt-auto self-start inline-flex items-center gap-2.5 pl-5 pr-1.5 py-1.5 rounded-full bg-[#C9A84C] text-[#06080F] font-bold text-[13px] hover:bg-[#E8C97A] hover:-translate-y-[2px] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        >
          {CONTACT_PHONE}
          <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(6,8,15,0.15)' }}>
            <PhoneIcon size={13} weight="bold" />
          </span>
        </a>
      </div>
    </div>
  );
}
