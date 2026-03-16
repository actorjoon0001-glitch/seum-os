-- ============================================================
-- employees 테이블: Auth 연동 및 승인 상태
-- Supabase SQL Editor에서 실행 (001 실행 후)
-- ============================================================

-- auth_user_id: Supabase Auth 사용자와 직원 레코드 연결
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;

-- status: pending(대기), approved(승인), blocked(차단)
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

COMMENT ON COLUMN public.employees.auth_user_id IS 'Supabase Auth 사용자 ID (auth.users.id)';
COMMENT ON COLUMN public.employees.status IS '승인 상태: pending, approved, blocked';

-- 대시보드 접근 체크용 인덱스
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON public.employees(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
