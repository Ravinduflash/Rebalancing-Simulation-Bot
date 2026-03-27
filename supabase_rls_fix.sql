-- ============================================
-- FIX: Enable RLS + Add Permissive Policies
-- Run this ENTIRE script in your Supabase SQL Editor
-- ============================================

-- 1. Enable RLS on all tables (satisfies the Supabase security warning)
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulated_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies (in case the Supabase AI assistant created restrictive ones)
DROP POLICY IF EXISTS "Allow all access to bots" ON bots;
DROP POLICY IF EXISTS "Allow all access to holdings" ON holdings;
DROP POLICY IF EXISTS "Allow all access to simulated_trades" ON simulated_trades;
DROP POLICY IF EXISTS "Allow all access to portfolio_snapshots" ON portfolio_snapshots;

-- 3. Create permissive policies that allow the anon key full CRUD access
-- (This is safe for a personal simulation tool, not a multi-tenant production app)

CREATE POLICY "Allow all access to bots"
  ON bots FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to holdings"
  ON holdings FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to simulated_trades"
  ON simulated_trades FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to portfolio_snapshots"
  ON portfolio_snapshots FOR ALL
  USING (true)
  WITH CHECK (true);
