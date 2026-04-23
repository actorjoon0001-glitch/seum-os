-- 검토자 확인 체크박스를 누른 사람(이름)을 기록하기 위한 전용 컬럼.
-- 기존 *_confirmed boolean 컬럼과 동일 패턴으로 payload 와 분리 보관하여
-- 다른 사용자의 saveContracts bulk upsert 가 이 값을 덮어쓰지 못하도록 한다.

ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS sales_confirmed_by        text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS design_confirmed_by       text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS construction_confirmed_by text;
