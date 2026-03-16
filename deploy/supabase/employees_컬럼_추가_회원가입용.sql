-- ============================================================
-- employees 테이블: 회원가입 폼과 동일하게 저장하려면 아래 컬럼 추가
-- Supabase SQL Editor에서 복붙 후 Run (이미 있으면 무시됨)
-- 필요 없는 줄은 주석 처리하거나 삭제 후 1개씩 수정해서 실행해도 됨
-- ============================================================

-- 이메일 (로그인 아이디로도 사용)
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS email text;

-- 휴대폰 번호
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS phone text;

-- 생년월일
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS birth_date date;

-- 직책 (실장, 대리, 팀장 등)
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS position_name text;

-- 권한 (staff, manager, admin 등 - 추후 메뉴 분기용)
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS permission text DEFAULT 'staff';

-- 컬럼 설명 (선택)
COMMENT ON COLUMN public.employees.email IS '이메일 (로그인·연락용)';
COMMENT ON COLUMN public.employees.phone IS '휴대폰 번호';
COMMENT ON COLUMN public.employees.birth_date IS '생년월일';
COMMENT ON COLUMN public.employees.position_name IS '직책 (실장, 대리, 팀장 등)';
COMMENT ON COLUMN public.employees.permission IS '권한: staff, manager, admin';
