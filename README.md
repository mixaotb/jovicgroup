# Jović Group — PVC & ALU Corporate Website + CRM

Full-stack Next.js 15 application for a PVC/ALU manufacturing and installation business.
Built with the App Router, Tailwind CSS, and Supabase.

---

## Project Structure

```
jovic-group/
├── app/
│   ├── page.tsx                    # Public landing page
│   ├── layout.tsx                  # Root layout (fonts, metadata)
│   ├── globals.css                 # Global styles + Tailwind
│   ├── kalkulator/
│   │   └── page.tsx                # Interactive price calculator + order form
│   ├── crm/
│   │   ├── layout.tsx              # CRM shell layout
│   │   ├── login/page.tsx          # CRM login page
│   │   └── dashboard/page.tsx      # Full CRM dashboard (orders + tasks)
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts      # POST /api/auth/login
│       │   └── logout/route.ts     # POST /api/auth/logout
│       ├── orders/
│       │   ├── route.ts            # GET + POST /api/orders
│       │   └── [id]/route.ts       # PATCH + DELETE /api/orders/:id
│       └── tasks/
│           ├── route.ts            # GET + POST /api/tasks
│           └── [id]/route.ts       # PATCH + DELETE /api/tasks/:id
├── lib/
│   ├── pricing.ts                  # Price calculation logic
│   └── supabase/
│       ├── client.ts               # Browser Supabase client
│       └── server.ts               # Server Supabase client (SSR)
├── types/
│   └── index.ts                    # All TypeScript types
├── middleware.ts                   # Auth guard for /crm routes
├── supabase/
│   └── schema.sql                  # Full DB schema + RLS policies
└── public/
    └── logo.png                    # ← Place your logo here
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New Project.

### 3. Run the database schema

In the Supabase SQL Editor, paste and run the entire contents of `supabase/schema.sql`.

### 4. Create an admin user

In Supabase Dashboard → Authentication → Users → Add User.
Use email/password. Then run this SQL to link them to the `users` table:

```sql
INSERT INTO public.users (id, email, role, full_name)
VALUES ('<your-auth-uuid>', 'admin@jovicgroup.rs', 'admin', 'Vaše Ime');
```

Replace `<your-auth-uuid>` with the UUID shown in the Auth Users list.

### 5. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Supabase URL and anon key from:
**Supabase Dashboard → Project Settings → API**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 6. Add your logo

Copy your `Logo.png` into the `public/` folder and rename it `logo.png`.

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Pages

| Route             | Description                                      |
|-------------------|--------------------------------------------------|
| `/`               | Public landing page                              |
| `/kalkulator`     | PVC/ALU price calculator + order submission      |
| `/crm/login`      | CRM login (email + password via Supabase Auth)   |
| `/crm/dashboard`  | Orders table + Task board (protected)            |

---

## Pricing Formula

```
Price per unit = Width (mm) × Height (mm) × MaterialFactor × TypeMultiplier
Total          = (Price per unit × Quantity) + DeliveryFee
```

| Material | Factor   |
|----------|----------|
| PVC      | 0.0028   |
| ALU      | 0.0045   |

| Type            | Multiplier |
|-----------------|------------|
| Window (single) | 1.0        |
| Window (double) | 1.6        |
| Door            | 1.8        |

| Location      | Delivery Fee |
|---------------|-------------|
| Srbija        | 2,500 RSD   |
| Inostranstvo  | 18,000 RSD  |

Adjust these constants in `lib/pricing.ts` to match your actual pricing.

---

## Deployment (Vercel)

```bash
npm install -g vercel
vercel
```

Add the two environment variables in the Vercel dashboard under
**Project Settings → Environment Variables**.

---

## Design System

### Brand Colors

| Token | Hex | Use |
|---|---|---|
| `gold` | `#C9A84C` | Primary accent |
| `gold-light` | `#E8C97A` | Hover states |
| `gold-muted` | `#8A6F32` | Secondary text |
| `navy` | `#1A2744` | Dark overlay |
| `navy-mid` | `#0F1C38` | Dark background |
| `slate-950` | `#0B1120` | Page background |
| `slate-900` | `#111827` | Card background |

Dark-only UI. Gold accent on deep navy/slate base. Tailwind config at `tailwind.config.ts`.

Custom utilities: `.gold-rule`, `.badge-pending/production/delivered/cancelled`, `.animate-fade-up`, `.animate-fade-in`, `.delay-100` → `.delay-600`.

---

## Available Design Skills (`.agents/skills/`)

These Claude Code skills are available for frontend redesign work:

| Skill | Invocation | What It Does |
|---|---|---|
| **impeccable** | `/impeccable [command] [target]` | Full design system — craft, audit, polish, animate, typeset, layout, colorize, bolder, quieter, distill, overdrive, live browser iteration |
| **redesign-existing-projects** | Mention in task | Diagnoses generic AI patterns, applies targeted upgrades without breaking functionality |
| **high-end-visual-design** | Mention in task | Premium visual design system reference |
| **design-taste-frontend** | Mention in task | Frontend design taste reference |
| **brandkit** | Mention in task | Brand guidelines enforcement |
| **image-to-code** | Mention in task | Convert screenshots/mockups to working code |
| **imagegen-frontend-web** | Mention in task | Generate web UI from prompts |
| **imagegen-frontend-mobile** | Mention in task | Generate mobile UI from prompts |
| **emil-design-eng** | Mention in task | Design engineering consultation |
| **graphify** | `/graphify [path]` | Build/query knowledge graph for token-efficient codebase navigation |

**Recommended redesign workflow:** `/impeccable audit` to score the current state → `/impeccable craft [page]` for targeted work, or reference `redesign-existing-projects` for a systematic pass.

---

## Tech Stack

- **Next.js 15** — App Router, Server Components, Route Handlers
- **Tailwind CSS 3** — Utility-first styling
- **Supabase** — PostgreSQL database, Row Level Security, Auth
- **@supabase/ssr** — Cookie-based auth for Next.js SSR
- **Playfair Display + DM Sans** — Google Fonts via next/font
