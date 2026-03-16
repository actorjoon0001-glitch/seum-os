-- ============================================================
-- employees 테이블: 인사 정보 컬럼 추가 (실무형 보강)
-- Supabase SQL Editor에서 실행
-- ============================================================

ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS position text;

COMMENT ON COLUMN public.employees.phone IS '휴대폰 번호';
COMMENT ON COLUMN public.employees.birth_date IS '생년월일';
COMMENT ON COLUMN public.employees.position IS '직책';
