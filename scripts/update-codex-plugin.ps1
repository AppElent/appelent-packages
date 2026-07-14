$ErrorActionPreference = "Stop"

$pluginName = "appelent"
$repoUrl = "https://github.com/AppElent/appelent-packages.git"
$pluginPath = Join-Path (Join-Path $HOME "plugins") $pluginName

function Test-IsReparsePoint($Path) {
    if (-not (Test-Path -LiteralPath $Path)) {
        return $false
    }
    $item = Get-Item -LiteralPath $Path -Force
    return ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
}

if (-not (Test-Path -LiteralPath $pluginPath)) {
    throw "$pluginPath does not exist. Run scripts/setup-codex-plugin.ps1 first."
}

if (Test-IsReparsePoint $pluginPath) {
    Write-Host "dev junction: skipping git pull for $pluginPath"
} else {
    $gitDir = Join-Path $pluginPath ".git"
    if (-not (Test-Path -LiteralPath $gitDir)) {
        throw "$pluginPath is not a Git clone or a dev junction."
    }

    $origin = git -C $pluginPath remote get-url origin
    if ($origin -ne $repoUrl) {
        throw "$pluginPath origin is $origin, expected $repoUrl."
    }

    git -C $pluginPath pull --ff-only
}

codex plugin add "$pluginName@personal"
Write-Host "Start a new Codex task so the updated plugin skills are loaded."
