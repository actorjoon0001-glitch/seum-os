-- ============================================================
-- 월차/연차 관리 (leave_requests, leave_balance)
-- Supabase SQL Editor 에서 실행
-- ============================================================
-- 정책: 근태(attendance) 와 동일 — 인증 사용자 전체 CRUD,
--        앱 레벨에서 본인/관리자 권한에 따라 노출.
--
-- type 값:
--   annual   연차 (1일)
--   half     반차 (0.5일, start_date == end_date)
--   sick     병가 (balance 차감 없음)
--   outside  외근 (balance 차감 없음)
-- status 값:
--   pending | approved | rejected

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  employee_id      bigint,
  user_name        text,
  team             text,
  showroom         text,
  type             text NOT NULL,
  start_date       date NOT NULL,
  end_date         date NOT NULL,
  days             numeric NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'pending',
  reason           text,
  approved_by      uuid,
  approved_at      timestamptz,
  rejected_reason  text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

COMMENT ON TABLE public.leave_requests IS '월차/연차 신청';

CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id    ON public.leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status     ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date ON public.leave_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_end_date   ON public.leave_requests(end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_team       ON public.leave_requests(team);
CREATE INDEX IF NOT EXISTS idx_leave_requests_showroom   ON public.leave_requests(showroom);

CREATE OR REPLACE FUNCTION public.set_leave_requests_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leave_requests_updated_at ON public.leave_requests;
CREATE TRIGGER trg_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_leave_requests_updated_at();

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leave_requests_select_authenticated" ON public.leave_requests;
CREATE POLICY "leave_requests_select_authenticated"
  ON public.leave_requests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "leave_requests_insert_authenticated" ON public.leave_requests;
CREATE POLICY "leave_requests_insert_authenticated"
  ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "leave_requests_update_authenticated" ON public.leave_requests;
CREATE POLICY "leave_requests_update_authenticated"
  ON public.leave_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "leave_requests_delete_authenticated" ON public.leave_requests;
CREATE POLICY "leave_requests_delete_authenticated"
  ON public.leave_requests FOR DELETE TO authenticated USING (true);


CREATE TABLE IF NOT EXISTS public.leave_balance (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  employee_id  bigint,
  user_name    text,
  year         integer NOT NULL,
  total_days   numeric NOT NULL DEFAULT 15,
  used_days    numeric NOT NULL DEFAULT 0,
  remain_days  numeric GENERATED ALWAYS AS (total_days - used_days) STORED,
  updated_at   timestamptz DEFAULT now(),
  CONSTRAINT leave_balance_user_year_unique UNIQUE (user_id, year)
);

COMMENT ON TABLE public.leave_balance IS '연간 연차/반차 잔여일 집계';

CREATE INDEX IF NOT EXISTS idx_leave_balance_user_id ON public.leave_balance(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_balance_year    ON public.leave_balance(year);

CREATE OR REPLACE FUNCTION public.set_leave_balance_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leave_balance_updated_at ON public.leave_balance;
CREATE TRIGGER trg_leave_balance_updated_at
  BEFORE UPDATE ON public.leave_balance
  FOR EACH ROW EXECUTE FUNCTION public.set_leave_balance_updated_at();

ALTER TABLE public.leave_balance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leave_balance_select_authenticated" ON public.leave_balance;
CREATE POLICY "leave_balance_select_authenticated"
  ON public.leave_balance FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "leave_balance_insert_authenticated" ON public.leave_balance;
CREATE POLICY "leave_balance_insert_authenticated"
  ON public.leave_balance FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "leave_balance_update_authenticated" ON public.leave_balance;
CREATE POLICY "leave_balance_update_authenticated"
  ON public.leave_balance FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "leave_balance_delete_authenticated" ON public.leave_balance;
CREATE POLICY "leave_balance_delete_authenticated"
  ON public.leave_balance FOR DELETE TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';
