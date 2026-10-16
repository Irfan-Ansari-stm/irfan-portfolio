$ErrorActionPreference = 'Stop'

$script:PortfolioDbRoot = Split-Path -Parent $PSScriptRoot
$script:PortfolioDbMigrations = Join-Path $script:PortfolioDbRoot 'sql\migrations'

function Initialize-PortfolioDbTools {
  $psql = Get-Command psql -ErrorAction SilentlyContinue
  if (-not $psql) { throw 'psql was not found. Install PostgreSQL command-line tools and add them to PATH.' }
  $script:PortfolioPsql = $psql.Source

  $envFile = Join-Path $script:PortfolioDbRoot '.env'
  if (Test-Path $envFile) {
    foreach ($line in Get-Content $envFile) {
      if ($line -match '^\s*(PGHOST|PGPORT|PGUSER|PGPASSWORD|PORTFOLIO_DB_NAME)\s*=\s*(.*?)\s*$') {
        $key = $matches[1]
        $value = $matches[2].Trim('"').Trim("'")
        if (-not [Environment]::GetEnvironmentVariable($key, 'Process')) {
          [Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
      }
    }
  }
}

function Assert-PortfolioDatabaseName {
  param([Parameter(Mandatory)][string]$Database)
  if ($Database -notmatch '^[a-z_][a-z0-9_]{0,62}$') {
    throw 'Database names must use lowercase letters, digits, and underscores, and start with a letter or underscore.'
  }
}

function Invoke-PortfolioPsql {
  param([Parameter(Mandatory)][string[]]$Arguments)
  & $script:PortfolioPsql @Arguments
  if ($LASTEXITCODE -ne 0) { throw "psql failed (exit code $LASTEXITCODE). Check the message above." }
}

function Ensure-PortfolioDatabase {
  param([Parameter(Mandatory)][string]$Database)
  Assert-PortfolioDatabaseName -Database $Database

  $exists = & $script:PortfolioPsql -X -v ON_ERROR_STOP=1 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$Database'"
  if ($LASTEXITCODE -ne 0) { throw 'Could not connect to the PostgreSQL maintenance database "postgres".' }
  if ([string]$exists -ne '1') {
    Invoke-PortfolioPsql @('-X', '-v', 'ON_ERROR_STOP=1', '-d', 'postgres', '-c', "CREATE DATABASE `"$Database`"")
    Write-Host "Created database $Database."
  } else {
    Write-Host "Database $Database already exists; leaving it in place."
  }
}

function Invoke-PortfolioMigrations {
  param([Parameter(Mandatory)][string]$Database)
  Assert-PortfolioDatabaseName -Database $Database

  Invoke-PortfolioPsql @(
    '-X', '-v', 'ON_ERROR_STOP=1', '-d', $Database,
    '-c', 'CREATE SCHEMA IF NOT EXISTS portfolio_db; CREATE TABLE IF NOT EXISTS portfolio_db.schema_migrations (version text PRIMARY KEY, name text NOT NULL, checksum char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now());'
  )

  $files = @(Get-ChildItem -LiteralPath $script:PortfolioDbMigrations -Filter '*.sql' -File | Sort-Object Name)
  if ($files.Count -eq 0) { Write-Host 'No pending migration files found.'; return }

  foreach ($file in $files) {
    if ($file.Name -notmatch '^(\d{3,})_([a-z0-9_]+)\.sql$') {
      throw "Invalid migration filename '$($file.Name)'. Use NNN_description.sql with lowercase letters, digits, and underscores."
    }
    $version = $matches[1]
    $name = $matches[2]
    $checksum = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    $applied = & $script:PortfolioPsql -X -v ON_ERROR_STOP=1 -d $Database -tAc "SELECT checksum FROM portfolio_db.schema_migrations WHERE version = '$version'"
    if ($LASTEXITCODE -ne 0) { throw "Could not read migration history for $Database." }

    if ($null -ne $applied -and [string]$applied -ne '') {
      if ([string]$applied -ne $checksum) { throw "Migration $($file.Name) changed after application. Restore the original file and add a new migration." }
      Write-Host "Already applied: $($file.Name)"
      continue
    }

    $driver = Join-Path $PSScriptRoot '.apply-migration.sql'
    $includePath = "../sql/migrations/$($file.Name)"
    $driverSql = @"
\ir '$includePath'
INSERT INTO portfolio_db.schema_migrations (version, name, checksum)
VALUES (:'migration_version', :'migration_name', :'migration_checksum');
"@
    try {
      Set-Content -LiteralPath $driver -Value $driverSql -Encoding utf8
      Push-Location $PSScriptRoot
      try {
        Invoke-PortfolioPsql @(
          '-X', '-1', '-v', 'ON_ERROR_STOP=1', '-d', $Database,
          '-v', "migration_version=$version", '-v', "migration_name=$name", '-v', "migration_checksum=$checksum",
          '-f', '.apply-migration.sql'
        )
      } finally {
        Pop-Location
      }
      Write-Host "Applied: $($file.Name)"
    } finally {
      if (Test-Path $driver) { Remove-Item -LiteralPath $driver -Force }
    }
  }
}
