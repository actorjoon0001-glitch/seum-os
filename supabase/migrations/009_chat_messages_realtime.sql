-- 팀 채팅 메시지 (채널별)
create table if not exists public.team_chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  sender_id text not null,
  sender_name text,
  sender_team text,
  message_type text default 'text',
  message text default '',
  file_url text,
  file_name text,
  is_pinned boolean default false,
  pinned_at timestamptz,
  pinned_by text,
  is_deleted boolean default false,
  deleted_at timestamptz,
  deleted_by text,
  created_at timestamptz default now()
);

create index if not exists idx_team_chat_messages_channel_created
  on public.team_chat_messages (channel, created_at);

-- 계약 채팅 메시지
create table if not exists public.contract_chat_messages (
  id uuid primary key default gen_random_uuid(),
  contract_id text not null,
  sender_id text not null,
  sender_name text,
  message text default '',
  type text default 'user',
  is_deleted boolean default false,
  is_pinned boolean default false,
  pinned_at timestamptz,
  pinned_by text,
  deleted_at timestamptz,
  deleted_by text,
  created_at timestamptz default now()
);

create index if not exists idx_contract_chat_messages_contract_created
  on public.contract_chat_messages (contract_id, created_at);

-- RLS: 인증된 사용자만 읽기/쓰기 (실제로는 anon 키로 접근 시 정책 조정 가능)
alter table public.team_chat_messages enable row level security;
alter table public.contract_chat_messages enable row level security;

create policy "team_chat_messages allow all for anon"
  on public.team_chat_messages for all
  using (true) with check (true);

create policy "contract_chat_messages allow all for anon"
  on public.contract_chat_messages for all
  using (true) with check (true);

-- Realtime 활성화 (실패 시 Supabase 대시보드 → Database → Replication에서 해당 테이블 활성화)
alter publication supabase_realtime add table public.team_chat_messages;
alter publication supabase_realtime add table public.contract_chat_messages;
