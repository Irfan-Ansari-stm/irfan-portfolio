param([string]$Database)

. (Join-Path $PSScriptRoot '_common.ps1')
Initialize-PortfolioDbTools
if (-not $Database) { $Database = if ($env:PORTFOLIO_DB_NAME) { $env:PORTFOLIO_DB_NAME } else { 'irfanportfolio' } }

Ensure-PortfolioDatabase -Database $Database
Invoke-PortfolioMigrations -Database $Database
Write-Host "Database $Database is ready."
