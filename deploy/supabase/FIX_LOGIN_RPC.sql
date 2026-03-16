-- ============================================================
-- 로그인 + 대시보드 접근 확인 (RLS 영향 없이 동작)
-- Supabase SQL Editor에서 "Run" 실행
-- ============================================================

-- 1) 로그인: 사번 → 이메일/상태 조회
CREATE OR REPLACE FUNCTION public.get_employee_for_login(p_employee_id text)
RETURNS TABLE(email text, status text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.email, e.status
  FROM public.employees e
  WHERE trim(both from p_employee_id) <> ''
    AND (e.employee_id IS NOT NULL AND lower(e.employee_id) = lower(trim(both from p_employee_id)))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_employee_for_login(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_employee_for_login(text) TO authenticated;

-- 2) 대시보드 접근: auth_user_id → status 조회 (로그인 후 화면 유지용)
CREATE OR REPLACE FUNCTION public.get_employee_status_by_auth_id(p_auth_user_id uuid)
RETURNS TABLE(status text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.status FROM public.employees e WHERE e.auth_user_id = p_auth_user_id LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_employee_status_by_auth_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_employee_status_by_auth_id(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_employee_for_login(text) IS '로그인: 사번으로 이메일/상태 조회';
COMMENT ON FUNCTION public.get_employee_status_by_auth_id(uuid) IS '대시보드: 로그인 사용자 승인 상태 조회';
