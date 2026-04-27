-- 028_get_employee_by_auth_id_permission.sql
-- 로그인 RPC가 employees.permission 컬럼도 반환하도록 수정
-- (기존: id, name, team, role, showroom, status → 추가: permission)
--
-- 배경: 관리자 화면에서 permission 을 별도로 저장할 수 있게 됐지만,
-- 로그인 시 RPC 가 permission 을 내려주지 않으면 auth.js 가 fallback 으로
-- 'staff' 를 박아버려 다른 기기/브라우저에서 master 권한이 적용되지 않는다.
-- 이를 막기 위해 반환 컬럼에 permission 을 추가한다.

DROP FUNCTION IF EXISTS public.get_employee_by_auth_id(uuid);

CREATE OR REPLACE FUNCTION public.get_employee_by_auth_id(p_auth_user_id uuid)
RETURNS TABLE(
  id bigint,
  name text,
  team text,
  role text,
  showroom text,
  status text,
  permission text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.name, e.team, e.role, e.showroom, e.status, e.permission
  FROM public.employees e
  WHERE e.auth_user_id = p_auth_user_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_employee_by_auth_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_employee_by_auth_id(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_employee_by_auth_id(uuid) IS '로그인: auth_user_id로 직원 조회 (id, name, team, role, showroom, status, permission)';
