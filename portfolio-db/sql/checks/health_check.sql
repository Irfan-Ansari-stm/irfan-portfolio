\pset pager off
\echo 'Database and schema object counts'
SELECT current_database() AS database,
       current_user AS connected_as,
       (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS public_tables,
       (SELECT count(*) FROM information_schema.views WHERE table_schema = 'public') AS public_views,
       (SELECT count(*) FROM pg_type WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace) AS public_enums,
       (SELECT count(*) FROM portfolio_db.schema_migrations) AS applied_migrations;

\echo 'Required baseline objects'
SELECT object_name, object_exists
FROM (VALUES
  ('admin_users', to_regclass('public.admin_users') IS NOT NULL),
  ('site_settings', to_regclass('public.site_settings') IS NOT NULL),
  ('projects', to_regclass('public.projects') IS NOT NULL),
  ('blog_posts', to_regclass('public.blog_posts') IS NOT NULL),
  ('contacts', to_regclass('public.contacts') IS NOT NULL),
  ('cms_pages', to_regclass('public.cms_pages') IS NOT NULL),
  ('v_projects_published', to_regclass('public.v_projects_published') IS NOT NULL),
  ('v_posts_published', to_regclass('public.v_posts_published') IS NOT NULL)
) AS required(object_name, object_exists);

DO $$
BEGIN
  IF to_regclass('public.admin_users') IS NULL
     OR to_regclass('public.site_settings') IS NULL
     OR to_regclass('public.projects') IS NULL
     OR to_regclass('public.blog_posts') IS NULL
     OR to_regclass('public.contacts') IS NULL
     OR to_regclass('public.cms_pages') IS NULL
     OR to_regclass('public.v_projects_published') IS NULL
     OR to_regclass('public.v_posts_published') IS NULL THEN
    RAISE EXCEPTION 'One or more required portfolio schema objects are missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    RAISE EXCEPTION 'Required extension pgcrypto is missing';
  END IF;
END $$;
\echo 'Health check passed.'
