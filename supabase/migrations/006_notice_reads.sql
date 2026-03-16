-- ============================================================
-- 공지 읽음 확인 테이블 (notice_reads)
-- Supabase SQL Editor에서 실행
-- ============================================================
-- 공지 상세 모달을 열 때 직원별 읽음 기록 저장, 같은 공지·같은 사용자 중복 방지

CREATE TABLE IF NOT EXISTS public.notice_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id text NOT NULL,
  user_id uuid,
  user_name text,
  department text,
  showroom text,
  read_at timestamptz DEFAULT now(),
  UNIQUE(notice_id, user_id)
);

COMMENT ON TABLE public.notice_reads IS '공지 읽음 확인';

-- RLS 정책은 필요 시 프로젝트 설정에 맞게 추가
