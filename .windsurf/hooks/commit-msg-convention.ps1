# Vérifie le format du message de commit
$commitMsgFile = $args[0]
$msg = Get-Content $commitMsgFile -Raw
if ($msg -notmatch '^(feat|fix|refactor|docs|test|chore|style): .{10,}') {
    Write-Host "[HOOK] Format du message de commit invalide. Utilisez : type: description (min 10 caractères)"
    exit 1
}
Write-Host "✅ Format du message de commit valide."
exit 0
