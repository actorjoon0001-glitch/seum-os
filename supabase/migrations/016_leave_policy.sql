-- ============================================================
-- 연차 산정 정책(법정 기준) 적용
-- ============================================================
-- 1) 계속근로 1년 미만: 매월 개근 시 1일, 최대 11일
-- 2) 계속근로 1년 이상 + 출근율 80% 이상: 15일
-- 3) 3년차부터 매 2년마다 1일 가산 (16, 17, 18, ... 25일 한도)
-- 4) 최대 25일
--
-- 이 마이그레이션은 입사일(hire_date)과 계산 메타데이터만 추가한다.
-- 실제 일수 계산/반영은 앱(js/leave.js)에서 수행한다.

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS hire_date date;

COMMENT ON COLUMN public.employees.hire_date IS '입사일 (연차 산정 기준)';

ALTER TABLE public.leave_balance
  ADD COLUMN IF NOT EXISTS hire_date date,
  ADD COLUMN IF NOT EXISTS service_years numeric,
  ADD COLUMN IF NOT EXISTS service_months integer,
  ADD COLUMN IF NOT EXISTS allowance_method text,   -- 'monthly' | 'annual'
  ADD COLUMN IF NOT EXISTS computed_at timestamptz;

COMMENT ON COLUMN public.leave_balance.allowance_method IS '산정 방식: monthly(1년 미만 월단위) / annual(1년 이상 연단위)';

NOTIFY pgrst, 'reload schema';
