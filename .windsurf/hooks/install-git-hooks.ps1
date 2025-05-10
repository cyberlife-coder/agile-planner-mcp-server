# PowerShell script to copy all pre-commit hooks from .windsurf/hooks/ to .git/hooks/
# Usage: powershell -ExecutionPolicy Bypass -File .windsurf/hooks/install-git-hooks.ps1

$hooks = @(
    'pre-commit-md-check.ps1',
    'pre-commit-changelog-check.ps1',
    'pre-commit-unit-test.ps1',
    'pre-commit-lint.ps1',
    'pre-commit-file-size.ps1',
    'pre-commit-rule3-check.ps1',
    'pre-commit-openapi-validate.ps1'
)
$commitMsgHook = 'commit-msg-convention.ps1'

# Calculer le chemin absolu du dossier projet (racine du repo)
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
$targetDir = Join-Path $projectRoot ".git/hooks"

foreach ($hook in $hooks) {
    $source = Join-Path $PSScriptRoot $hook
    $dest = Join-Path $targetDir ($hook.Replace('.ps1',''))
    try {
        Copy-Item $source $dest -Force
        Write-Host "✅ Copié : $hook → $dest"
    } catch {
        Write-Host "❌ Erreur de copie pour $hook : $_"
    }
}
# Commit-msg
$commitMsgSource = Join-Path $PSScriptRoot $commitMsgHook
$commitMsgDest = Join-Path $targetDir 'commit-msg'
try {
    Copy-Item $commitMsgSource $commitMsgDest -Force
    Write-Host "✅ Copié : $commitMsgHook → $commitMsgDest"
} catch {
    Write-Host "❌ Erreur de copie pour $commitMsgHook : $_"
}

Write-Host "🎉 Hooks PowerShell installés dans .git/hooks/ (utilisables sous Windows)"