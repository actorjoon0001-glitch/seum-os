-- 설계담당자 전용 컬럼 추가 + payload 에서 백필
-- 목적: bulk upsert (saveContracts) 의 stale payload 덮어쓰기로부터
--      designPermitDesigner / designContactName 을 보호.
--      커밋 8202a56 에서 priority_done 등을 보호한 것과 동일한 패턴.
--
-- Supabase SQL Editor 에서 실행.

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS design_permit_designer text,
  ADD COLUMN IF NOT EXISTS design_contact_name text;

-- 기존 payload JSON 에 저장된 값으로 백필
UPDATE public.contracts
SET
  design_permit_designer = COALESCE(NULLIF(TRIM(payload->>'designPermitDesigner'), ''), design_permit_designer),
  design_contact_name    = COALESCE(NULLIF(TRIM(payload->>'designContactName'), ''), design_contact_name)
WHERE payload IS NOT NULL;
