-- 계약 소프트삭제 컬럼 추가
-- 배경: deleteContractById 가 DELETE 로 행 자체를 제거하던 구조에서는,
--      다른 사용자(또는 같은 사용자의 다른 기기)의 localStorage 에 stale 한
--      해당 계약이 남아있을 때 saveContracts() 의 bulk upsert (onConflict=local_id)
--      가 그 행을 INSERT 로 다시 만들어 "다음날 부활" 사고가 발생했다.
--
-- 본 마이그레이션은 is_deleted 컬럼을 추가해 소프트삭제로 전환한다.
-- saveContracts 의 upsert 페이로드는 is_deleted 컬럼을 보내지 않으므로,
-- onConflict=local_id 로 UPDATE 가 발생해도 is_deleted=true 값은 그대로 보존된다.
-- 동기화(select) 측에서 is_deleted=false 로 필터하면 더 이상 살아나지 않는다.
--
-- Supabase SQL Editor 에서 실행.

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by text;

CREATE INDEX IF NOT EXISTS idx_contracts_is_deleted
  ON public.contracts (is_deleted)
  WHERE is_deleted = false;
