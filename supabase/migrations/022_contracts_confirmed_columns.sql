-- 계약 검토자 체크 / 최종승인 / 시공 착공 가능 플래그를 payload JSON 의존에서
-- 전용 컬럼으로 분리. 다른 사용자의 saveContracts bulk upsert 가 이 값을
-- 덮어쓰지 못하도록 보호 (priority_done / is_urgent / design_status 와 동일 패턴).

ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS sales_confirmed        boolean NOT NULL DEFAULT false;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS design_confirmed       boolean NOT NULL DEFAULT false;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS construction_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS final_approved         boolean NOT NULL DEFAULT false;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS construction_start_ok  boolean NOT NULL DEFAULT false;

-- 기존 payload 값 백필 (최초 1회)
UPDATE public.contracts
SET
  sales_confirmed        = COALESCE((payload->>'salesConfirmed')::boolean, false),
  design_confirmed       = COALESCE((payload->>'designConfirmed')::boolean, false),
  construction_confirmed = COALESCE((payload->>'constructionConfirmed')::boolean, false),
  final_approved         = COALESCE((payload->>'finalApproved')::boolean, false),
  construction_start_ok  = COALESCE((payload->>'constructionStartOk')::boolean, false)
WHERE payload IS NOT NULL;

-- 시공팀 필터 조회 가속
CREATE INDEX IF NOT EXISTS idx_contracts_construction_start_ok ON public.contracts(construction_start_ok);
