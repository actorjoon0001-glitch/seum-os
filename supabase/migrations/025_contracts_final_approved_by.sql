-- 최종 승인 버튼을 누른 사람 이름을 저장하기 위한 전용 컬럼.
-- *_confirmed_by 와 동일 패턴으로 payload 와 분리 보관하여 bulk upsert 로
-- 덮어쓰이지 않도록 보호한다.

ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS final_approved_by text;
