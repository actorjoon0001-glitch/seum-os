-- ============================================================
-- employees 테이블: 사번(employee_id) 및 이메일(로그인 조회용)
-- Supabase SQL Editor에서 실행 (002 실행 후)
-- ============================================================

-- 사번: 관리자 승인 시 부여, 로그인 시 사용
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS employee_id text UNIQUE;

-- 이메일: 회원가입 시 저장, 사번으로 로그인할 때 Supabase Auth 조회용
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS email text;

COMMENT ON COLUMN public.employees.employee_id IS '사번 (관리자 승인 시 부여, 로그인 ID로 사용)';
COMMENT ON COLUMN public.employees.email IS '이메일 (회원가입 시 저장, 사번→이메일 조회 후 로그인용)';

CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON public.employees(employee_id);
