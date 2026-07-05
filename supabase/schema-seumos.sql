-- ============================================================
-- 전자계약서(econtracts) 스키마 · 세움os Supabase 프로젝트에서 실행
-- ------------------------------------------------------------
-- Contract-OS(전산 계약서 앱, https://seum-platform.netlify.app/portal)가
-- service_role 로 계약을 write 하고, 세움os 는 로그인 사용자로 "요약 컬럼만" read 한다.
-- 신분증·소유자 등 민감정보가 담긴 data(jsonb) 는 세움os 목록에서 조회하지 않는다.
-- 세움os 기존 contracts 테이블과는 완전히 분리된 별도 테이블.
-- ============================================================

-- 전자계약서 전용 테이블 (세움os 기존 contracts 와 분리)
create table if not exists public.econtracts (
  id            bigint generated always as identity primary key,
  contract_no   text unique,
  status        text not null default 'draft',
  client_name   text,
  site_address  text,
  showroom      text,
  salesperson   text,
  contract_date text,
  total_amount  numeric,
  data          jsonb not null,     -- 계약 본문 전체(신분증·소유자 등 모두 포함) — 세움os 는 조회 안 함
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists econtracts_updated_at_idx on public.econtracts (updated_at desc);
create index if not exists econtracts_contract_no_idx on public.econtracts (contract_no);

alter table public.econtracts enable row level security;

-- 조회 정책: 로그인(authenticated) 사용자만. 본인이 생성한 계약(data->>'ownerEmail')
-- 또는 관리자만 볼 수 있다. 세움os 로그인 이메일 = Contract-OS ownerEmail 로 운영하므로
-- 각 영업사원은 본인 계약만, 관리자는 전체가 보인다.
-- Contract-OS 는 service_role 로 접근하므로 이 정책의 영향을 받지 않음(항상 정상 동작).
drop policy if exists econtracts_select_own_or_admin on public.econtracts;
create policy econtracts_select_own_or_admin on public.econtracts
  for select to authenticated
  using (
    (data->>'ownerEmail') = (auth.jwt() ->> 'email')
    or (auth.jwt() ->> 'email') in ('actorjoon0001@gmail.com')  -- 관리자 이메일
  );
