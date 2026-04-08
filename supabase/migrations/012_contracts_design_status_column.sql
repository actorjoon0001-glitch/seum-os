-- 설계진행상태를 payload JSON 의존에서 전용 컬럼으로 분리
-- 다른 사용자의 saveContracts 호출이 설계진행상태를 덮어쓰지 않도록 보호

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS design_status text NOT NULL DEFAULT 'none';

-- 기존 payload에 저장된 값으로 마이그레이션
UPDATE contracts
SET design_status = COALESCE(payload->>'designStatus', 'none')
WHERE payload IS NOT NULL;
