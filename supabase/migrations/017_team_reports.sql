-- =============================================================
-- 017_team_reports.sql
-- 팀 업무일지 2단계 구조 (헤더 + 아이템)
--
-- UI 는 기존 "팀장 코멘트 + 팀원별 인라인 행" 구조 그대로 유지하고,
-- 저장 레이어만 localStorage 중심 → Supabase 중심으로 정리.
--
--   team_reports          (팀·날짜 당 1개 — 팀장 코멘트 헤더)
--   team_report_items     (해당 report 내 팀원별 작성)
-- =============================================================

-- ---------- 1) 테이블 ----------
create table if not exists public.team_reports (
  id              uuid primary key default gen_random_uuid(),
  team_id         text not null,
  report_date     date not null,
  leader_comment  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint team_reports_team_date_unique unique (team_id, report_date)
);

create table if not exists public.team_report_items (
  id              uuid primary key default gen_random_uuid(),
  report_id       uuid not null references public.team_reports(id) on delete cascade,
  user_id         uuid,
  author_name     text,
  role_type       text,                   -- '팀장' | '팀원' | 'leader' | 'member'
  position        text,                   -- 대리 / 과장 / 사원 등
  content         text,
  status          text not null default '미작성'
                    check (status in ('미작성', '작성완료', 'draft', 'done')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint team_report_items_report_user_unique unique (report_id, user_id)
);

-- ---------- 2) 인덱스 ----------
create index if not exists idx_team_reports_team_date
  on public.team_reports (team_id, report_date desc);

create index if not exists idx_team_report_items_report
  on public.team_report_items (report_id);

create index if not exists idx_team_report_items_user
  on public.team_report_items (user_id);

-- ---------- 3) updated_at 자동 갱신 트리거 ----------
create or replace function public.tw_touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_team_reports_updated_at on public.team_reports;
create trigger trg_team_reports_updated_at
  before update on public.team_reports
  for each row execute function public.tw_touch_updated_at();

drop trigger if exists trg_team_report_items_updated_at on public.team_report_items;
create trigger trg_team_report_items_updated_at
  before update on public.team_report_items
  for each row execute function public.tw_touch_updated_at();

-- ---------- 4) 권한 헬퍼 함수 ----------
create or replace function public.tw_is_leader_or_admin() returns boolean
  language sql stable security definer
  set search_path = public
as $$
  select exists (
    select 1 from public.employees e
    where e.auth_user_id = auth.uid()
      and (
        e.role in ('leader', '팀장', 'team_lead', 'manager')
        or e.permission in ('admin', 'master', 'superadmin')
      )
  );
$$;

-- ---------- 5) RLS ----------
alter table public.team_reports enable row level security;
alter table public.team_report_items enable row level security;

-- team_reports 읽기: 인증된 사용자 전체
drop policy if exists "team_reports_select" on public.team_reports;
create policy "team_reports_select"
  on public.team_reports for select
  using (auth.uid() is not null);

-- team_reports 생성: 누구나 (빈 헤더 초기화용)
drop policy if exists "team_reports_insert" on public.team_reports;
create policy "team_reports_insert"
  on public.team_reports for insert
  with check (auth.uid() is not null);

-- team_reports 업데이트(leader_comment): 팀장/관리자만
drop policy if exists "team_reports_update" on public.team_reports;
create policy "team_reports_update"
  on public.team_reports for update
  using (public.tw_is_leader_or_admin())
  with check (public.tw_is_leader_or_admin());

-- team_reports 삭제: 관리자급만
drop policy if exists "team_reports_delete" on public.team_reports;
create policy "team_reports_delete"
  on public.team_reports for delete
  using (
    exists (
      select 1 from public.employees e
      where e.auth_user_id = auth.uid()
        and e.permission in ('admin', 'master', 'superadmin')
    )
  );

-- team_report_items 읽기: 인증된 사용자 전체
drop policy if exists "team_report_items_select" on public.team_report_items;
create policy "team_report_items_select"
  on public.team_report_items for select
  using (auth.uid() is not null);

-- team_report_items 생성: 본인 row 또는 팀장/관리자
drop policy if exists "team_report_items_insert" on public.team_report_items;
create policy "team_report_items_insert"
  on public.team_report_items for insert
  with check (
    user_id = auth.uid()
    or public.tw_is_leader_or_admin()
  );

-- team_report_items 업데이트: 본인 row 또는 팀장/관리자
drop policy if exists "team_report_items_update" on public.team_report_items;
create policy "team_report_items_update"
  on public.team_report_items for update
  using (
    user_id = auth.uid()
    or public.tw_is_leader_or_admin()
  )
  with check (
    user_id = auth.uid()
    or public.tw_is_leader_or_admin()
  );

-- team_report_items 삭제: 본인 row 또는 팀장/관리자
drop policy if exists "team_report_items_delete" on public.team_report_items;
create policy "team_report_items_delete"
  on public.team_report_items for delete
  using (
    user_id = auth.uid()
    or public.tw_is_leader_or_admin()
  );

comment on table public.team_reports is '팀 업무일지 헤더 (team_id, report_date 당 1개) — 팀장 코멘트 보관';
comment on table public.team_report_items is '팀 업무일지 팀원별 작성 로우 — 각자 자기 row 편집';
comment on function public.tw_is_leader_or_admin() is '현재 로그인 사용자가 팀장 또는 관리자 급인지 여부';
