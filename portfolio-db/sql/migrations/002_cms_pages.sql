-- Flexible CMS-managed pages. Page-specific content is stored as JSONB so
-- content fields can evolve without changing the relational schema each time.
CREATE TABLE IF NOT EXISTS cms_pages (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(200) NOT NULL,
  slug              VARCHAR(200) NOT NULL UNIQUE,
  content           JSONB        NOT NULL DEFAULT '{}'::jsonb,
  status            post_status  NOT NULL DEFAULT 'draft',
  meta_title        VARCHAR(120),
  meta_description  VARCHAR(160),
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cms_pages_status_published
  ON cms_pages(status, published_at DESC)
  WHERE deleted_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_cms_pages_updated_at'
      AND tgrelid = 'cms_pages'::regclass
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER trg_cms_pages_updated_at
      BEFORE UPDATE ON cms_pages
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
