-- Fix security warnings from Supabase database linter

-- 1. Add RLS policies to audit_logs table
-- Enable RLS on audit_logs
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Service role can read/write audit logs (for backend logging)
CREATE POLICY "audit_logs_service_role_all"
  ON public.audit_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Users can read their own audit logs (select only)
CREATE POLICY "audit_logs_users_read_own"
  ON public.audit_logs FOR SELECT
  USING (user_id = (select auth.uid()));

-- 2. Create update_updated_at_column trigger function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for tables that have updated_at column
DROP TRIGGER IF EXISTS trigger_update_updated_at_trades ON public.trades;
CREATE TRIGGER trigger_update_updated_at_trades
BEFORE UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_portfolios ON public.portfolios;
CREATE TRIGGER trigger_update_updated_at_portfolios
BEFORE UPDATE ON public.portfolios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_orders ON public.orders;
CREATE TRIGGER trigger_update_updated_at_orders
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_profiles ON public.profiles;
CREATE TRIGGER trigger_update_updated_at_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create current_auth_user_id helper function with proper search_path
CREATE OR REPLACE FUNCTION public.current_auth_user_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.current_auth_user_id() TO authenticated, anon, service_role;
