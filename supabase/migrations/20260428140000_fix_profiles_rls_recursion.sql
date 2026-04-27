-- Evita "infinite recursion detected in policy for relation profiles":
-- policies que hacen EXISTS (SELECT … FROM profiles) re-evalúan RLS en profiles;
-- profiles_self_read no debe consultar profiles de nuevo sin bypass.

CREATE OR REPLACE FUNCTION public.auth_is_owner_or_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND COALESCE(p.active, true)
      AND p.role IN ('owner', 'manager')
  );
$$;

REVOKE ALL ON FUNCTION public.auth_is_owner_or_manager() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_is_owner_or_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_is_owner_or_manager() TO service_role;

DROP POLICY IF EXISTS profiles_self_read ON profiles;
CREATE POLICY profiles_self_read ON profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.auth_is_owner_or_manager());
