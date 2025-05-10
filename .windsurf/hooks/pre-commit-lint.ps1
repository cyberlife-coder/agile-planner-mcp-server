# Vérifie le linting du code avant commit
Write-Host "🔎 Vérification du linting..."
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Linting échoué. Commit bloqué."
    exit 1
}
Write-Host "✅ Linting réussi."
exit 0
