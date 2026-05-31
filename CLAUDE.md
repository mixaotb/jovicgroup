@AGENTS.md

# Jović Group — Codebase Guide

## Stack

- **Next.js 15** (App Router, React 19, Server Components)
- **Tailwind CSS** — dark-only UI, gold `#C9A84C` accent on navy/slate base
- **Supabase** — Postgres, RLS, Auth, Realtime
- **Resend** — transactional email
- **TypeScript** — strict mode

Read `node_modules/next/dist/docs/` before touching routing or data-fetching — this version has breaking changes from training data.

---

## Project Structure

```
app/
  page.tsx                  # Public landing page
  kalkulator/page.tsx       # Price calculator + order form (public)
  crm/
    login/page.tsx          # Auth page
    dashboard/page.tsx      # Full CRM — orders, tasks, finance, users
  api/
    orders/route.ts         # POST (public), GET (auth)
    orders/[id]/route.ts    # PATCH, DELETE (auth)
    tasks/route.ts          # GET, POST (auth)
    tasks/[id]/route.ts     # PATCH, DELETE (auth)
    users/route.ts          # GET (auth)
    users/[id]/route.ts     # PATCH (auth)
    finance/route.ts        # GET aggregate stats (auth)
    notifications/route.ts  # GET, PATCH (auth)
    auth/login/route.ts     # POST — Supabase signInWithPassword
    auth/logout/route.ts    # POST — Supabase signOut

components/
  HeroSection.tsx           # Landing hero
  NotificationBell.tsx      # CRM realtime bell + toast

lib/
  pricing.ts                # calculatePrice(), formatRSD(), cost factors
  email.ts                  # sendNewOrderEmail(), sendOrderConfirmationEmail()
  ratelimit.ts              # In-memory rate limiter for public routes
  supabase/
    client.ts               # createBrowserClient (client components)
    server.ts               # createClient (server — cookies)
    admin.ts                # createAdminClient (service role — bypasses RLS)

types/index.ts              # All shared types: Order, OrderItem, Task, User, etc.
middleware.ts               # Redirects unauthenticated requests away from /crm
supabase/schema.sql         # Full DB schema + RLS policies + migrations
```

---

## Database Tables

| Table | Notes |
|---|---|
| `orders` | customer_name, phone, email, location, town, address, status, total_price, payment_method, notes |
| `order_items` | order_id FK, type, material, width, height, quantity |
| `tasks` | title, description, assigned_to FK, status, due_date, order_id FK |
| `users` | id mirrors Supabase auth UID, role: admin/manager/worker |
| `notifications` | type, title, body, order_id FK, read, created_at |

RLS: `orders` allows anon INSERT (public form), authenticated SELECT/UPDATE. Everything else requires authenticated. Admin client (`service_role`) bypasses all RLS — use only in server-side API routes.

Realtime is enabled on `notifications` — the CRM bell subscribes via `postgres_changes`.

---

## Auth Flow

- Login: `POST /api/auth/login` → `supabase.auth.signInWithPassword` → sets cookies via `@supabase/ssr`
- Guard: `middleware.ts` checks session cookie, redirects `/crm/*` to `/crm/login` if unauthenticated
- Server routes: use `createClient()` from `lib/supabase/server` then `supabase.auth.getUser()` to verify
- Public routes (order submission): use `createAdminClient()` to bypass RLS

---

## Pricing Logic (`lib/pricing.ts`)

```
perUnit = width × height × MATERIAL_FACTOR × TYPE_MULTIPLIER
total   = (perUnit × quantity) + DELIVERY_FEE
```

| Material | Factor |
|---|---|
| PVC | 0.0028 |
| ALU | 0.0045 |

| Type | Multiplier |
|---|---|
| window_single | 1.0 |
| window_double | 1.6 |
| door | 1.8 |

| Location | Delivery |
|---|---|
| Srbija | 2,500 RSD |
| Inostranstvo | 18,000 RSD |

---

## Email (`lib/email.ts`)

Two functions, both fire-and-forget from `app/api/orders/route.ts`:

- `sendNewOrderEmail(data)` — sends to `ADMIN_EMAIL` env var
- `sendOrderConfirmationEmail(data)` — sends to `data.email` only if provided

Both return early if `RESEND_API_KEY` is missing — safe to run without email configured.

Required env vars: `RESEND_API_KEY`, `ADMIN_EMAIL`
Optional: `RESEND_FROM_EMAIL` (defaults to `onboarding@resend.dev` for testing)

---

## Notifications

Order submission fires a Supabase insert into `notifications` (fire-and-forget alongside emails).
`NotificationBell.tsx` subscribes to `postgres_changes` INSERT events and shows a toast + unread badge.
`GET /api/notifications` returns last 20. `PATCH /api/notifications` marks all (or specific ids) as read.

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
ADMIN_EMAIL=
RESEND_FROM_EMAIL=        # optional
```

---

## Key Conventions

- Serbian copy throughout — keep all user-facing strings in Serbian
- Products: PVC uses Alphacan/Schüco profiles; ALU uses Profilink/Schüco
- Non-blocking side effects: always use `void Promise.allSettled([...])` for email + notifications after order insert
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client — admin client is server-only
- Order status values: `na_cekanju`, `u_proizvodnji`, `isporuceno`, `otkazano`
- Payment methods: `cash_on_delivery`, `racun`
- Locations: `Srbija`, `Inostranstvo`
