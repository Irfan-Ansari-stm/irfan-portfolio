param([string]$Database)

. (Join-Path $PSScriptRoot '_common.ps1')
Initialize-PortfolioDbTools
if (-not $Database) { $Database = if ($env:PORTFOLIO_DB_NAME) { $env:PORTFOLIO_DB_NAME } else { 'irfanportfolio' } }
Assert-PortfolioDatabaseName -Database $Database

Push-Location $script:PortfolioDbRoot
try {
  Invoke-PortfolioPsql @('-X', '-v', 'ON_ERROR_STOP=1', '-d', $Database, '-f', 'sql/checks/health_check.sql')
} finally {
  Pop-Location
}
