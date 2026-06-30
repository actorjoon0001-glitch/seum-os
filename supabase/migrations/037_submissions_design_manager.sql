-- 037_submissions_design_manager.sql
-- 외부 협력 건축사(해영/필) 도면 업로드 행에 '사내 설계 담당자' 컬럼 추가.
-- 사내 팀원이 도면별로 설계 담당자명을 기입·저장한다.
-- 035(해영)는 이미 적용된 상태이므로 컬럼을 추가하고,
-- 036(필)은 아직 미적용일 수 있어 테이블 존재 시에만 추가한다.

-- 해영 건축사 (035 에서 생성됨 — 항상 존재)
ALTER TABLE public.haeyoung_submissions
  ADD COLUMN IF NOT EXISTS design_manager text;
COMMENT ON COLUMN public.haeyoung_submissions.design_manager IS '사내 설계 담당자명 (사내 팀원이 도면별로 기입)';

-- 필건축사 (036 미적용 시 테이블이 없을 수 있어 존재 여부 확인 후 추가)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pil_submissions'
  ) THEN
    ALTER TABLE public.pil_submissions
      ADD COLUMN IF NOT EXISTS design_manager text;
  END IF;
END$$;
