-- contracts 테이블에 앱 계약 데이터 동기화를 위한 컬럼 추가
-- Supabase SQL Editor에서 실행

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS local_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS showroom_id text,
  ADD COLUMN IF NOT EXISTS contract_date date,
  ADD COLUMN IF NOT EXISTS contract_amount numeric,
  ADD COLUMN IF NOT EXISTS sales_person text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS model_name text,
  ADD COLUMN IF NOT EXISTS payload jsonb;

CREATE INDEX IF NOT EXISTS idx_contracts_local_id ON public.contracts(local_id);
CREATE INDEX IF NOT EXISTS idx_contracts_showroom_id ON public.contracts(showroom_id);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_date ON public.contracts(contract_date);

