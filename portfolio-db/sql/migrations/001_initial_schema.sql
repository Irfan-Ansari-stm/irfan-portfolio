-- =============================================================
--  IRFAN ANSARI — PORTFOLIO WEBSITE
--  PostgreSQL Schema  |  v1.0.0  |  May 2026
--  Everything is editable via admin panel (no hardcoded data)
-- =============================================================
-- Run this file while connected to irfanportfolio. PostgreSQL cannot create a
-- database from inside a transaction; use scripts/initialize-database.ps1 for
-- the guarded database creation step.
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================
--  ENUMS
-- =============================================================

DO $$ BEGIN CREATE TYPE project_status AS ENUM ('draft', 'published', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE contact_status AS ENUM ('unread', 'read', 'replied', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE experience_type AS ENUM ('work', 'education', 'certification', 'achievement'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE social_platform AS ENUM ('github', 'linkedin', 'twitter', 'instagram', 'youtube', 'website', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- =============================================================
--  ADMIN / AUTH
--  Single admin user (portfolio owner)
-- =============================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(200)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,              -- bcrypt hash
  name            VARCHAR(100)  NOT NULL,
  avatar_url      VARCHAR(500),
  refresh_token   VARCHAR(500),                        -- rotated on each login
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);


-- =============================================================
--  SITE SETTINGS
--  All hero / about / seo / meta content is editable here
-- =============================================================

CREATE TABLE IF NOT EXISTS site_settings (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  owner_name            VARCHAR(100)  NOT NULL DEFAULT 'Irfan Ansari',
  owner_title           VARCHAR(200)  NOT NULL DEFAULT 'Full Stack Developer',
  owner_email           VARCHAR(200)  NOT NULL,
  owner_location        VARCHAR(100),
  owner_avatar_url      VARCHAR(500),
  owner_resume_url      VARCHAR(500),

  -- Hero section
  hero_taglines         TEXT[]        NOT NULL DEFAULT ARRAY[
                          'Full Stack Developer',
                          'JavaScript Engineer',
                          'Python Developer',
                          'System Designer'
                        ],                                        -- typewriter loop
  hero_bio_short        VARCHAR(300),                            -- 1-line subtitle

  -- About section
  about_bio             TEXT,                                     -- long markdown bio
  about_years_exp       SMALLINT      DEFAULT 1,
  about_projects_count  SMALLINT      DEFAULT 0,

  -- SEO / Meta
  meta_title            VARCHAR(120),
  meta_description      VARCHAR(160),
  og_image_url          VARCHAR(500),

  -- Contact notification email (where form submissions are sent)
  notify_email          VARCHAR(200),

  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- One row only
INSERT INTO site_settings (id, owner_name, owner_title, owner_email)
SELECT gen_random_uuid(), 'Irfan Ansari', 'Full Stack Developer', 'irfan@example.com'
WHERE NOT EXISTS (SELECT 1 FROM site_settings);


-- =============================================================
--  SOCIAL LINKS  (fully editable, ordered)
-- =============================================================

CREATE TABLE IF NOT EXISTS social_links (
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  platform    social_platform NOT NULL,
  url         VARCHAR(500)    NOT NULL,
  label       VARCHAR(100),                -- optional display label
  display_order SMALLINT      NOT NULL DEFAULT 0,
  is_visible  BOOLEAN         NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);


-- =============================================================
--  TAGS  (shared across projects and blog posts)
-- =============================================================

CREATE TABLE IF NOT EXISTS tags (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50)  NOT NULL UNIQUE,         -- e.g. 'react', 'nodejs'
  label       VARCHAR(80)  NOT NULL,                -- display label: 'React'
  color       VARCHAR(7)   DEFAULT '#1A73E8',        -- hex color for badge
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);


-- =============================================================
--  SKILL CATEGORIES + SKILLS
-- =============================================================

CREATE TABLE IF NOT EXISTS skill_categories (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(80)   NOT NULL UNIQUE,      -- 'Frontend', 'Backend', etc.
  display_order SMALLINT      NOT NULL DEFAULT 0,
  is_visible    BOOLEAN       NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS skills (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID         NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,
  name            VARCHAR(80)  NOT NULL,
  icon_url        VARCHAR(500),                     -- SVG / image URL
  level           skill_level  NOT NULL DEFAULT 'intermediate',
  display_order   SMALLINT     NOT NULL DEFAULT 0,
  is_visible      BOOLEAN      NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);


-- =============================================================
--  EXPERIENCE / TIMELINE  (about section)
-- =============================================================

CREATE TABLE IF NOT EXISTS experiences (
  id              UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  type            experience_type  NOT NULL DEFAULT 'work',
  title           VARCHAR(200)     NOT NULL,   -- Job title or degree
  organization    VARCHAR(200)     NOT NULL,   -- Company or institution
  location        VARCHAR(100),
  description     TEXT,
  start_date      DATE             NOT NULL,
  end_date        DATE,                        -- NULL = current / present
  is_current      BOOLEAN          NOT NULL DEFAULT false,
  logo_url        VARCHAR(500),
  display_order   SMALLINT         NOT NULL DEFAULT 0,
  is_visible      BOOLEAN          NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ      NOT NULL DEFAULT now()
);


-- =============================================================
--  PROJECTS
-- =============================================================

CREATE TABLE IF NOT EXISTS projects (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(200)    NOT NULL,
  slug            VARCHAR(200)    NOT NULL UNIQUE,
  short_desc      VARCHAR(300)    NOT NULL,             -- card subtitle
  long_desc       TEXT,                                 -- markdown, shown in modal
  thumbnail_url   VARCHAR(500),
  github_url      VARCHAR(500),
  demo_url        VARCHAR(500),
  status          project_status  NOT NULL DEFAULT 'published',
  is_featured     BOOLEAN         NOT NULL DEFAULT false,
  display_order   SMALLINT        NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ                           -- soft delete
);

-- Project screenshots (carousel in modal)
CREATE TABLE IF NOT EXISTS project_screenshots (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url           VARCHAR(500) NOT NULL,
  alt_text      VARCHAR(200),
  display_order SMALLINT     NOT NULL DEFAULT 0
);

-- Project ↔ Tag (many-to-many)
CREATE TABLE IF NOT EXISTS project_tags (
  project_id  UUID  NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id      UUID  NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);


-- =============================================================
--  BLOG POSTS
-- =============================================================

CREATE TABLE IF NOT EXISTS blog_posts (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title               VARCHAR(300) NOT NULL,
  slug                VARCHAR(300) NOT NULL UNIQUE,
  excerpt             VARCHAR(500) NOT NULL,
  content             TEXT         NOT NULL DEFAULT '',  -- MDX / markdown
  cover_image_url     VARCHAR(500),
  reading_time_mins   SMALLINT     NOT NULL DEFAULT 1,
  status              post_status  NOT NULL DEFAULT 'draft',
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

-- Post ↔ Tag (many-to-many)
CREATE TABLE IF NOT EXISTS post_tags (
  post_id   UUID  NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id    UUID  NOT NULL REFERENCES tags(id)        ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);


-- =============================================================
--  CONTACT MESSAGES
-- =============================================================

CREATE TABLE IF NOT EXISTS contacts (
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100)    NOT NULL,
  email       VARCHAR(200)    NOT NULL,
  subject     VARCHAR(200)    NOT NULL,
  message     TEXT            NOT NULL,
  status      contact_status  NOT NULL DEFAULT 'unread',
  ip_address  INET,                                  -- rate-limit reference
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);


-- =============================================================
--  ANALYTICS EVENTS  (lightweight, append-only)
-- =============================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id          BIGSERIAL    PRIMARY KEY,
  event_type  VARCHAR(50)  NOT NULL,   -- 'page_view' | 'project_click' | 'resume_download' | 'contact_submit'
  path        VARCHAR(300),            -- e.g. '/blog/my-post'
  ref_id      UUID,                    -- project_id or post_id if applicable
  ip_address  INET,
  user_agent  VARCHAR(500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================
--  INDEXES
-- =============================================================

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_status       ON projects(status)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_featured     ON projects(is_featured)  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_order        ON projects(display_order);

-- Blog
CREATE INDEX IF NOT EXISTS idx_posts_status          ON blog_posts(status)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_published_at    ON blog_posts(published_at DESC) WHERE status = 'published';

-- Contacts
CREATE INDEX IF NOT EXISTS idx_contacts_status       ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created      ON contacts(created_at DESC);

-- Analytics (keep queries fast)
CREATE INDEX IF NOT EXISTS idx_analytics_type_date   ON analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_path        ON analytics_events(path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_ref         ON analytics_events(ref_id) WHERE ref_id IS NOT NULL;

-- Skills
CREATE INDEX IF NOT EXISTS idx_skills_category       ON skills(category_id);


-- =============================================================
--  AUTO-UPDATE updated_at  (trigger function)
-- =============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_admin_users_updated_at' AND tgrelid = 'admin_users'::regclass AND NOT tgisinternal) THEN
    CREATE TRIGGER trg_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_site_settings_updated_at' AND tgrelid = 'site_settings'::regclass AND NOT tgisinternal) THEN
    CREATE TRIGGER trg_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_skills_updated_at' AND tgrelid = 'skills'::regclass AND NOT tgisinternal) THEN
    CREATE TRIGGER trg_skills_updated_at BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_experiences_updated_at' AND tgrelid = 'experiences'::regclass AND NOT tgisinternal) THEN
    CREATE TRIGGER trg_experiences_updated_at BEFORE UPDATE ON experiences FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_projects_updated_at' AND tgrelid = 'projects'::regclass AND NOT tgisinternal) THEN
    CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_blog_posts_updated_at' AND tgrelid = 'blog_posts'::regclass AND NOT tgisinternal) THEN
    CREATE TRIGGER trg_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;


-- =============================================================
--  USEFUL VIEWS  (for admin dashboard queries)
-- =============================================================

-- Published projects with their tags
CREATE OR REPLACE VIEW v_projects_published AS
SELECT
  p.*,
  COALESCE(
    json_agg(
      json_build_object('id', t.id, 'name', t.name, 'label', t.label, 'color', t.color)
      ORDER BY t.name
    ) FILTER (WHERE t.id IS NOT NULL),
    '[]'
  ) AS tags
FROM projects p
LEFT JOIN project_tags pt ON pt.project_id = p.id
LEFT JOIN tags t           ON t.id = pt.tag_id
WHERE p.status = 'published' AND p.deleted_at IS NULL
GROUP BY p.id
ORDER BY p.is_featured DESC, p.display_order ASC, p.created_at DESC;

-- Published posts with their tags
CREATE OR REPLACE VIEW v_posts_published AS
SELECT
  bp.*,
  COALESCE(
    json_agg(
      json_build_object('id', t.id, 'name', t.name, 'label', t.label, 'color', t.color)
      ORDER BY t.name
    ) FILTER (WHERE t.id IS NOT NULL),
    '[]'
  ) AS tags
FROM blog_posts bp
LEFT JOIN post_tags pt ON pt.post_id = bp.id
LEFT JOIN tags t        ON t.id = pt.tag_id
WHERE bp.status = 'published' AND bp.deleted_at IS NULL
GROUP BY bp.id
ORDER BY bp.published_at DESC;

-- Admin: unread contact count
CREATE OR REPLACE VIEW v_contact_summary AS
SELECT
  COUNT(*)                              AS total,
  COUNT(*) FILTER (WHERE status = 'unread')  AS unread,
  COUNT(*) FILTER (WHERE status = 'read')    AS read_count,
  COUNT(*) FILTER (WHERE status = 'replied') AS replied
FROM contacts;

-- Admin: simple 30-day page view trend
CREATE OR REPLACE VIEW v_pageviews_30d AS
SELECT
  date_trunc('day', created_at)::date AS day,
  COUNT(*)                             AS views
FROM analytics_events
WHERE event_type = 'page_view'
  AND created_at >= now() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1;


-- =============================================================
--  SEED DATA  (minimal — just enough to see things working)
-- =============================================================

-- Skill categories
INSERT INTO skill_categories (name, display_order) VALUES
  ('Frontend',   1),
  ('Backend',    2),
  ('Database',   3),
  ('DevOps',     4),
  ('Languages',  5),
  ('Tools',      6)
ON CONFLICT (name) DO NOTHING;

-- Tags
INSERT INTO tags (name, label, color) VALUES
  ('react',      'React',       '#61DAFB'),
  ('nextjs',     'Next.js',     '#000000'),
  ('nodejs',     'Node.js',     '#339933'),
  ('typescript', 'TypeScript',  '#3178C6'),
  ('python',     'Python',      '#3776AB'),
  ('postgresql', 'PostgreSQL',  '#4169E1'),
  ('docker',     'Docker',      '#2496ED'),
  ('tailwind',   'Tailwind',    '#06B6D4'),
  ('fastapi',    'FastAPI',     '#009688'),
  ('redis',      'Redis',       '#DC382D')
ON CONFLICT (name) DO NOTHING;

-- =============================================================
--  END OF SCHEMA
-- =============================================================
