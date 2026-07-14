param(
    [ValidateSet("Dev", "Github")]
    [string] $Mode = "Github"
)

$ErrorActionPreference = "Stop"

$pluginName = "appelent"
$repoUrl = "https://github.com/AppElent/appelent-packages.git"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$pluginsRoot = Join-Path $HOME "plugins"
$pluginPath = Join-Path $pluginsRoot $pluginName
$marketplacePath = Join-Path $HOME ".agents\plugins\marketplace.json"

function Test-IsReparsePoint($Path) {
    if (-not (Test-Path -LiteralPath $Path)) {
        return $false
    }
    $item = Get-Item -LiteralPath $Path -Force
    return ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
}

function Get-NormalizedPath($Path) {
    return (Resolve-Path -LiteralPath $Path).Path.TrimEnd("\")
}

function Assert-DevJunctionTarget($Path, $Target) {
    $item = Get-Item -LiteralPath $Path -Force
    $targets = @($item.Target)
    if ($targets.Count -eq 0 -or [string]::IsNullOrWhiteSpace($targets[0])) {
        throw "$Path exists as a reparse point, but its target could not be read."
    }

    $actual = Get-NormalizedPath $targets[0]
    $expected = Get-NormalizedPath $Target
    if ($actual -ne $expected) {
        throw "$Path already points at $actual, expected $expected."
    }
}

function Ensure-DevPluginPath {
    New-Item -ItemType Directory -Force -Path $pluginsRoot | Out-Null

    if (Test-Path -LiteralPath $pluginPath) {
        if (-not (Test-IsReparsePoint $pluginPath)) {
            throw "$pluginPath already exists and is not a junction. Move it before using -Mode Dev."
        }
        Assert-DevJunctionTarget $pluginPath $repoRoot
        Write-Host "exists: $pluginPath -> $repoRoot"
        return
    }

    New-Item -ItemType Junction -Path $pluginPath -Target $repoRoot | Out-Null
    Write-Host "linked: $pluginPath -> $repoRoot"
}

function Ensure-GithubPluginPath {
    New-Item -ItemType Directory -Force -Path $pluginsRoot | Out-Null

    if (-not (Test-Path -LiteralPath $pluginPath)) {
        git clone $repoUrl $pluginPath
        return
    }

    if (Test-IsReparsePoint $pluginPath) {
        throw "$pluginPath is a junction. Use -Mode Dev for that path, or replace it before using -Mode Github."
    }

    $gitDir = Join-Path $pluginPath ".git"
    if (-not (Test-Path -LiteralPath $gitDir)) {
        throw "$pluginPath already exists and is not a Git clone. Move it before using -Mode Github."
    }

    $origin = git -C $pluginPath remote get-url origin
    if ($origin -ne $repoUrl) {
        throw "$pluginPath origin is $origin, expected $repoUrl."
    }

    git -C $pluginPath pull --ff-only
}

function Set-ObjectProperty($Object, $Name, $Value) {
    if ($Object.PSObject.Properties[$Name]) {
        $Object.$Name = $Value
    } else {
        $Object | Add-Member -NotePropertyName $Name -NotePropertyValue $Value
    }
}

function Ensure-MarketplaceEntry {
    $marketplaceDir = Split-Path -Parent $marketplacePath
    New-Item -ItemType Directory -Force -Path $marketplaceDir | Out-Null

    if (Test-Path -LiteralPath $marketplacePath) {
        $marketplace = Get-Content -LiteralPath $marketplacePath -Raw | ConvertFrom-Json
    } else {
        $marketplace = [pscustomobject]@{
            name = "personal"
            interface = [pscustomobject]@{
                displayName = "Personal"
            }
            plugins = @()
        }
    }

    if (-not $marketplace.PSObject.Properties["name"]) {
        Set-ObjectProperty $marketplace "name" "personal"
    }
    if (-not $marketplace.PSObject.Properties["interface"]) {
        Set-ObjectProperty $marketplace "interface" ([pscustomobject]@{ displayName = "Personal" })
    }
    if (-not $marketplace.PSObject.Properties["plugins"]) {
        Set-ObjectProperty $marketplace "plugins" @()
    }

    $entry = [pscustomobject]@{
        name = $pluginName
        source = [pscustomobject]@{
            source = "local"
            path = "./plugins/$pluginName"
        }
        policy = [pscustomobject]@{
            installation = "AVAILABLE"
            authentication = "ON_INSTALL"
        }
        category = "Productivity"
    }

    $plugins = @($marketplace.plugins | Where-Object { $_.name -ne $pluginName })
    $plugins += $entry
    Set-ObjectProperty $marketplace "plugins" $plugins

    $marketplace | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $marketplacePath -Encoding UTF8
    Write-Host "marketplace: $marketplacePath"
}

if ($Mode -eq "Dev") {
    Ensure-DevPluginPath
} else {
    Ensure-GithubPluginPath
}

Ensure-MarketplaceEntry
Write-Host "Install or refresh with: codex plugin add $pluginName@personal"
Write-Host "Start a new Codex task after installing so new plugin skills are loaded."
