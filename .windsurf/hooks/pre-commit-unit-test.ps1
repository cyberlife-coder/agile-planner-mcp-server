# Exécute les tests unitaires avant commit
Write-Host "🧪 Exécution des tests unitaires..."
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests unitaires échoués. Commit bloqué."
    exit 1
}
Write-Host "✅ Tests unitaires réussis."
exit 0
