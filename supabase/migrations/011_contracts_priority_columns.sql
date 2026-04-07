-- 설계팀 우선순위 필드를 payload JSON 의존에서 전용 컬럼으로 분리
-- 이렇게 하면 다른 사용자의 saveContracts 호출이 우선순위 데이터를 덮어쓰지 않음

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS priority_done boolean NOT NULL DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false;

-- 기존 payload에 저장된 값으로 마이그레이션
UPDATE contracts
SET
  priority_done = COALESCE((payload->>'priorityDone')::boolean, false),
  is_urgent     = COALESCE((payload->>'isUrgent')::boolean, false)
WHERE payload IS NOT NULL;
