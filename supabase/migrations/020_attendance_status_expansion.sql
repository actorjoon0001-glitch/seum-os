-- ============================================================
-- 근태 상태값 확장 — Phase 1 (참조 테이블) + Phase 2 (attendance 컬럼 확장)
-- Supabase SQL Editor 에서 실행
-- ============================================================
-- 목적:
--   1) attendance_statuses 참조 테이블로 상태 코드/라벨/카테고리/시간·메모
--      필수 여부 등을 관리 가능한 형태로 분리 (추후 수정/추가 가능)
--   2) attendance 테이블에 start_time / end_time / memo 컬럼 추가
--      - start_time / end_time: 상태별 시작·종료 시각 (지각/조퇴 실제 시각,
--        외근/출장 세부 시간대 등 — check_in/check_out 과 별개)
--      - memo: 기존 note 와 별개로 확장용 (코드는 memo 우선 사용, 미설정 시 note fallback)
--
-- category 값:
--   work         — 정상 근무 (working)
--   work_variant — 근무 중이지만 형태·장소가 다른 것 (outside / business_trip / remote / training)
--   partial      — 부분 근무 / 예외 (late / early_leave / half_am / half_pm)
--   off          — 휴무성 (vacation / sick — 참고용 라벨만 유지, 실제 관리는 leave_requests/team_off_days)
--   internal     — 출근전/퇴근완료 같은 시스템 자동 상태 (before / finished)
--   admin        — 관리자만 설정 가능 (absent 무단결근 등)
--
-- billable_ratio: 근무 시간 대비 "유급"으로 인정되는 비율 (0.0~1.0, 추후 급여/인센티브 계산 훅)
--   예: working=1.0, half_am=0.5, vacation=1.0 (유급휴가 가정), sick=1.0, absent=0.0, training=1.0

CREATE TABLE IF NOT EXISTS public.attendance_statuses (
  code                 text PRIMARY KEY,
  label                text NOT NULL,
  category             text NOT NULL DEFAULT 'work',
  requires_time_range  boolean NOT NULL DEFAULT false,
  requires_memo        boolean NOT NULL DEFAULT false,
  admin_only           boolean NOT NULL DEFAULT false,
  billable_ratio       numeric NOT NULL DEFAULT 1.0,
  sort_order           integer NOT NULL DEFAULT 100,
  active               boolean NOT NULL DEFAULT true,
  description          text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

COMMENT ON TABLE public.attendance_statuses IS '근태 상태값 참조 테이블 (코드/라벨/카테고리/요구필드/권한/급여비율 관리)';

CREATE OR REPLACE FUNCTION public.set_attendance_statuses_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attendance_statuses_updated_at ON public.attendance_statuses;
CREATE TRIGGER trg_attendance_statuses_updated_at
  BEFORE UPDATE ON public.attendance_statuses
  FOR EACH ROW EXECUTE FUNCTION public.set_attendance_statuses_updated_at();

ALTER TABLE public.attendance_statuses ENABLE ROW LEVEL SECURITY;

-- 모든 인증 사용자는 상태 목록을 읽을 수 있음 (드롭다운 렌더용)
DROP POLICY IF EXISTS "attendance_statuses_select_authenticated" ON public.attendance_statuses;
CREATE POLICY "attendance_statuses_select_authenticated"
  ON public.attendance_statuses FOR SELECT TO authenticated USING (true);

-- 상태 정의 변경(추가/수정/삭제)은 인증 사용자 전체 허용하되 앱 레벨에서 관리자만 노출.
-- (관리자 페이지가 마련될 때 이 정책을 employees.permission='admin' 으로 좁혀도 됨)
DROP POLICY IF EXISTS "attendance_statuses_insert_authenticated" ON public.attendance_statuses;
CREATE POLICY "attendance_statuses_insert_authenticated"
  ON public.attendance_statuses FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "attendance_statuses_update_authenticated" ON public.attendance_statuses;
CREATE POLICY "attendance_statuses_update_authenticated"
  ON public.attendance_statuses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "attendance_statuses_delete_authenticated" ON public.attendance_statuses;
CREATE POLICY "attendance_statuses_delete_authenticated"
  ON public.attendance_statuses FOR DELETE TO authenticated USING (true);

-- 시드: 기존 하드코딩 값 + 신규 상태
INSERT INTO public.attendance_statuses (code, label, category, requires_time_range, requires_memo, admin_only, billable_ratio, sort_order, description) VALUES
  ('before',        '출근전',      'internal',     false, false, false, 0.0,  10,  '출근 체크 전 자동 상태'),
  ('working',       '근무중',      'work',         false, false, false, 1.0,  20,  '정상 사내 근무'),
  ('remote',        '재택근무',    'work_variant', false, false, false, 1.0,  30,  '재택 근무 — 사무실 외 근무'),
  ('outside',       '외근',        'work_variant', true,  true,  false, 1.0,  40,  '외근 — 현장 방문/미팅 등 반일 단위 외근'),
  ('business_trip', '출장',        'work_variant', false, true,  false, 1.0,  50,  '출장 — 하루 이상 또는 공식 일정'),
  ('training',      '교육',        'work_variant', false, true,  false, 1.0,  60,  '사외/사내 교육 참석'),
  ('late',          '지각',        'partial',      true,  false, false, 1.0,  70,  '지각 — 실제 출근시각 기록'),
  ('early_leave',   '조퇴',        'partial',      true,  true,  false, 1.0,  80,  '조퇴 — 실제 퇴근시각과 사유'),
  ('half_am',       '오전 반차',   'partial',      false, false, false, 0.5,  90,  '오전 반차'),
  ('half_pm',       '오후 반차',   'partial',      false, false, false, 0.5,  100, '오후 반차'),
  ('finished',      '퇴근완료',    'internal',     false, false, false, 1.0,  110, '퇴근 체크 후 자동 상태'),
  ('vacation',      '휴가',        'off',          false, false, false, 1.0,  200, '참고 라벨 — 실제 관리는 leave_requests/team_off_days'),
  ('sick',          '병가',        'off',          false, true,  false, 1.0,  210, '참고 라벨 — 실제 관리는 leave_requests/team_off_days'),
  ('absent',        '무단결근',    'admin',        false, true,  true,  0.0,  900, '관리자 전용 — 무단결근 기록')
ON CONFLICT (code) DO UPDATE SET
  label               = EXCLUDED.label,
  category            = EXCLUDED.category,
  requires_time_range = EXCLUDED.requires_time_range,
  requires_memo       = EXCLUDED.requires_memo,
  admin_only          = EXCLUDED.admin_only,
  billable_ratio      = EXCLUDED.billable_ratio,
  sort_order          = EXCLUDED.sort_order,
  description         = EXCLUDED.description,
  updated_at          = now();

-- attendance 테이블 확장
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS end_time   time,
  ADD COLUMN IF NOT EXISTS memo       text;

COMMENT ON COLUMN public.attendance.start_time IS '상태별 시작 시각 (외근/출장 세부시간, 지각 실제 출근시각 등 — check_in 과 별개)';
COMMENT ON COLUMN public.attendance.end_time   IS '상태별 종료 시각 (외근/조퇴 등 — check_out 과 별개)';
COMMENT ON COLUMN public.attendance.memo       IS '상태 사유/비고 (기존 note 와 별개, 코드는 memo 우선·없으면 note fallback)';

NOTIFY pgrst, 'reload schema';
