# Used by the tray icon menu: same as STOP.bat, without a window.
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$py = & (Join-Path $PSScriptRoot "python.ps1") | Select-Object -Last 1
& $py (Join-Path $root "scripts\launch.py") stop | Out-Null
