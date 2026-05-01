-- notifications 테이블에 INSERT 발생 시 send-push Edge Function 호출.
-- pg_net 익스텐션 사용. 적용 전 아래 두 GUC 를 반드시 설정해야 한다:
--
--   ALTER DATABASE postgres SET app.settings.edge_url
--     = 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-push';
--   ALTER DATABASE postgres SET app.settings.service_role_key
--     = 'YOUR_SERVICE_ROLE_KEY';
--
-- (대시보드 Database → Settings → Custom Postgres Config 에서도 가능)

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.fn_notify_push() RETURNS TRIGGER AS $$
DECLARE
  edge_url TEXT;
  service_key TEXT;
BEGIN
  edge_url := current_setting('app.settings.edge_url', true);
  service_key := current_setting('app.settings.service_role_key', true);
  IF edge_url IS NULL OR service_key IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := edge_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('notification_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- 푸시 발송 실패가 알림 INSERT 자체를 막지 않도록 swallow
  RAISE WARNING 'fn_notify_push failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notifications_push ON public.notifications;
CREATE TRIGGER trg_notifications_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_push();
