# OPTIONAL, only for the phone: opens the helper port to your LOCAL network and to Tailscale (100.64.0.0/10),
# never to the internet. Needs admin rights once (Windows asks "Do you want to allow...?").
# Undo: Windows Defender Firewall -> Inbound rules -> delete "Aiutante CT".
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$port = 8433
try { $c = Get-Content (Join-Path $root "server\config.json") -Raw | ConvertFrom-Json; if ($c.port) { $port = $c.port } } catch {}
$name = "Aiutante CT ($port, local network and Tailscale)"
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) {
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "`"$PSCommandPath`""
    exit
}
Add-Type -AssemblyName System.Windows.Forms
try {
    Get-NetFirewallRule -DisplayName "Aiutante CT*" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
    New-NetFirewallRule -DisplayName $name -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow -Profile Private `
        -RemoteAddress LocalSubnet, 100.64.0.0/10 -ErrorAction Stop | Out-Null
    [System.Windows.Forms.MessageBox]::Show("Done: port $port is open only to your local network (Private profile) and Tailscale.", "Aiutante CT", "OK", "Information") | Out-Null
} catch {
    [System.Windows.Forms.MessageBox]::Show("It did not work:`n$($_.Exception.Message)", "Aiutante CT", "OK", "Error") | Out-Null
}
