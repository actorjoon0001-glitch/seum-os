// Supabase Edge Function: send-push
// notifications 테이블 INSERT 트리거에서 호출되어 해당 알림의 수신자
// (recipient_name 우선, 없으면 recipient_team) 의 모든 push_subscriptions
// 에 Web Push 를 발송한다.
//
// 환경변수 (Supabase Secrets):
//   SUPABASE_URL                — 자동 주입
//   SUPABASE_SERVICE_ROLE_KEY   — 자동 주입
//   VAPID_PUBLIC_KEY            — web-push generate-vapid-keys 결과
//   VAPID_PRIVATE_KEY           — web-push generate-vapid-keys 결과
//   VAPID_SUBJECT               — mailto:admin@your-domain (선택)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import webpush from 'https://esm.sh/web-push@3.6.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')!;
const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!;
const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@seum-os.local';

webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

interface NotificationRow {
  id: number | string;
  title: string | null;
  body: string | null;
  recipient_team: string | null;
  recipient_name: string | null;
  contract_id: string | null;
}

interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }
  try {
    const { notification_id } = await req.json();
    if (!notification_id) {
      return new Response('missing notification_id', { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: notif, error: notifErr } = await supabase
      .from('notifications')
      .select('id, title, body, recipient_team, recipient_name, contract_id')
      .eq('id', notification_id)
      .maybeSingle();
    if (notifErr || !notif) {
      return new Response('notification not found', { status: 404 });
    }
    const n = notif as NotificationRow;

    let q = supabase.from('push_subscriptions').select('endpoint, p256dh, auth');
    if (n.recipient_name) {
      q = q.eq('employee_name', n.recipient_name);
    } else if (n.recipient_team) {
      q = q.eq('team', n.recipient_team);
    }
    const { data: subs } = await q;
    const subList = (subs || []) as PushSub[];
    if (subList.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), { status: 200 });
    }

    const payload = JSON.stringify({
      title: n.title || '세움 OS 알림',
      body: n.body || '',
      url: '/dashboard.html',
      contractId: n.contract_id,
      tag: 'seum-notif-' + n.id,
    });

    let sent = 0;
    let removed = 0;
    await Promise.all(subList.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
      } catch (err: any) {
        const status = err && (err.statusCode || err.status);
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
          removed++;
        } else {
          console.error('[send-push] failed', s.endpoint, status, err && err.body);
        }
      }
    }));

    return new Response(JSON.stringify({ ok: true, sent, removed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[send-push] error', e);
    return new Response('error: ' + (e?.message || 'unknown'), { status: 500 });
  }
});
