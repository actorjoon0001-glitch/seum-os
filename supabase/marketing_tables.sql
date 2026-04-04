-- ====================================================================
-- 마케팅팀 업무 관리 테이블
-- Supabase SQL Editor에서 실행하세요.
-- ====================================================================

-- 1. 월별 영상관리
CREATE TABLE IF NOT EXISTS public.marketing_videos (
  id          BIGSERIAL PRIMARY KEY,
  year_month  TEXT NOT NULL,          -- e.g. '2026-04'
  title       TEXT NOT NULL,
  shoot_date  DATE,
  assignee    TEXT,
  status      TEXT DEFAULT '촬영예정', -- 촬영예정 | 촬영완료 | 편집중 | 업로드완료
  nas_link    TEXT,
  memo        TEXT,
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marketing_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketing_videos_all" ON public.marketing_videos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_mv_year_month ON public.marketing_videos(year_month);


-- 2. 촬영 스케줄
CREATE TABLE IF NOT EXISTS public.marketing_schedules (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  shoot_date   DATE NOT NULL,
  location     TEXT,
  assignee     TEXT,
  memo         TEXT,
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marketing_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketing_schedules_all" ON public.marketing_schedules
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_ms_shoot_date ON public.marketing_schedules(shoot_date);


-- 3. 파일 공유 메타데이터
CREATE TABLE IF NOT EXISTS public.marketing_files (
  id               BIGSERIAL PRIMARY KEY,
  project          TEXT,           -- 프로젝트/영상 분류
  file_name        TEXT NOT NULL,
  file_path        TEXT,           -- Supabase Storage 경로
  file_url         TEXT,           -- Public URL
  file_type        TEXT,           -- 확장자 (jpg, pdf, ...)
  file_size        BIGINT,         -- bytes
  uploaded_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_by_name TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marketing_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketing_files_all" ON public.marketing_files
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_mf_project ON public.marketing_files(project);


-- 4. 영상 NAS 링크
CREATE TABLE IF NOT EXISTS public.marketing_nas_links (
  id           BIGSERIAL PRIMARY KEY,
  project      TEXT,
  title        TEXT,
  nas_url      TEXT NOT NULL,
  description  TEXT,
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marketing_nas_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketing_nas_links_all" ON public.marketing_nas_links
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ====================================================================
-- Supabase Storage 버킷 생성 (파일 공유용)
-- Storage > Buckets > New bucket 에서 직접 만들거나 아래 실행:
-- ====================================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('marketing_files', 'marketing_files', true)
-- ON CONFLICT (id) DO NOTHING;
