-- ============================================================
-- 업무일지 테이블 (work_logs)
-- Supabase SQL Editor에서 실행
-- ============================================================
-- 모든 직원이 매일 작성하는 일일 업무보고(캘린더 형식) 저장 테이블.
-- localStorage 와 함께 사용되며 local_id(앱이 만든 ID)를 업서트 키로 사용.
--
-- 정책:
--  - 인증 사용자는 모두 INSERT/SELECT/UPDATE/DELETE 가능
--    (앱 레벨에서 일반 직원은 본인 일지만 노출, 관리자/마스터는 전체 열람)
--

CREATE TABLE IF NOT EXISTS public.work_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id text UNIQUE,
  work_date date,
  author_name text,
  author_user_id uuid,
  team text,
  showroom text,
  title text,
  content text,
  plan text,
  issues text,
  payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.work_logs IS '업무일지 (일일 업무보고)';

CREATE INDEX IF NOT EXISTS idx_work_logs_work_date ON public.work_logs(work_date);
CREATE INDEX IF NOT EXISTS idx_work_logs_author_user_id ON public.work_logs(author_user_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_author_name ON public.work_logs(author_name);
CREATE INDEX IF NOT EXISTS idx_work_logs_team ON public.work_logs(team);
CREATE INDEX IF NOT EXISTS idx_work_logs_showroom ON public.work_logs(showroom);
CREATE INDEX IF NOT EXISTS idx_work_logs_local_id ON public.work_logs(local_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.set_work_logs_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_work_logs_updated_at ON public.work_logs;
CREATE TRIGGER trg_work_logs_updated_at
  BEFORE UPDATE ON public.work_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_work_logs_updated_at();

-- RLS 정책
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "work_logs_select_authenticated" ON public.work_logs;
CREATE POLICY "work_logs_select_authenticated"
ON public.work_logs FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "work_logs_insert_authenticated" ON public.work_logs;
CREATE POLICY "work_logs_insert_authenticated"
ON public.work_logs FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "work_logs_update_authenticated" ON public.work_logs;
CREATE POLICY "work_logs_update_authenticated"
ON public.work_logs FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "work_logs_delete_authenticated" ON public.work_logs;
CREATE POLICY "work_logs_delete_authenticated"
ON public.work_logs FOR DELETE
TO authenticated
USING (true);
