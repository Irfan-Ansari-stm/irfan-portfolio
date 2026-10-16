param(
  [string]$Database,
  [string]$FileName
)

. (Join-Path $PSScriptRoot '_common.ps1')
Initialize-PortfolioDbTools
if (-not $Database) { $Database = if ($env:PORTFOLIO_DB_NAME) { $env:PORTFOLIO_DB_NAME } else { 'irfanportfolio' } }
Assert-PortfolioDatabaseName -Database $Database

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) { throw 'pg_dump was not found. Install PostgreSQL command-line tools and add them to PATH.' }
if (-not $FileName) { $FileName = "${Database}_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump" }
if ($FileName -notmatch '^[a-zA-Z0-9_.-]+\.dump$') { throw 'Choose a simple .dump filename; backups are stored inside portfolio-db/backups.' }

$backupDir = Join-Path $script:PortfolioDbRoot 'backups'
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Push-Location $backupDir
try {
  if (Test-Path -LiteralPath $FileName) { throw "Backup already exists: $FileName" }
  & $pgDump.Source -Fc --no-owner --no-acl -d $Database -f $FileName
  if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed; check the PostgreSQL connection and permissions.' }
} finally {
  Pop-Location
}
Write-Host "Backup created in portfolio-db/backups/$FileName"
