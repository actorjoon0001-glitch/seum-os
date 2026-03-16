-- ============================================================
-- employees: 직책(position_name)과 권한(permission) 분리
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 직책: UI 표시용 (실장, 대리, 팀장 등)
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS position_name text;

-- 기존 position 값이 있으면 position_name으로 복사 (position 컬럼이 있을 때만)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'position') THEN
    UPDATE public.employees SET position_name = position WHERE position IS NOT NULL AND (position_name IS NULL OR position_name = '');
  END IF;
END $$;

-- 권한: 시스템 접근 (admin, manager, staff)
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS permission text DEFAULT 'staff';

-- 기존 데이터에 permission이 NULL이면 staff로 설정
UPDATE public.employees SET permission = 'staff' WHERE permission IS NULL;

COMMENT ON COLUMN public.employees.position_name IS '직책 표시용 (실장, 대리, 팀장 등)';
COMMENT ON COLUMN public.employees.permission IS '시스템 권한: admin, manager, staff';
