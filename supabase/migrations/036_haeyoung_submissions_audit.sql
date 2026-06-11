-- 036_haeyoung_submissions_audit.sql
-- 해영 건축사 업로드 이력 삭제 감사 추적 + 복구 지원.
-- 035 에서 만든 haeyoung_submissions 는 soft delete(is_deleted) 만 있고
-- "누가·언제 지웠는지" 기록이 없어, 이력이 통째로 사라져도 원인 추적이 불가했다.
-- deleted_at / deleted_by_name 을 추가해 삭제 주체와 시각을 남긴다.
-- (복구 시에는 앱에서 두 컬럼을 다시 NULL 로 되돌린다.)

ALTER TABLE public.haeyoung_submissions
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by_name text;

COMMENT ON COLUMN public.haeyoung_submissions.deleted_at IS '삭제(soft delete) 시각. 복구 시 NULL 로 되돌림.';
COMMENT ON COLUMN public.haeyoung_submissions.deleted_by_name IS '삭제 실행자 표시명. 복구 시 NULL 로 되돌림.';

-- 삭제된 항목(휴지통) 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_haeyoung_submissions_deleted_at
  ON public.haeyoung_submissions(deleted_at DESC)
  WHERE is_deleted IS TRUE;
