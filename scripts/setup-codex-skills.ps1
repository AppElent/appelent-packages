# Links every skill folder in this repo's skills/ (the feature folders plus
# the appelent-feature/appelent-project front doors and the review-app/
# review-session/upgrade-deps workflow skills) into ~/.codex/skills as a
# directory junction, so Codex discovers the same
# Agent Skills files Claude Code gets via the plugin. Re-run after adding a feature.
$ErrorActionPreference = "Stop"

$repoSkills = Join-Path $PSScriptRoot "..\skills" | Resolve-Path
$codexSkills = Join-Path $HOME ".codex\skills"
New-Item -ItemType Directory -Force -Path $codexSkills | Out-Null

Get-ChildItem -Path $repoSkills -Directory | ForEach-Object {
    $link = Join-Path $codexSkills $_.Name
    if (Test-Path $link) {
        Write-Host "exists: $($_.Name)"
    } else {
        New-Item -ItemType Junction -Path $link -Target $_.FullName | Out-Null
        Write-Host "linked: $($_.Name)"
    }
}
