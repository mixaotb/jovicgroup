-- ============================================================
-- JOVIĆ GROUP — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'manager', 'worker')),
  full_name   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name    TEXT NOT NULL,
  phone            TEXT NOT NULL,
  email            TEXT,
  location         TEXT NOT NULL CHECK (location IN ('Srbija', 'Inostranstvo')),
  town             TEXT,
  address          TEXT,
  status           TEXT NOT NULL DEFAULT 'na_cekanju' CHECK (
                     status IN ('na_cekanju', 'u_proizvodnji', 'isporuceno', 'otkazano')
                   ),
  total_price      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method   TEXT NOT NULL DEFAULT 'cash_on_delivery' CHECK (
                     payment_method IN ('cash_on_delivery', 'racun')
                   ),
  dimensions_data  JSONB NOT NULL DEFAULT '{}',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDER ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('window_single', 'window_double', 'door')),
  material       TEXT NOT NULL CHECK (material IN ('PVC', 'ALU')),
  width          NUMERIC NOT NULL,
  height         NUMERIC NOT NULL,
  quantity       INTEGER NOT NULL DEFAULT 1,
  dimensions_data JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items(order_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage order_items"
  ON public.order_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- TASKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  description  TEXT,
  assigned_to  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date     DATE,
  order_id     UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks   ENABLE ROW LEVEL SECURITY;

-- ORDERS: public insert (from calculator), authenticated read/update
CREATE POLICY "Allow public order insertion"
  ON public.orders FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (true);

-- TASKS: authenticated only
CREATE POLICY "Authenticated users can manage tasks"
  ON public.tasks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- USERS: authenticated read
CREATE POLICY "Authenticated users can read users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own record"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- ============================================================
-- SEED: Insert admin user (update email to your actual email)
-- ============================================================
-- After creating the user in Supabase Auth dashboard, link them here:
-- INSERT INTO public.users (id, email, role, full_name)
-- VALUES ('<your-supabase-auth-uuid>', 'admin@jovicgroup.rs', 'admin', 'Jović Admin');

-- ============================================================
-- MIGRATION: Add town and address to orders
-- Run this if the orders table already exists:
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS town TEXT;
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address TEXT;

-- ============================================================
-- MIGRATION: Add manager role
-- Run this if the users table already exists:
-- ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
-- ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'worker'));
-- ============================================================

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type       TEXT NOT NULL DEFAULT 'new_order',
  title      TEXT NOT NULL,
  body       TEXT,
  order_id   UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Enable Realtime for live CRM browser notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS orders_status_idx    ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_location_idx  ON public.orders(location);
CREATE INDEX IF NOT EXISTS orders_created_idx   ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS tasks_assigned_idx   ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_status_idx     ON public.tasks(status);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read, created_at DESC);
