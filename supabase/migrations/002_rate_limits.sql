-- ============================================================
-- Rate limiting table and atomic increment function
-- Run this in Supabase SQL Editor for existing deployments.
-- New deployments: included in schema.sql.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key       TEXT PRIMARY KEY,
  count     INTEGER NOT NULL DEFAULT 1,
  reset_at  TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Block direct access from anon/authenticated roles; only service_role may access
CREATE POLICY "No direct client access to rate_limits"
  ON public.rate_limits FOR ALL
  TO anon, authenticated
  USING (false);

-- Atomic check-and-increment: inserts a new window or increments within the current one.
-- Returns TRUE if the request is within the limit, FALSE if it should be blocked.
-- SECURITY DEFINER so it runs with the owner's privileges regardless of caller role.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key       TEXT,
  p_limit     INTEGER,
  p_window_ms BIGINT
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count     INTEGER;
  v_new_reset TIMESTAMPTZ;
BEGIN
  v_new_reset := NOW() + (p_window_ms || ' milliseconds')::INTERVAL;

  INSERT INTO public.rate_limits (key, count, reset_at)
    VALUES (p_key, 1, v_new_reset)
  ON CONFLICT (key) DO UPDATE
    SET
      count    = CASE WHEN rate_limits.reset_at < NOW() THEN 1                  ELSE rate_limits.count + 1     END,
      reset_at = CASE WHEN rate_limits.reset_at < NOW() THEN excluded.reset_at  ELSE rate_limits.reset_at      END
  RETURNING count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;
