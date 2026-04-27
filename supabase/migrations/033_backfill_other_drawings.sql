-- 033_backfill_other_drawings.sql
-- contracts.payload 의 permit/civil/design 1·2·3차 도면 URL 들을
-- contract_drawings 행으로 분해 삽입. 030 과 동일 패턴 (멱등).

INSERT INTO public.contract_drawings (contract_local_id, kind, url, path, file_name, sort_order)
SELECT
  c.local_id,
  drawing_kind.kind AS kind,
  trim(urls.url) AS url,
  CASE
    WHEN position('/object/public/contract_files/' IN urls.url) > 0
      THEN substring(urls.url FROM position('/object/public/contract_files/' IN urls.url) + length('/object/public/contract_files/'))
    ELSE NULL
  END AS path,
  regexp_replace(
    split_part(split_part(urls.url, '?', 1), '/', -1),
    '^[0-9]+_', ''
  ) AS file_name,
  urls.ord AS sort_order
FROM public.contracts c
CROSS JOIN LATERAL (
  VALUES
    ('permit',  c.payload->>'permitDrawingAttachment'),
    ('civil',   c.payload->>'civilDrawingAttachment'),
    ('design1', c.payload->>'designDrawingAttachment'),
    ('design2', c.payload->>'designDrawing2Attachment'),
    ('design3', c.payload->>'designDrawing3Attachment')
) AS drawing_kind(kind, raw_value)
CROSS JOIN LATERAL (
  SELECT u AS url, ord
  FROM unnest(string_to_array(COALESCE(drawing_kind.raw_value, ''), '|')) WITH ORDINALITY AS t(u, ord)
) urls
WHERE COALESCE(drawing_kind.raw_value, '') <> ''
  AND trim(urls.url) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.contract_drawings d
    WHERE d.contract_local_id = c.local_id
      AND d.kind = drawing_kind.kind
      AND d.url = trim(urls.url)
  );
