# Contrôle la taille des fichiers (max 500 lignes)
$tooLong = Get-ChildItem -Recurse -Include *.js,*.ts,*.jsx,*.tsx | Where-Object { (Get-Content $_.FullName).Count -gt 500 }
if ($tooLong) {
    Write-Host "[HOOK] Certains fichiers dépassent 500 lignes :"
    $tooLong | ForEach-Object { Write-Host $_.FullName }
    exit 1
}
Write-Host "✅ Tous les fichiers sont inférieurs à 500 lignes."
exit 0
