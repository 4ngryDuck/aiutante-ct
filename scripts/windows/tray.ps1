# Aiutante CT tray icon (next to the clock). Started by launch.py, gone after STOP.
# Blue orb = on and ready, red orb = something is wrong. Right click: status, open folder, stop.
$casa = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$porta = 8433
try { $c = Get-Content (Join-Path $casa "server\config.json") -Raw | ConvertFrom-Json; if ($c.port) { $porta = $c.port } } catch {}
$solo = New-Object System.Threading.Mutex($false, "Local\AiutanteCT-Barra")
if (-not $solo.WaitOne(0)) { exit 0 }   # there is already an icon

Add-Type -AssemblyName System.Windows.Forms, System.Drawing

function Sfera([System.Drawing.Color]$centro, [System.Drawing.Color]$bordo) {
    $bmp = New-Object System.Drawing.Bitmap 32, 32
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $percorso = New-Object System.Drawing.Drawing2D.GraphicsPath
    $percorso.AddEllipse(2, 2, 28, 28)
    $pennello = New-Object System.Drawing.Drawing2D.PathGradientBrush $percorso
    $pennello.CenterColor = $centro
    $pennello.SurroundColors = @($bordo)
    $pennello.CenterPoint = New-Object System.Drawing.PointF 16, 22
    $g.FillPath($pennello, $percorso)
    $riflesso = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(150, 255, 255, 255))
    $g.FillEllipse($riflesso, 8, 4, 16, 10)
    $g.DrawEllipse((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 10, 26, 51)), 1.5), 2, 2, 28, 28)
    $g.Dispose()
    return [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
}
$blu = Sfera ([System.Drawing.Color]::FromArgb(255, 127, 212, 255)) ([System.Drawing.Color]::FromArgb(255, 6, 35, 77))
$rossa = Sfera ([System.Drawing.Color]::FromArgb(255, 255, 160, 140)) ([System.Drawing.Color]::FromArgb(255, 120, 10, 0))

$icona = New-Object System.Windows.Forms.NotifyIcon
$icona.Icon = $blu
$icona.Text = "Aiutante CT: starting..."
$icona.Visible = $true

$menu = New-Object System.Windows.Forms.ContextMenuStrip
$voceStato = $menu.Items.Add("Checking...")
$voceStato.Enabled = $false
[void]$menu.Items.Add("-")
$menu.Items.Add("Open the Aiutante CT folder").add_Click({ Start-Process explorer.exe $casa })
$menu.Items.Add("Open the guide (README)").add_Click({ Start-Process (Join-Path $casa "README.md") })
[void]$menu.Items.Add("-")
$menu.Items.Add("Stop Aiutante CT").add_Click({
    Start-Process powershell -WindowStyle Hidden -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "`"$PSScriptRoot\stop.ps1`""
})
$icona.ContextMenuStrip = $menu
$icona.add_MouseClick({ if ($_.Button -eq 'Left') { $icona.ShowBalloonTip(3000, "Aiutante CT", $voceStato.Text, "Info") } })

function Controlla {
    $pid_server = Join-Path $casa "data\run\server.pid"
    if (-not (Test-Path $pid_server)) { return $null }   # stopped: the icon goes away
    try {
        $s = Invoke-RestMethod "http://127.0.0.1:$porta/salute" -TimeoutSec 3
        $modello = ($s.motori.PSObject.Properties | Where-Object { $_.Value } | Select-Object -First 1).Value
        if ($modello) {
            $ultimo = if ($s.ultimo.lavoro) { " | last: $($s.ultimo.lavoro) $($s.ultimo.secondi)s" } else { "" }
            return @{ ok = $true; testo = "ON: $modello$ultimo" }
        }
        return @{ ok = $false; testo = "Server on, but no model answers" }
    } catch {
        return @{ ok = $false; testo = "The helper server does not answer" }
    }
}

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 10000
$timer.add_Tick({
    $c = Controlla
    if ($null -eq $c) { $timer.Stop(); $icona.Visible = $false; [System.Windows.Forms.Application]::Exit(); return }
    $voceStato.Text = $c.testo
    $icona.Text = ("Aiutante CT - " + $c.testo).Substring(0, [Math]::Min(63, ("Aiutante CT - " + $c.testo).Length))
    $icona.Icon = if ($c.ok) { $blu } else { $rossa }
})
$timer.Start()
$timer.GetType().GetMethod("OnTick", [System.Reflection.BindingFlags]"NonPublic,Instance").Invoke($timer, @([EventArgs]::Empty))

[System.Windows.Forms.Application]::Run()
$icona.Visible = $false
$icona.Dispose()
