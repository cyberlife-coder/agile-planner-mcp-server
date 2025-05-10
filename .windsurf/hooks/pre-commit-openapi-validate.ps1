# PowerShell pre-commit hook for OpenAPI validation
# To be copied as .git/hooks/pre-commit
$openapiFile = "openapi/openapi.yaml"

if (-not (Get-Command swagger-cli -ErrorAction SilentlyContinue)) {
    Write-Host "[HOOK] swagger-cli non trouvé. Installer avec : npm install -g swagger-cli"
    exit 1
}

if (-not (Test-Path $openapiFile)) {
    Write-Host "[HOOK] Fichier $openapiFile introuvable. Commit bloqué."
    exit 1
}

swagger-cli validate $openapiFile
if ($LASTEXITCODE -ne 0) {
    Write-Host "[HOOK] Schéma OpenAPI invalide. Commit bloqué."
    exit 1
}

Write-Host "[HOOK] Schéma OpenAPI valide. Commit autorisé."
exit 0
