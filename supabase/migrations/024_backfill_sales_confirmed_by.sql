-- 검토자 확인 체크박스에 표시할 이름을 기존 계약에도 채워 넣는다.
-- '영업팀 확인'은 영업팀이 계약 등록 시점에 거친 것으로 간주하므로,
-- payload->>'salesPerson' (담당 영업사원) 을 sales_confirmed_by 로 백필한다.
-- 이미 누군가 수동으로 체크해 sales_confirmed_by 가 채워진 행은 건드리지 않음.

UPDATE public.contracts
SET sales_confirmed_by = NULLIF(payload->>'salesPerson', '')
WHERE sales_confirmed = true
  AND (sales_confirmed_by IS NULL OR sales_confirmed_by = '')
  AND COALESCE(payload->>'salesPerson', '') <> '';
