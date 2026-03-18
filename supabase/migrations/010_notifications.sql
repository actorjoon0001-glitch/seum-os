-- 설계팀 계약 생성 알림 테이블
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_team text not null,        -- '설계', '시공' 등 수신 팀
  title text not null,
  body text not null,
  contract_id text,
  customer_name text,
  created_by_name text,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_team_created
  on public.notifications (recipient_team, created_at desc);

-- RLS
alter table public.notifications enable row level security;

create policy "notifications allow all for anon"
  on public.notifications for all
  using (true) with check (true);

-- Realtime 활성화
alter publication supabase_realtime add table public.notifications;
