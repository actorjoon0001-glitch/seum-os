-- ============================================================
-- 근태관리 테이블 (attendance)
-- Supabase SQL Editor에서 실행
-- ============================================================
-- 직원의 일별 출근/퇴근, 근무상태(외근/휴가/병가/출장 등)를 저장.
-- 앱(localStorage)과 함께 사용하며 local_id(앱이 만든 ID)를 업서트 키로 사용.
-- 업무일지(work_logs)와 동일한 RLS 전략: 인증 사용자 전체 CRUD,
-- 앱 레벨에서 일반 직원은 본인 데이터만 노출, 관리자/마스터는 전체 열람.
--
-- 상태(status) 값:
--   before       출근 전
--   working      근무중
--   finished     퇴근완료
--   late         지각
--   absent       결근
--   outside      외근
--   business_trip 출장
--   vacation     휴가
--   sick         병가

CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id text UNIQUE,
  user_id uuid,                  -- auth.users.id (Supabase Auth 사용자)
  employee_id bigint,             -- public.employees.id (선택)
  user_name text,                 -- 이름(보존용, 직원정보 변경과 무관하게 조회 가능)
  team text,                      -- 영업/설계/시공/마케팅/정산/경영 등
  showroom text,                  -- 본사/1전시장/3전시장/4전시장/강화
  date date NOT NULL,             -- 근무일
  check_in timestamptz,           -- 출근 시각
  check_out timestamptz,          -- 퇴근 시각
  status text DEFAULT 'before',   -- before|working|finished|late|absent|outside|business_trip|vacation|sick
  work_type text,                 -- 예: office/remote/field 등 확장 여지
  note text,                      -- 비고/메모
  is_late boolean DEFAULT false,
  work_minutes integer,           -- 저장 시 계산된 근무시간(분). 없으면 앱에서 계산.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,                -- 생성자 auth user id
  updated_by uuid,                -- 최근 수정자 auth user id
  CONSTRAINT attendance_user_date_unique UNIQUE (user_id, date)
);

COMMENT ON TABLE public.attendance IS '근태관리 (일별 출퇴근/근무상태)';

CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_name ON public.attendance(user_name);
CREATE INDEX IF NOT EXISTS idx_attendance_team ON public.attendance(team);
CREATE INDEX IF NOT EXISTS idx_attendance_showroom ON public.attendance(showroom);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_local_id ON public.attendance(local_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.set_attendance_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attendance_updated_at ON public.attendance;
CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.set_attendance_updated_at();

-- RLS 정책 (work_logs와 동일한 방침: 인증 사용자 전체 CRUD, 앱 레벨 필터)
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_select_authenticated" ON public.attendance;
CREATE POLICY "attendance_select_authenticated"
ON public.attendance FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "attendance_insert_authenticated" ON public.attendance;
CREATE POLICY "attendance_insert_authenticated"
ON public.attendance FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "attendance_update_authenticated" ON public.attendance;
CREATE POLICY "attendance_update_authenticated"
ON public.attendance FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "attendance_delete_authenticated" ON public.attendance;
CREATE POLICY "attendance_delete_authenticated"
ON public.attendance FOR DELETE
TO authenticated
USING (true);
