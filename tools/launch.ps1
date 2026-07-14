# SETFLOW launcher: analyzer (if installed) + server + client, then open the browser.
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host ""
Write-Host "  SETFLOW  -- AI DJ Set Architect" -ForegroundColor Yellow
Write-Host "  http://localhost:5173  (this window shows the logs; close it to stop)" -ForegroundColor DarkGray
Write-Host ""

# Local analyzer (optional ground truth). Skip silently if not installed or already running.
$analyzerPy = Join-Path $root 'analyzer\.venv\Scripts\python.exe'
if (Test-Path $analyzerPy) {
    $busy = $false
    try { (New-Object Net.Sockets.TcpClient('127.0.0.1', 8322)).Close(); $busy = $true } catch {}
    if (-not $busy) {
        Start-Process -FilePath $analyzerPy -ArgumentList 'analyzer\run.py' -WorkingDirectory $root -WindowStyle Minimized
        Write-Host "  analyzer: starting on :8322 (minimized window)" -ForegroundColor DarkGray
    } else {
        Write-Host "  analyzer: already running on :8322" -ForegroundColor DarkGray
    }
}

# Open the browser once the client answers (background job so logs start immediately).
Start-Job -ScriptBlock {
    for ($i = 0; $i -lt 90; $i++) {
        try {
            (New-Object Net.Sockets.TcpClient('localhost', 5173)).Close()
            Start-Process 'http://localhost:5173'
            break
        } catch { Start-Sleep -Seconds 1 }
    }
} | Out-Null

# `start` = server without watch mode + vite client. (tsx watch can wedge silently
# when spawned without a console; the launcher doesn't need hot reload anyway.)
npm run start
