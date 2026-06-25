-- ============================================================
-- Portfolio — Seed Data (Development / Demo)
-- ============================================================

-- Site Settings
UPDATE site_settings SET
  owner_name          = 'Irfan Ansari',
  owner_title         = 'Full Stack Developer',
  owner_email         = 'irfan@example.com',
  owner_location      = 'Bihar, India',
  hero_taglines       = ARRAY['Full Stack Developer', 'React Specialist', 'Node.js Expert', 'Problem Solver'],
  hero_bio_short      = 'I build fast, scalable, and beautiful web applications.',
  about_bio           = 'Passionate full-stack developer with expertise in React, Node.js, and PostgreSQL. I love turning ideas into polished products.',
  about_years_exp     = 3,
  about_projects_count = 20,
  meta_title          = 'Irfan Ansari — Full Stack Developer',
  meta_description    = 'Portfolio of Irfan Ansari, a Full Stack Developer specializing in React and Node.js.',
  notify_email        = 'irfan@example.com',
  updated_at          = now()
WHERE true;

-- Social Links
INSERT INTO social_links (platform, url, label, display_order) VALUES
  ('github',   'https://github.com/irfanansari',   'GitHub',   0),
  ('linkedin',  'https://linkedin.com/in/irfanansari', 'LinkedIn', 1),
  ('twitter',   'https://twitter.com/irfanansari',  'Twitter',  2),
  ('website',   'https://irfanansari.dev',           'Portfolio',3)
ON CONFLICT DO NOTHING;

-- Tags
INSERT INTO tags (name, label, color) VALUES
  ('react',      'React.js',      '#61DAFB'),
  ('nodejs',     'Node.js',       '#68A063'),
  ('typescript', 'TypeScript',    '#3178C6'),
  ('postgresql', 'PostgreSQL',    '#336791'),
  ('express',    'Express.js',    '#000000'),
  ('nextjs',     'Next.js',       '#000000'),
  ('tailwind',   'Tailwind CSS',  '#06B6D4'),
  ('mongodb',    'MongoDB',       '#47A248'),
  ('docker',     'Docker',        '#2496ED'),
  ('graphql',    'GraphQL',       '#E10098'),
  ('redux',      'Redux',         '#764ABC'),
  ('prisma',     'Prisma ORM',    '#2D3748')
ON CONFLICT (name) DO NOTHING;

-- Skill Categories
WITH cats AS (
  INSERT INTO skill_categories (name, display_order) VALUES
    ('Frontend',       0),
    ('Backend',        1),
    ('Database',       2),
    ('DevOps & Tools', 3)
  ON CONFLICT DO NOTHING
  RETURNING id, name
)
-- Skills
INSERT INTO skills (category_id, name, level, display_order)
SELECT c.id, s.name, s.level::skill_level, s.ord FROM (
  VALUES
    ('Frontend',       'React.js',     'expert',       0),
    ('Frontend',       'TypeScript',   'advanced',     1),
    ('Frontend',       'Next.js',      'advanced',     2),
    ('Frontend',       'Tailwind CSS', 'advanced',     3),
    ('Frontend',       'Redux',        'intermediate', 4),
    ('Backend',        'Node.js',      'expert',       0),
    ('Backend',        'Express.js',   'expert',       1),
    ('Backend',        'REST APIs',    'expert',       2),
    ('Backend',        'GraphQL',      'intermediate', 3),
    ('Database',       'PostgreSQL',   'advanced',     0),
    ('Database',       'MongoDB',      'intermediate', 1),
    ('Database',       'Prisma ORM',   'advanced',     2),
    ('DevOps & Tools', 'Docker',       'intermediate', 0),
    ('DevOps & Tools', 'Git & GitHub', 'advanced',     1),
    ('DevOps & Tools', 'Linux',        'intermediate', 2)
) AS s(cat_name, name, level, ord)
JOIN cats c ON c.name = s.cat_name
ON CONFLICT DO NOTHING;

-- Experiences
INSERT INTO experiences (type, title, organization, location, start_date, is_current, description, display_order) VALUES
  ('work', 'Full Stack Developer', 'Freelance', 'Remote', '2022-01-01', true,
   'Building full-stack web applications for clients worldwide using React, Node.js, and PostgreSQL.', 0),
  ('education', 'Bachelor of Technology (CS)', 'LNMU Darbhanga', 'Bihar, India', '2019-08-01', false,
   'Computer Science and Engineering.', 1),
  ('certification', 'Meta Front-End Developer', 'Coursera / Meta', 'Online', '2023-06-01', false,
   'Professional certificate covering React, responsive design, and UX fundamentals.', 2)
ON CONFLICT DO NOTHING;

-- Sample Projects (with slugs)
WITH proj AS (
  INSERT INTO projects (title, slug, short_desc, status, is_featured, display_order) VALUES
    ('Portfolio Website',
     'portfolio-website',
     'Personal portfolio built with React, Node.js and PostgreSQL featuring a full CMS.',
     'published', true, 0),
    ('E-Commerce Platform',
     'e-commerce-platform',
     'Full-featured e-commerce app with cart, payment gateway, and admin dashboard.',
     'published', true, 1),
    ('Blog CMS',
     'blog-cms',
     'Headless CMS for managing blog posts with a rich-text editor and SEO tools.',
     'published', false, 2)
  RETURNING id, slug
)
INSERT INTO project_tags (project_id, tag_id)
SELECT p.id, t.id
FROM proj p
CROSS JOIN tags t
WHERE
  (p.slug = 'portfolio-website' AND t.name IN ('react','nodejs','postgresql','typescript','tailwind'))
  OR (p.slug = 'e-commerce-platform' AND t.name IN ('react','nodejs','postgresql','express','redux'))
  OR (p.slug = 'blog-cms' AND t.name IN ('nextjs','typescript','postgresql','tailwind','prisma'))
ON CONFLICT DO NOTHING;

-- Sample Blog Posts
INSERT INTO blog_posts (title, slug, excerpt, content, reading_time_mins, status, published_at) VALUES
  (
    'Building a Scalable REST API with Node.js and PostgreSQL',
    'building-scalable-rest-api-nodejs-postgresql',
    'A deep dive into designing production-ready REST APIs using Express, TypeScript, and PostgreSQL with best practices.',
    '# Building a Scalable REST API

In this post, we will walk through designing a production-ready REST API...

## Setup

Start with a clean TypeScript project and install dependencies...

## Database Design

Schema design is the foundation of any scalable API...',
    5,
    'published',
    now() - interval '10 days'
  ),
  (
    'Why I Switched from MongoDB to PostgreSQL',
    'switched-mongodb-postgresql',
    'After years of using MongoDB, I made the switch to PostgreSQL and here is what I learned along the way.',
    '# Why I Switched from MongoDB to PostgreSQL

The decision was not easy, but after facing scaling issues...',
    4,
    'published',
    now() - interval '5 days'
  ),
  (
    'React Performance Optimization Tips',
    'react-performance-optimization',
    'Practical tips for making your React applications faster: memo, useMemo, lazy loading, and more.',
    '# React Performance Optimization

Performance is crucial for user experience...',
    6,
    'draft',
    null
  )
ON CONFLICT (slug) DO NOTHING;
