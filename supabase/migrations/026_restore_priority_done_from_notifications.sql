-- 설계팀 "작업완료" 체크 리셋 사고 복구 (30건 → 4건으로 롤백된 증상)
--
-- 원인:
--   saveContracts() 의 bulk upsert 가 전용 컬럼(priority_done 등) 까지 포함해서
--   Supabase 에 덮어쓰고 있었음. 다른 사용자의 stale localStorage 값이 동기화
--   되면 최신 priority_done=true 가 false 로 초기화되는 사고가 발생.
--   코드는 커밋 8202a56 (PR #281) 에서 수정됨.
--
-- 복구 근거:
--   "작업완료" 버튼 클릭 시마다 notifications 테이블에 title='✅ 설계 작업 완료'
--   의 행이 contract_id 와 함께 저장됨. 이 이력을 역추적해 priority_done 을 true
--   로 되돌린다.
--
-- 안전 장치:
--   · 현재 priority_done = false 인 행만 건드린다 (이미 완료 상태인 건 스킵).
--   · "복원" 버튼 (priority-undone-btn) 은 notification 을 남기지 않지만, 복원
--     의도가 있었던 건까지 자동 복구되는 것을 막기 위해
--     created_at 이 최근 30일 이내인 알림만 대상으로 한다.
--   · 필요시 WHERE created_at >= '2026-04-22' 등 날짜 범위를 좁혀 실행 가능.

-- ────────────────────────────────────────────────────────────
-- STEP 1 (DRY RUN): 복구 대상 미리보기
--   아래 쿼리를 먼저 실행해 복구 후보 리스트를 확인한다.
-- ────────────────────────────────────────────────────────────
-- SELECT
--   c.local_id,
--   c.customer_name,
--   c.model_name,
--   c.contract_date,
--   c.priority_done AS current_state,
--   n.last_done_at
-- FROM public.contracts c
-- JOIN (
--   SELECT contract_id, MAX(created_at) AS last_done_at
--   FROM public.notifications
--   WHERE title = '✅ 설계 작업 완료'
--     AND contract_id IS NOT NULL
--     AND created_at >= now() - interval '30 days'
--   GROUP BY contract_id
-- ) n ON n.contract_id = c.local_id
-- WHERE c.priority_done = false
-- ORDER BY n.last_done_at DESC;

-- ────────────────────────────────────────────────────────────
-- STEP 2 (APPLY): 실제 복구
-- ────────────────────────────────────────────────────────────
WITH done_history AS (
  SELECT contract_id, MAX(created_at) AS last_done_at
  FROM public.notifications
  WHERE title = '✅ 설계 작업 완료'
    AND contract_id IS NOT NULL
    AND created_at >= now() - interval '30 days'
  GROUP BY contract_id
)
UPDATE public.contracts c
SET priority_done = true
FROM done_history h
WHERE c.local_id = h.contract_id
  AND c.priority_done = false
RETURNING c.local_id, c.customer_name, c.model_name, h.last_done_at;
