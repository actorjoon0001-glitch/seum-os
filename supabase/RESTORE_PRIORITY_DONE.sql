-- ============================================================
-- 설계팀 우선순위 "작업완료" 복구 스크립트
-- 사고: commit 8202a56 이전 bulk upsert 버그로 priority_done 이 리셋됨
--       (2026-04-23 "30건 → 4건" 증상)
-- 이 스크립트는 Supabase SQL Editor 에서 순서대로 실행한다.
-- ============================================================


-- ------------------------------------------------------------
-- [1] 현재 상태 진단 (읽기 전용)
--   column_done=4 인지 확인. payload_done 이 살아있는지 점검.
-- ------------------------------------------------------------
SELECT
  local_id,
  customer_name,
  priority_done                       AS column_done,
  (payload->>'priorityDone')::boolean AS payload_done,
  payload->>'depositReceivedAt'       AS deposit_received_at,
  payload->>'contractDate'            AS contract_date,
  payload->>'siteAddress'             AS site_address
FROM public.contracts
WHERE payload->>'depositReceivedAt' IS NOT NULL
ORDER BY
  (payload->>'priorityDone')::boolean DESC NULLS LAST,
  column_done DESC,
  customer_name;


-- ------------------------------------------------------------
-- [2] payload 에만 true 로 남아있는 건 자동 복원 (공짜 회수분)
--   앱 배포본에도 restoreOrphanedPriorityDoneOnce 로 자동 수행되므로
--   대개 불필요. 수동으로 먼저 돌리고 싶을 때 사용.
-- ------------------------------------------------------------
-- 2a) dry-run
SELECT local_id, customer_name
FROM public.contracts
WHERE (payload->>'priorityDone')::boolean = true
  AND priority_done = false
  AND payload->>'depositReceivedAt' IS NOT NULL;

-- 2b) 실제 복구
-- UPDATE public.contracts
-- SET priority_done = true
-- WHERE (payload->>'priorityDone')::boolean = true
--   AND priority_done = false
--   AND payload->>'depositReceivedAt' IS NOT NULL;


-- ------------------------------------------------------------
-- [3] PITR 클론에서 복구 리스트 추출
--   절차:
--     1. Dashboard → Database → Backups → Point in Time Recovery
--     2. 사고 직전 시각(2026-04-23 07:50 KST 이전, 8202a56 배포 전) 선택
--     3. "Restore to a new project" 로 클론 생성 (원본 롤백 금지)
--     4. 클론 프로젝트 SQL Editor 에서 아래 실행, 결과를 복사
-- ------------------------------------------------------------
-- [PITR 클론에서 실행]
SELECT local_id
FROM public.contracts
WHERE priority_done = true
  AND payload->>'depositReceivedAt' IS NOT NULL
ORDER BY local_id;


-- ------------------------------------------------------------
-- [4] 원본 DB 에 일괄 복원
--   위 [3] 의 결과(local_id 리스트)를 아래 VALUES 에 붙여넣고 실행.
--   단방향 (true 로만), 다른 컬럼 건드리지 않음.
-- ------------------------------------------------------------
UPDATE public.contracts
SET priority_done = true
WHERE local_id = ANY (ARRAY[
  -- ↓↓↓ 여기에 [3] 에서 뽑은 local_id 를 '...','...' 로 붙여넣기 ↓↓↓
  'PASTE_LOCAL_ID_1_HERE',
  'PASTE_LOCAL_ID_2_HERE'
  -- ...
]);

-- 복원 후 건수 확인
SELECT COUNT(*) AS done_count
FROM public.contracts
WHERE priority_done = true
  AND payload->>'depositReceivedAt' IS NOT NULL;


-- ------------------------------------------------------------
-- [대안] PITR 이 불가능한 경우: 수동 리스트로 복원
--   설계팀에서 작업완료였던 건들의 고객명 또는 계약번호를 받아 진행.
-- ------------------------------------------------------------
-- 5a) 후보 조회 (고객명만 받은 경우 동명이인 체크)
SELECT local_id, customer_name,
       payload->>'contractDate' AS contract_date,
       payload->>'siteAddress'  AS site_address,
       payload->>'contractModelName' AS model
FROM public.contracts
WHERE customer_name = ANY (ARRAY['이완상','홍길동'])  -- 받은 이름 리스트
  AND payload->>'depositReceivedAt' IS NOT NULL
ORDER BY customer_name;

-- 5b) 동명이인 없거나 local_id 확정되면 UPDATE
-- UPDATE public.contracts
-- SET priority_done = true
-- WHERE local_id = ANY (ARRAY[
--   'ctr_xxxx...',
--   'ctr_yyyy...'
-- ]);
