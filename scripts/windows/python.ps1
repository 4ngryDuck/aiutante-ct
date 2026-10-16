# Finds a Python 3.9+ to run Aiutante CT; if there is none, downloads the official embeddable Python
# (python.org, ~11 MB) into .\python and checks its SHA-256 from scripts\downloads.json. Prints the path.
$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$local = Join-Path $root "python\python.exe"
if (Test-Path $local) { return $local }
foreach ($c in @("py", "python", "python3")) {
    $cmd = Get-Command $c -ErrorAction SilentlyContinue
    if (-not $cmd -or $cmd.Source -like "*WindowsApps*") { continue }   # skip the Microsoft Store stub
    $exe = & $cmd.Source $(if ($c -eq "py") { "-3" }) -c "import sys; print(sys.executable if sys.version_info >= (3, 9) else '')" 2>$null
    if ($exe) { return $exe.Trim() }
}
$m = Get-Content (Join-Path $root "scripts\downloads.json") -Raw | ConvertFrom-Json
$zip = Join-Path $env:TEMP "aiutante-ct-python.zip"
Write-Host "No Python found: downloading the official embeddable Python from python.org..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest $m.python_windows.url -OutFile $zip -UseBasicParsing
$hash = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
if ($hash -ne $m.python_windows.sha256) {
    Remove-Item $zip
    throw "Python download: HASH MISMATCH (expected $($m.python_windows.sha256), got $hash). Nothing installed."
}
Expand-Archive $zip (Join-Path $root "python") -Force
Remove-Item $zip
Write-Host "Python ready (hash OK)."
return $local
