-- Optimization: Fix RLS performance warnings by wrapping auth.uid() calls
-- This prevents re-evaluation of auth.uid() for each row
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- Drop existing policies on profiles table
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- Recreate profiles policies with optimized auth.uid() calls
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = (select auth.uid()));

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = (select auth.uid()));

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (id = (select auth.uid()));

-- Drop existing policies on trades table
DROP POLICY IF EXISTS "trades_select_own" ON public.trades;
DROP POLICY IF EXISTS "trades_insert_own" ON public.trades;
DROP POLICY IF EXISTS "trades_update_own" ON public.trades;
DROP POLICY IF EXISTS "trades_delete_own" ON public.trades;

-- Recreate trades policies with optimized auth.uid() calls
CREATE POLICY "trades_select_own"
  ON public.trades FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "trades_insert_own"
  ON public.trades FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "trades_update_own"
  ON public.trades FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "trades_delete_own"
  ON public.trades FOR DELETE
  USING (user_id = (select auth.uid()));

-- Drop existing policies on portfolios table
DROP POLICY IF EXISTS "portfolios_select_own" ON public.portfolios;
DROP POLICY IF EXISTS "portfolios_insert_own" ON public.portfolios;
DROP POLICY IF EXISTS "portfolios_update_own" ON public.portfolios;
DROP POLICY IF EXISTS "portfolios_delete_own" ON public.portfolios;

-- Recreate portfolios policies with optimized auth.uid() calls
CREATE POLICY "portfolios_select_own"
  ON public.portfolios FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "portfolios_insert_own"
  ON public.portfolios FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "portfolios_update_own"
  ON public.portfolios FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "portfolios_delete_own"
  ON public.portfolios FOR DELETE
  USING (user_id = (select auth.uid()));

-- Drop existing policies on orders table
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_own" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_own" ON public.orders;

-- Recreate orders policies with optimized auth.uid() calls
CREATE POLICY "orders_select_own"
  ON public.orders FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "orders_insert_own"
  ON public.orders FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "orders_update_own"
  ON public.orders FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "orders_delete_own"
  ON public.orders FOR DELETE
  USING (user_id = (select auth.uid()));
