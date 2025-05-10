# Vérifie que tous les fichiers .md sont à jour (diff vs git index)
$changedMd = git diff --cached --name-only | Where-Object { $_ -like '*.md' }
if ($changedMd) {
    Write-Host "✅ Fichiers .md modifiés : $changedMd"
} else {
    Write-Host "[HOOK] Aucun fichier .md modifié."
}
exit 0
