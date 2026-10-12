# Jović Group — Design System Reference

> For building new pages (e.g. portfolio) that match the existing site's look.

---

## Fonts

Loaded via `next/font/google` in `app/layout.tsx`, set as CSS vars on `<html>`:

| Var | Font | Use |
|---|---|---|
| `--font-display` | Playfair Display (serif) | All `h1`–`h4`, `.font-display` |
| `--font-body` | DM Sans (sans-serif) | Body text, UI labels |

Tailwind: `font-display`, `font-body` utility classes available.

Heading defaults (from `globals.css`):
```css
font-family: var(--font-display);
font-weight: 700;
letter-spacing: -0.01em;
text-wrap: balance;
```

Responsive headline size pattern: `text-[clamp(2rem,4vw,3rem)]` for section titles, `text-[clamp(1.75rem,7.5vw,6.5rem)]` for hero H1.

---

## Color Tokens

### CSS Variables (both modes)

```
--gold:          #C9A84C   ← primary accent, used everywhere
--gold-light:    #E8C97A   ← hover/gradient end
--gold-muted:    #8A6F32   ← gradient start on ScrollProgress
--navy:          #1A2744
--navy-mid:      #0F1C38
```

### Light Mode (`:root`)
```
--bg:            #F7F6F2
--bg-surface:    #FFFFFF
--bg-raised:     #F1F0EC
--text:          #111827
--text-muted:    #6B7280
--text-faint:    #6B7280
--border:        #E5E7EB
--border-strong: #D1D5DB

--glass-bg:          var(--bg-surface)           ← solid white
--glass-bg-strong:   var(--bg-raised)
--glass-border:      var(--border)
--glass-shine:       transparent
```

### Dark Mode (`.dark`)
```
--bg:            #06080F
--bg-surface:    #0D1117
--bg-raised:     #111827
--text:          #F1F5F9
--text-muted:    #94A3B8
--text-faint:    #7B8B9E
--border:        #1E293B
--border-strong: #334155

--glass-bg:       linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))
--glass-bg-strong:linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))
--glass-border:   rgba(255,255,255,0.09)
--glass-shine:    rgba(255,255,255,0.10)
```

Theme is toggled by adding/removing `.dark` on `<html>`. Dark is default (set by inline script in layout before paint). Stored in `localStorage('theme')`.

Tailwind custom colors: `gold`, `gold-light`, `gold-muted`, `navy`, `navy-mid`.

---

## Glass Effect System

Three CSS utility classes in `globals.css`:

### `.glass`
```css
background: linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04));
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255,255,255,0.10);
box-shadow:
  inset 0 1px 0 rgba(255,255,255,0.14),
  inset 0 -1px 0 rgba(255,255,255,0.04),
  0 20px 48px rgba(0,0,0,0.28);
```

### `.glass-strong`
```css
background: linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06));
backdrop-filter: blur(32px) saturate(200%) contrast(1.04);
border: 1px solid rgba(255,255,255,0.14);
box-shadow:
  inset 0 1px 0 rgba(255,255,255,0.22),
  inset 0 -1px 0 rgba(255,255,255,0.06),
  0 32px 64px rgba(0,0,0,0.4);
```

### `.glass-gold`
```css
background: linear-gradient(135deg, rgba(201,168,76,0.14), rgba(201,168,76,0.05));
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(201,168,76,0.22);
box-shadow:
  inset 0 1px 0 rgba(201,168,76,0.18),
  0 20px 48px rgba(0,0,0,0.25);
```

### Theme-aware glass (use CSS vars, adapts light/dark automatically)
```jsx
style={{
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
}}
```

### Double-bezel pattern (used in About card, CTA card)
Outer shell `p-[6px] rounded-[2rem]` + inner content `rounded-[calc(2rem-6px)]`:
```jsx
<div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', }} className="p-[6px] rounded-[2rem]">
  <div style={{ background: 'var(--glass-bg-strong)', backdropFilter: 'blur(32px) saturate(200%)', border: '1px solid var(--glass-border)', boxShadow: 'inset 0 1px 0 var(--glass-shine), 0 32px 64px rgba(0,0,0,0.2)' }} className="rounded-[calc(2rem-6px)] p-7">
    {/* content */}
  </div>
</div>
```

### Gold-tinted glass (used in hero eyebrow badge, features cell 2, CTA outer)
```jsx
style={{
  background: 'linear-gradient(135deg, rgba(201,168,76,0.16), rgba(201,168,76,0.06))',
  border: '1px solid rgba(201,168,76,0.24)',
  backdropFilter: 'blur(20px)',
  boxShadow: 'inset 0 1px 0 rgba(201,168,76,0.22)',
}}
```

---

## LiquidGlassCard Component

`components/LiquidGlassCard.tsx` — interactive client component.

**What it does:**
- Tracks mouse position → shifts SVG `feTurbulence` displacement scale (max 12) on hover
- Moves specular `radial-gradient` highlight to follow cursor
- 4-layer stack: SVG distortion | semi-transparent tint | specular highlight | content
- Distortion + backdrop-filter only on `(hover: hover) and (pointer: fine)` — no touch artifacts
- Resets on `mouseleave`

**Usage:**
```jsx
import LiquidGlassCard from '@/components/LiquidGlassCard';

<LiquidGlassCard
  className="rounded-[1.5rem] p-6 flex flex-col gap-5 hover:scale-[1.01] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
  style={{ border: '1px solid var(--glass-border)' }}
>
  {/* content */}
</LiquidGlassCard>
```

---

## GlassNav Component

`components/GlassNav.tsx` — fixed floating pill nav.

- 4-layer glass stack (shadow | blur+distortion | tint | specular | content)
- SVG `feTurbulence` + `feDisplacementMap` (scale 77) embedded inline
- `IntersectionObserver` sentinel → `scrolled` state drives tint opacity increase
- Dark: tint `rgba(0,0,0,0.18→0.32)` | Light: `rgba(255,255,255,0.28→0.42)`
- CTA button: `bg-[#C9A84C] text-[#06080F]` pill with arrow icon, `hover:scale-[1.03]`
- No viewport-width constraint — centering via `flex justify-center` on `<header>`

---

## Animation Primitives

### `RevealUp` component
`components/RevealUp.tsx` — scroll-triggered `motion/react` animation.

```jsx
<RevealUp delay={0.05}>  {/* delay in seconds */}
  {/* anything */}
</RevealUp>
```

- `initial: { opacity: 0, y: 28 }` → `whileInView: { opacity: 1, y: 0 }`
- `viewport: { once: true, amount: 0.12 }`
- `transition: { duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }` (custom spring-like)
- SSR-safe: renders plain `<div>` until mounted on client
- Respects `prefers-reduced-motion`

### CSS fallback animations (no JS, SSR-safe)
```css
.animate-fade-up  → fadeUp  0.65s cubic-bezier(0.16, 1, 0.3, 1)
.animate-fade-in  → fadeIn  0.5s ease-out

/* stagger delays */
.delay-100 / .delay-200 / .delay-300 / .delay-400 / .delay-500 / .delay-600
```
Used in hero: `animate-fade-up delay-100` etc.

### `MagneticButton` component
`components/MagneticButton.tsx`

- Wraps any child, applies spring-based cursor-pull (motion/react `useSpring`)
- `strength` prop (default `0.32`, CTA uses `0.4`)
- Desktop only (`hover: hover` + `pointer: fine` check)
- `stiffness: 220, damping: 14, mass: 0.4`

```jsx
<MagneticButton strength={0.4}>
  <Link href="/..." className="...">...</Link>
</MagneticButton>
```

### `ScrollProgress` component
`components/ScrollProgress.tsx` — 2px fixed bar at very top, `z-[70]`.

```css
background: linear-gradient(90deg, #8A6F32, #C9A84C 45%, #E8C97A);
box-shadow: 0 0 12px rgba(201,168,76,0.55);
```
Driven by `useScroll` + `useSpring` (`stiffness: 120, damping: 30, mass: 0.3`).

### `AnimatedBar` component
`components/AnimatedBar.tsx` — horizontal progress bar, triggers on InView.

```jsx
<AnimatedBar pct={78} delay={0} />
<AnimatedBar pct={95} delay={0.15} />
```

3px height, `linear-gradient(90deg, #C9A84C, #E8C97A)` fill, `1.4s cubic-bezier(0.22,1,0.36,1)` transition.

### `CountUp` component
`components/CountUp.tsx` — animates numeric strings on InView.

```jsx
<CountUp value="1.200+" className="font-display text-[2rem] font-bold text-[var(--text)] leading-none tabular-nums block" />
```

Parses `"1.200+"` → num `1200` + suffix `+`. Easing: `easeOutQuart`. Duration: `1.7s` default.

---

## Background Glow Orbs

Decorative blurred circles. No pointer events. Used in every section.

Pattern:
```jsx
<div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#C9A84C]/10 dark:bg-[#C9A84C]/8 blur-[120px] pointer-events-none" />
<div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-[#1A2744]/30 dark:bg-[#1A2744]/50 blur-[100px] pointer-events-none" />
```

For richer sections (features, testimonials): add colorful accent orbs:
```jsx
<div className="absolute top-[8%] right-[6%] w-[420px] h-[420px] rounded-full bg-blue-400/20 dark:bg-blue-500/20 blur-[120px] pointer-events-none" />
<div className="absolute bottom-[8%] left-[4%] w-[360px] h-[360px] rounded-full bg-purple-400/18 blur-[110px] pointer-events-none" />
<div className="absolute top-[45%] left-[55%] w-[280px] h-[280px] rounded-full bg-teal-400/18 blur-[90px] pointer-events-none" />
```

---

## Section Structure Pattern

Every section:
```jsx
<section id="..." className="relative py-32">
  {/* glow orbs — absolute positioned */}
  <div className="absolute ... rounded-full bg-[...]/opacity blur-[...px] pointer-events-none" />

  <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
    {/* Section header */}
    <RevealUp className="mb-14">
      <div className="gold-rule mb-5" />
      <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-tight text-[var(--text)]">
        Section <span className="text-[#C9A84C]">title</span>
      </h2>
    </RevealUp>

    {/* Content */}
    <RevealUp delay={0.05}>
      {/* ... */}
    </RevealUp>
  </div>
</section>
```

### Gold rule divider
```jsx
<div className="gold-rule mb-5" />
/* = width:40px height:2px background: linear-gradient(90deg, #C9A84C, #E8C97A) border-radius:1px */
```

---

## GlassIcon Pattern

Small gold-tinted icon wrapper (used as card icons):
```jsx
<div
  className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#C9A84C] flex-shrink-0"
  style={{
    background: 'rgba(201,168,76,0.12)',
    border: '1px solid rgba(201,168,76,0.22)',
    boxShadow: 'inset 0 1px 0 rgba(201,168,76,0.18)',
  }}
>
  <SomePhosphorIcon size={22} weight="light" />
</div>
```

---

## CTA Button Pattern

Gold pill with nested circular arrow:
```jsx
<Link
  href="/..."
  className="group inline-flex items-center pl-7 pr-2 py-2 rounded-full bg-[#C9A84C] text-[#06080F] font-bold text-[15px] hover:bg-[#E8C97A] hover:-translate-y-[3px] hover:shadow-[0_14px_44px_rgba(201,168,76,0.5)] active:translate-y-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.025] active:scale-[0.975] shadow-[0_8px_40px_rgba(201,168,76,0.35)]"
>
  <span>Label</span>
  <span
    className="ml-4 w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-[2px] group-hover:-translate-y-[1px] group-hover:scale-105"
    style={{ background: 'rgba(6,8,15,0.15)' }}
  >
    <ArrowRightIcon size={15} weight="bold" />
  </span>
</Link>
```

Secondary ghost button:
```jsx
<a
  href="#..."
  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold text-[14px] text-[var(--text-muted)] hover:text-[var(--text)] transition-all duration-300"
  style={{
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  }}
>
  Label
</a>
```

---

## Gold Tag / Pill Pattern

Small label chips:
```jsx
<span
  className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wide text-[#C9A84C]"
  style={{
    background: 'rgba(201,168,76,0.12)',
    border: '1px solid rgba(201,168,76,0.25)',
  }}
>
  Tag
</span>
```

---

## Hover Scale Pattern

Cards, cells — consistent hover lift:
```jsx
className="hover:scale-[1.01] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
// smaller cards: hover:scale-[1.02]
// large/wide cards: hover:scale-[1.005]
```
Always `transform: 'translateZ(0)'` in style to force GPU layer.

---

## Photo/Image Section Pattern

Full-bleed image with gradient overlays:
```jsx
<div className="relative overflow-hidden rounded-[1.5rem] group cursor-default" style={{ minHeight: '260px' }}>
  <Image src="/..." alt="..." fill className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]" sizes="..." />
  <div className="absolute inset-0 bg-gradient-to-br from-[#06080F]/80 via-[#06080F]/50 to-transparent" />
  {/* content overlaid bottom-left */}
  <div className="absolute inset-0 flex flex-col justify-end p-7" style={{ background: 'linear-gradient(to top, rgba(6,8,15,0.85) 30%, transparent)' }}>
    {/* ... */}
  </div>
</div>
```

---

## Bento Grid Pattern

Unequal columns, mixed sizes (no 3-equal pattern):
```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="md:col-span-2">...</div>   {/* featured large */}
  <div>...</div>                              {/* single */}
  <div>...</div>                              {/* single */}
  <div>...</div>                              {/* single */}
  <div>...</div>                              {/* single */}
  <div className="md:col-span-3">...</div>   {/* full width */}
</div>
```

---

## Layout Constants

```
max-w-7xl mx-auto     ← max content width
px-5 sm:px-8         ← horizontal padding
py-32                ← section vertical padding
gap-4 (bento grid)
gap-16 lg:gap-24 (two-col layout)
rounded-[1.5rem]     ← standard card radius
rounded-[2rem]       ← large/featured card radius
```

---

## Status Badges (CRM, but reusable)

```
.badge-pending    → amber-500/15 bg, amber text, amber/30 border
.badge-production → blue-500/15  bg
.badge-delivered  → emerald-500/15 bg
.badge-cancelled  → red-500/15   bg
```

---

## Global Baseline

- Scrollbar: 5px, gold thumb `rgba(201,168,76,0.3)` → `0.6` on hover
- Selection: `rgba(201,168,76,0.25)` background
- Focus ring: `2px solid #C9A84C`, offset 2px
- Grain overlay: `fixed inset-0 z-[60] pointer-events-none opacity-[0.016] mix-blend-overlay` using inline SVG fractalNoise (in `layout.tsx` body)
- Smooth scroll: `html { scroll-behavior: smooth }` + `SmoothScroll` Lenis wrapper
- `SmoothScroll` wraps all page content in `app/layout.tsx`

---

## Icons

All from `@phosphor-icons/react`. Server components use `/dist/ssr` import:
```tsx
import { ArrowRightIcon, CheckCircleIcon } from '@phosphor-icons/react/dist/ssr';
```
Client components use direct import:
```tsx
import { ArrowRightIcon } from '@phosphor-icons/react';
```
Consistent weight: `weight="light"` for decorative, `weight="bold"` for CTA arrows, `weight="fill"` for status icons.

---

## Motion Library

`motion/react` (Framer Motion v11+). Key hooks used:
- `useScroll`, `useSpring`, `useMotionValue` — ScrollProgress, MagneticButton
- `useInView` — AnimatedBar, CountUp
- `useReducedMotion` — all animated components respect this
- `motion.div` — RevealUp

---

## Portfolio Page Specifics (for demo panel)

For the portfolio/demo page:
- Use same `GlassNav` (already has nav links, import and drop in)
- Use `ScrollProgress` at top
- Wrap body content in `<div className="relative bg-theme text-theme overflow-x-hidden">`
- Add skip link pattern from `app/page.tsx`
- Section with demo panel: use `LiquidGlassCard` or double-bezel pattern for the panel container
- Glow orbs behind the demo area for depth
- `RevealUp` on all above-fold text blocks
- If demo is interactive/client: mark component `'use client'`
