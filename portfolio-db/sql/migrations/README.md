# Migration policy

Migrations are ordered, immutable database changes. The runner records each
applied file and its SHA-256 checksum in `portfolio_db.schema_migrations`.

## Add a migration

1. Create the next unused numbered file, for example
   `002_add_project_subtitle.sql`.
2. Keep it focused and forward-only. Do not edit migrations that have been
   applied; add another numbered migration to correct or extend them.
3. Test against a development database first. Back up important data before
   applying production changes. Prefer additive, compatible changes that allow
   the current application version to keep running during deployment.
4. From the repository root, run:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\portfolio-db\scripts\migrate.ps1
   ```

   The script reads `portfolio-db/.env` if present, otherwise uses the
   `PGHOST`, `PGPORT`, `PGUSER`, and `PGPASSWORD` process environment variables.
5. Check the output and run the health check:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\portfolio-db\scripts\verify.ps1
   ```

The runner applies each migration and records its checksum in one transaction.
It skips migrations already recorded with the same checksum and stops if an
applied migration file has changed. Apply migrations in order to each
environment. The workflow uses PostgreSQL command-line tools from VS Code's
integrated terminal and does not require pgAdmin.

Avoid destructive statements and data rewrites in routine migrations. Any
intentional removal or irreversible data change needs a reviewed recovery plan
and a verified backup; it must never run automatically as part of initialization.
