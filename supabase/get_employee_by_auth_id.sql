-- ============================================================
-- 로그인 후 직원 정보 조회 (auth.users.id → public.employees)
-- employees 실제 존재 컬럼만 사용: id, name, team, role, showroom, status
-- Supabase SQL Editor에서 Run
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_employee_by_auth_id(p_auth_user_id uuid)
RETURNS TABLE(
  id bigint,
  name text,
  team text,
  role text,
  showroom text,
  status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.name, e.team, e.role, e.showroom, e.status
  FROM public.employees e
  WHERE e.auth_user_id = p_auth_user_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_employee_by_auth_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_employee_by_auth_id(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_employee_by_auth_id(uuid) IS '로그인: auth_user_id로 직원 조회 (존재 컬럼만: id, name, team, role, showroom, status)';
