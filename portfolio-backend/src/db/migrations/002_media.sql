-- ============================================================
-- Migration 002: Media Library
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type     VARCHAR(100) NOT NULL,
  file_type     VARCHAR(20)  NOT NULL, -- 'image', 'video', 'document', 'other'
  size_bytes    BIGINT       NOT NULL DEFAULT 0,
  url           TEXT         NOT NULL,
  public_id     VARCHAR(255),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_file_type  ON media(file_type);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
