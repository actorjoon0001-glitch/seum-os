-- ============================================================
-- 팀 휴무 캘린더 직접 입력 (team_off_days)
-- Supabase SQL Editor 에서 실행
-- ============================================================
-- 목적: 팀 휴무 캘린더에서 팀원이 본인(또는 팀장/관리자가 팀원)의
--       휴무일을 직접 체크한 값을 전사 공유되도록 중앙 저장.
--       (기존 leave_requests 는 신청·승인 워크플로우, attendance 는 출근 기록 —
--        이 테이블은 캘린더에서 체크한 "예정 휴무" 전용)
--
-- type 값:
--   annual   연차
--   monthly  월차
--   half_am  오전 반차
--   half_pm  오후 반차
--   half     반차(시간대 미구분)
--   holiday  공휴일
--   other    기타
--
-- 권한 정책: 근태/휴가 신청 테이블과 동일하게 인증 사용자 전체 CRUD,
--            앱 레벨에서 본인/팀장/관리자 범위 체크 (team-off.js)

CREATE TABLE IF NOT EXISTS public.team_off_days (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       text,                                 -- 기존 localStorage id (마이그레이션 추적용, nullable)
  employee_id     text NOT NULL,                        -- employees.id (정수 또는 auth_user_id 문자열)
  auth_user_id    uuid,                                 -- auth.users.id (본인 여부 확인용)
  employee_name   text,
  team            text,
  showroom        text,
  date            date NOT NULL,
  type            text NOT NULL DEFAULT 'annual',
  memo            text,
  created_by      uuid,
  updated_by      uuid,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  CONSTRAINT team_off_days_emp_date_unique UNIQUE (employee_id, date)
);

COMMENT ON TABLE public.team_off_days IS '팀 휴무 캘린더 직접 입력 (팀원별 예정 휴무)';

CREATE INDEX IF NOT EXISTS idx_team_off_days_date         ON public.team_off_days(date);
CREATE INDEX IF NOT EXISTS idx_team_off_days_employee_id  ON public.team_off_days(employee_id);
CREATE INDEX IF NOT EXISTS idx_team_off_days_auth_user_id ON public.team_off_days(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_team_off_days_team         ON public.team_off_days(team);
CREATE INDEX IF NOT EXISTS idx_team_off_days_showroom     ON public.team_off_days(showroom);

CREATE OR REPLACE FUNCTION public.set_team_off_days_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_team_off_days_updated_at ON public.team_off_days;
CREATE TRIGGER trg_team_off_days_updated_at
  BEFORE UPDATE ON public.team_off_days
  FOR EACH ROW EXECUTE FUNCTION public.set_team_off_days_updated_at();

ALTER TABLE public.team_off_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_off_days_select_authenticated" ON public.team_off_days;
CREATE POLICY "team_off_days_select_authenticated"
  ON public.team_off_days FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "team_off_days_insert_authenticated" ON public.team_off_days;
CREATE POLICY "team_off_days_insert_authenticated"
  ON public.team_off_days FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "team_off_days_update_authenticated" ON public.team_off_days;
CREATE POLICY "team_off_days_update_authenticated"
  ON public.team_off_days FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "team_off_days_delete_authenticated" ON public.team_off_days;
CREATE POLICY "team_off_days_delete_authenticated"
  ON public.team_off_days FOR DELETE TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';
