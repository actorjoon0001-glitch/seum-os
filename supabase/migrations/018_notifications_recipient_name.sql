-- =============================================================
-- 018_notifications_recipient_name.sql
-- notifications 테이블에 개인 수신자 지정 컬럼 추가.
-- 기존 recipient_team 만 지원하던 구조 → team + 개인 지정 병행 가능.
-- =============================================================

alter table public.notifications
  add column if not exists recipient_name text;

comment on column public.notifications.recipient_name is
  '특정 직원 이름으로 알림을 타겟팅 (team 과 병행 사용 가능, 둘 다 또는 하나만)';

-- 인덱스 — 수신자 이름 필터링 속도 향상
create index if not exists idx_notifications_recipient_name
  on public.notifications (recipient_name)
  where recipient_name is not null;
