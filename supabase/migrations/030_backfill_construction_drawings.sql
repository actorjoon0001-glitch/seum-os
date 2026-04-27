-- 030_backfill_construction_drawings.sql
-- contracts.payload.constructionDrawingAttachment 의 '|' 구분 URL 들을
-- contract_drawings(kind='construction') 행으로 분해 삽입.
-- 027~ 처럼 멱등하게 (이미 있는 행은 건너뜀) 동작.
--
-- payload 의 키는 그대로 유지한다. JS 코드 마이그레이션이 끝나면 후속 PR 에서
-- payload 의 도면 키들을 비우는 정리 마이그레이션을 별도로 진행한다.

INSERT INTO public.contract_drawings (contract_local_id, kind, url, path, file_name, sort_order)
SELECT
  c.local_id,
  'construction' AS kind,
  trim(url) AS url,
  -- 'https://<project>.supabase.co/storage/v1/object/public/contract_files/<path>'
  --  → path = 'contract_files/' 이후 부분
  CASE
    WHEN position('/object/public/contract_files/' IN url) > 0
      THEN substring(url FROM position('/object/public/contract_files/' IN url) + length('/object/public/contract_files/'))
    ELSE NULL
  END AS path,
  -- 파일명 = URL 의 마지막 / 이후 (쿼리스트링 제거)
  regexp_replace(
    split_part(split_part(url, '?', 1), '/', -1),
    '^[0-9]+_', ''
  ) AS file_name,
  ord AS sort_order
FROM public.contracts c
CROSS JOIN LATERAL (
  SELECT u AS url, ord
  FROM unnest(
    string_to_array(COALESCE(c.payload->>'constructionDrawingAttachment', ''), '|')
  ) WITH ORDINALITY AS t(u, ord)
) urls
WHERE COALESCE(c.payload->>'constructionDrawingAttachment','') <> ''
  AND trim(urls.url) <> ''
  -- 멱등성: 동일 contract_local_id + kind + url 행이 이미 있으면 건너뜀
  AND NOT EXISTS (
    SELECT 1 FROM public.contract_drawings d
    WHERE d.contract_local_id = c.local_id
      AND d.kind = 'construction'
      AND d.url = trim(urls.url)
  );
