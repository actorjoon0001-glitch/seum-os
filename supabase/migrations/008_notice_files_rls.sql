-- ============================================================
-- notice_files 테이블 RLS 정책 (첨부파일 목록 조회/등록 허용)
-- Supabase SQL Editor에서 실행
-- ============================================================
-- 이 테이블에 RLS가 켜져 있으면 정책이 없어서 목록이 안 보일 수 있음.
-- 아래 정책으로 로그인 사용자는 조회(SELECT)·등록(INSERT) 가능.

ALTER TABLE public.notice_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notice_files_select_authenticated"
ON public.notice_files FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "notice_files_insert_authenticated"
ON public.notice_files FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "notice_files_delete_authenticated"
ON public.notice_files FOR DELETE
TO authenticated
USING (true);
