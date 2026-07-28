-- 039_econtract_design_state.sql
-- 전자계약(econtracts, Contract-OS 읽기전용)의 설계팀 워크플로 상태를
-- 세움os 쪽에 저장한다. 설계 우선순위 목록에 수기 계약과 함께 통합되며,
-- 완료 체크/긴급/설계상태/건축허가 완료일을 여기에 기록한다.
-- 키: econtracts.id (bigint).

CREATE TABLE IF NOT EXISTS public.econtract_design_state (
  econtract_id bigint PRIMARY KEY,
  contract_no  text,
  priority_done boolean DEFAULT false,
  is_urgent     boolean DEFAULT false,
  design_status text DEFAULT 'none',
  permit_cert_date date,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.econtract_design_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eds_read"  ON public.econtract_design_state;
CREATE POLICY "eds_read"  ON public.econtract_design_state FOR SELECT USING (true);

DROP POLICY IF EXISTS "eds_write" ON public.econtract_design_state;
CREATE POLICY "eds_write" ON public.econtract_design_state FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'econtract_design_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.econtract_design_state;
  END IF;
END$$;
