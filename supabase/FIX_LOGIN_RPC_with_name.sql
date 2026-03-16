-- ============================================================
-- 대시보드: auth_user_id로 status + name 조회 (현재 로그인 사용자 표시용)
-- 기존 get_employee_status_by_auth_id 대신 사용 가능 (name 추가)
-- Supabase SQL Editor에서 Run
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_employee_status_by_auth_id(p_auth_user_id uuid)
RETURNS TABLE(status text, name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.status, e.name
  FROM public.employees e
  WHERE e.auth_user_id = p_auth_user_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_employee_status_by_auth_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_employee_status_by_auth_id(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_employee_status_by_auth_id(uuid) IS '대시보드: 로그인 사용자 승인 상태 및 이름 조회';
