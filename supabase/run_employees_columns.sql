-- ============================================================
-- employees 테이블 누락 컬럼 추가 (Supabase SQL Editor에서 실행)
-- "Could not find the 'auth_user_id' column" 오류 해결용
-- ============================================================

-- 002: Auth 연동 + 승인 상태
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON public.employees(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);

-- 003: 사번 + 이메일
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS employee_id text UNIQUE;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON public.employees(employee_id);
