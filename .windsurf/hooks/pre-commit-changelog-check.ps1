# Vérifie que CHANGELOG.md est modifié si d'autres fichiers sont modifiés (hors .md)
$changedFiles = git diff --cached --name-only | Where-Object { $_ -notlike '*.md' }
$changelogChanged = git diff --cached --name-only | Where-Object { $_ -eq 'CHANGELOG.md' }
if ($changedFiles -and -not $changelogChanged) {
    Write-Host "[HOOK] CHANGELOG.md doit être mis à jour si vous modifiez le code. Commit bloqué."
    exit 1
}
Write-Host "✅ CHANGELOG.md à jour."
exit 0
