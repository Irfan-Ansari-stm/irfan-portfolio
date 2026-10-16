# Portfolio PostgreSQL database

This directory contains the database baseline and its operational workflow.
The default database is `irfanportfolio`. Scripts use PostgreSQL command-line
tools and can be run from the VS Code integrated terminal; pgAdmin is not
required.

## Layout

```text
portfolio-db/
├── .env.example                 # Local connection settings template
├── .gitignore                   # Excludes credentials, backups, and temp files
├── README.md                    # Setup and operations guide
├── portfolio.sql                # Readable initial schema baseline
├── backups/                     # Local-only pg_dump output (gitignored)
├── scripts/
│   ├── _common.ps1              # Shared connection and migration functions
│   ├── initialize-database.ps1  # Create database if absent, then migrate
│   ├── migrate.ps1              # Apply pending numbered migrations
│   ├── backup.ps1               # Create a custom-format PostgreSQL backup
│   └── verify.ps1               # Run database health checks
└── sql/
    ├── checks/health_check.sql  # Catalog/object verification query
    └── migrations/
        ├── 001_initial_schema.sql
        ├── 002_cms_pages.sql
        └── README.md
```

`portfolio.sql` and `sql/migrations/001_initial_schema.sql` are the initial
schema. Treat the numbered migration as immutable once recorded in the
migration ledger. Future changes belong in new numbered files under
`sql/migrations`.

Migration `002_cms_pages.sql` adds the CMS page table. It stores each page's
flexible content in JSONB, with a unique URL slug, draft/published status, SEO
fields, timestamps, and a soft-delete timestamp.

## First setup

1. Install PostgreSQL command-line tools and ensure `psql` and `pg_dump` are on
   `PATH`.
2. Copy `.env.example` to `.env` inside this directory and set the local
   PostgreSQL user and password. `.env` is ignored by Git. Alternatively set
   the standard `PGHOST`, `PGPORT`, `PGUSER`, and `PGPASSWORD` variables in
   your terminal.
3. From the repository root in VS Code's PowerShell terminal, run:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\portfolio-db\scripts\initialize-database.ps1
   ```

The initializer checks PostgreSQL's catalog and runs `CREATE DATABASE` only
when `irfanportfolio` is absent. It then applies pending migrations. The
baseline schema and migration ledger update are each transactional. Re-running
the initializer skips migrations already applied with matching checksums.

Use `-Database another_name` to target a different database. Database names
are validated before they are used in SQL. Credentials are never printed by
the scripts. The database role needs permission to create databases for first
setup; after the database exists, migration and runtime roles can be more
restricted.

## Routine commands

Run these from the repository root:

```powershell
# Apply pending migrations
powershell -NoProfile -ExecutionPolicy Bypass -File .\portfolio-db\scripts\migrate.ps1

# Verify tables, views, enums, and migration history
powershell -NoProfile -ExecutionPolicy Bypass -File .\portfolio-db\scripts\verify.ps1

# Create a timestamped custom-format backup under portfolio-db/backups
powershell -NoProfile -ExecutionPolicy Bypass -File .\portfolio-db\scripts\backup.ps1
```

The PowerShell execution-policy option applies only to that process. It does
not change the machine's policy. On macOS or Linux, the same SQL can be run
with `psql -X -v ON_ERROR_STOP=1 -d irfanportfolio -f` and the migration path.

## Safety and operations

- Initialization never replaces an existing database. It does not run
  destructive SQL such as database/table drops, truncation, or deletes.
- Migrations run in filename order, one transaction at a time, with a SHA-256
  checksum recorded in `portfolio_db.schema_migrations`.
- Never edit a migration after it has been applied. A changed checksum stops
  deployment so migration history cannot silently drift.
- Back up before production changes and store a separate copy outside this
  workstation. Files under `backups/` are ignored by Git and are not a backup
  strategy by themselves.
- Test migrations against a development database first. Prefer additive
  changes compatible with the running application during deployment.
- Database restore is intentionally a manual, reviewed recovery operation;
  this workflow does not automatically overwrite a database from a dump.

See [`sql/migrations/README.md`](sql/migrations/README.md) for the migration
authoring policy.
