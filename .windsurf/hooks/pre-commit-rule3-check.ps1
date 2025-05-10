# PowerShell pre-commit hook for RULE 3 structure validation
# To be copied as .git/hooks/pre-commit
Write-Host "🔍 Vérification de la structure RULE 3..."

# Run the Node.js script
node scripts/verify-rule3-structure.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ La structure RULE 3 n'est pas respectée. Le commit est annulé."
    Write-Host "Veuillez exécuter 'node scripts/verify-rule3-structure.js' pour corriger la structure."
    exit 1
}

Write-Host "✅ La structure RULE 3 est correcte."
exit 0
