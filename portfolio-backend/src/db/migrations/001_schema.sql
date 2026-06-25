-- ============================================================
-- Portfolio Backend — Complete Database Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- fuzzy search

-- ─────────────────────────────────────────────────────────────
-- 1. ADMIN USERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  name            VARCHAR(100) NOT NULL,
  avatar_url      TEXT,
  refresh_token   TEXT,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 2. SITE SETTINGS (singleton row)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_name          VARCHAR(100)  NOT NULL DEFAULT 'Irfan Ansari',
  owner_title         VARCHAR(200)  NOT NULL DEFAULT 'Full Stack Developer',
  owner_email         VARCHAR(255)  NOT NULL DEFAULT 'irfan@example.com',
  owner_location      VARCHAR(100),
  owner_avatar_url    TEXT,
  owner_resume_url    TEXT,
  hero_taglines       TEXT[]        NOT NULL DEFAULT ARRAY['Full Stack Developer','React Specialist','Node.js Expert'],
  hero_bio_short      TEXT,
  about_bio           TEXT,
  about_years_exp     SMALLINT      NOT NULL DEFAULT 0,
  about_projects_count SMALLINT     NOT NULL DEFAULT 0,
  meta_title          VARCHAR(200),
  meta_description    TEXT,
  og_image_url        TEXT,
  notify_email        VARCHAR(255),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Seed singleton row
INSERT INTO site_settings (id) VALUES (uuid_generate_v4())
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 3. SOCIAL LINKS
-- ─────────────────────────────────────────────────────────────
CREATE TYPE social_platform AS ENUM (
  'github','linkedin','twitter','instagram','youtube','website','other'
);

CREATE TABLE IF NOT EXISTS social_links (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform       social_platform NOT NULL,
  url            TEXT NOT NULL,
  label          VARCHAR(80),
  display_order  SMALLINT NOT NULL DEFAULT 0,
  is_visible     BOOLEAN  NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 4. TAGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(50)  UNIQUE NOT NULL,    -- machine key e.g. "react"
  label      VARCHAR(80)  NOT NULL,           -- display label e.g. "React.js"
  color      VARCHAR(7)   NOT NULL DEFAULT '#1A73E8',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 5. SKILL CATEGORIES + SKILLS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(80)  NOT NULL,
  display_order SMALLINT     NOT NULL DEFAULT 0,
  is_visible    BOOLEAN      NOT NULL DEFAULT true
);

CREATE TYPE skill_level AS ENUM ('beginner','intermediate','advanced','expert');

CREATE TABLE IF NOT EXISTS skills (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id   UUID NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,
  name          VARCHAR(80)  NOT NULL,
  icon_url      TEXT,
  level         skill_level  NOT NULL DEFAULT 'intermediate',
  display_order SMALLINT     NOT NULL DEFAULT 0,
  is_visible    BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category_id);

-- ─────────────────────────────────────────────────────────────
-- 6. EXPERIENCES
-- ─────────────────────────────────────────────────────────────
CREATE TYPE experience_type AS ENUM ('work','education','certification','achievement');

CREATE TABLE IF NOT EXISTS experiences (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type          experience_type NOT NULL DEFAULT 'work',
  title         VARCHAR(200) NOT NULL,
  organization  VARCHAR(200) NOT NULL,
  location      VARCHAR(100),
  description   TEXT,
  start_date    DATE NOT NULL,
  end_date      DATE,
  is_current    BOOLEAN NOT NULL DEFAULT false,
  logo_url      TEXT,
  display_order SMALLINT NOT NULL DEFAULT 0,
  is_visible    BOOLEAN  NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experiences_type ON experiences(type);

-- ─────────────────────────────────────────────────────────────
-- 7. PROJECTS
-- ─────────────────────────────────────────────────────────────
CREATE TYPE project_status AS ENUM ('draft','published','archived');

CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(200) NOT NULL,
  slug          VARCHAR(220) UNIQUE NOT NULL,
  short_desc    VARCHAR(300) NOT NULL,
  long_desc     TEXT,
  thumbnail_url TEXT,
  github_url    TEXT,
  demo_url      TEXT,
  status        project_status NOT NULL DEFAULT 'published',
  is_featured   BOOLEAN NOT NULL DEFAULT false,
  display_order SMALLINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_projects_slug       ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status     ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_featured   ON projects(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_projects_deleted    ON projects(deleted_at)  WHERE deleted_at IS NULL;

-- Project ↔ Tag pivot
CREATE TABLE IF NOT EXISTS project_tags (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

-- Project screenshots
CREATE TABLE IF NOT EXISTS project_screenshots (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  alt_text      VARCHAR(200),
  display_order SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_screenshots_project ON project_screenshots(project_id);

-- ─────────────────────────────────────────────────────────────
-- 8. BLOG POSTS
-- ─────────────────────────────────────────────────────────────
CREATE TYPE post_status AS ENUM ('draft','published','archived');

CREATE TABLE IF NOT EXISTS blog_posts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             VARCHAR(300) NOT NULL,
  slug              VARCHAR(320) UNIQUE NOT NULL,
  excerpt           VARCHAR(500) NOT NULL,
  content           TEXT NOT NULL DEFAULT '',
  cover_image_url   TEXT,
  reading_time_mins SMALLINT NOT NULL DEFAULT 1,
  status            post_status NOT NULL DEFAULT 'draft',
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_posts_slug       ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status     ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published  ON blog_posts(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_deleted    ON blog_posts(deleted_at) WHERE deleted_at IS NULL;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_posts_fts ON blog_posts
  USING GIN (to_tsvector('english', title || ' ' || excerpt || ' ' || content));

-- Post ↔ Tag pivot
CREATE TABLE IF NOT EXISTS post_tags (
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES tags(id)       ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- ─────────────────────────────────────────────────────────────
-- 9. CONTACTS
-- ─────────────────────────────────────────────────────────────
CREATE TYPE contact_status AS ENUM ('unread','read','replied','archived');

CREATE TABLE IF NOT EXISTS contacts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  subject    VARCHAR(200) NOT NULL,
  message    TEXT         NOT NULL,
  status     contact_status NOT NULL DEFAULT 'unread',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_status     ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 10. ANALYTICS EVENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id         BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  path       VARCHAR(500),
  ref_id     VARCHAR(200),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_path        ON analytics_events(path) WHERE path IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 11. AUTO-UPDATE updated_at TRIGGER
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'admin_users','skills','experiences','projects','blog_posts'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_updated_at ON %I;
       CREATE TRIGGER trg_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      t, t
    );
  END LOOP;
END;
$$;
