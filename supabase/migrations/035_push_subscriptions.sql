-- Web Push 구독 정보 — Service Worker 가 받은 endpoint/p256dh/auth 를 저장.
-- send-push Edge Function 이 이 테이블을 조회해 알림을 발송한다.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  employee_id TEXT,
  employee_name TEXT,
  team TEXT,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_employee_name
  ON public.push_subscriptions(employee_name);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_team
  ON public.push_subscriptions(team);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_select" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_select"
  ON public.push_subscriptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "push_subscriptions_insert" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_insert"
  ON public.push_subscriptions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "push_subscriptions_update" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_update"
  ON public.push_subscriptions FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "push_subscriptions_delete" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_delete"
  ON public.push_subscriptions FOR DELETE USING (true);

COMMENT ON TABLE public.push_subscriptions IS 'Web Push (PWA) 구독 정보 — 디바이스별 1행';
