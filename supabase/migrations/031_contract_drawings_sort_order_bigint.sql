-- 031_contract_drawings_sort_order_bigint.sql
-- contract_drawings.sort_order 를 integer → bigint 로 변경.
-- JS 코드가 Date.now() (13자리, 약 1.7조) 를 sort_order 에 넣는데
-- integer 최대값(약 21억) 을 초과해 INSERT 가 400 에러로 실패하는 사고를 수정.
--
-- 029 에서 처음부터 bigint 로 정의했어야 했는데 누락된 결함.

ALTER TABLE public.contract_drawings
  ALTER COLUMN sort_order TYPE bigint;

COMMENT ON COLUMN public.contract_drawings.sort_order IS '화면 표시 순서. JS Date.now() 값을 사용할 수 있도록 bigint.';
