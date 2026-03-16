-- ============================================================
-- 공지 첨부파일 메타데이터 테이블 (notice_files)
-- Supabase SQL Editor에서 실행
-- ============================================================
--
-- [Storage 버킷 설정]
-- 1. 대시보드 > Storage > New bucket > 이름: notice_files
-- 2. Public bucket 체크(또는 정책으로 인증 사용자 읽기 허용)
-- 3. Policies 예시:
--    - INSERT: (auth.role() = 'authenticated')
--    - SELECT: true (공개) 또는 (auth.role() = 'authenticated')
--    - DELETE: (auth.role() = 'authenticated') 등
--

CREATE TABLE IF NOT EXISTS public.notice_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id text NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  uploaded_by uuid,
  uploaded_by_name text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.notice_files IS '공지 첨부파일';

CREATE INDEX IF NOT EXISTS idx_notice_files_notice_id ON public.notice_files(notice_id);
