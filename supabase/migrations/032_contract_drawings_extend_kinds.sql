-- 032_contract_drawings_extend_kinds.sql
-- contract_drawings.kind 의 CHECK 제약을 확장하여 허가/토목/설계 협의 1·2·3차 도면을 함께 관리.
-- 'discussion' 은 사용 안 하므로 제거. 'design' 단일 값을 'design1','design2','design3' 으로 분리.

ALTER TABLE public.contract_drawings DROP CONSTRAINT IF EXISTS contract_drawings_kind_check;

ALTER TABLE public.contract_drawings
  ADD CONSTRAINT contract_drawings_kind_check
  CHECK (kind IN ('construction', 'permit', 'civil', 'design1', 'design2', 'design3'));

COMMENT ON COLUMN public.contract_drawings.kind IS '도면 종류: construction(시공) | permit(허가) | civil(토목) | design1(설계 협의 1차) | design2(설계 협의 2차) | design3(설계 협의 3차)';
