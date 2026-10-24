$ErrorActionPreference = 'Stop'
$studioRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$studioUrl = 'http://127.0.0.1:3210'
$studioReady = $false
try {
  $studioReply = Invoke-RestMethod -Uri "$studioUrl/api/workspace" -TimeoutSec 2
  $studioReady = $studioReply.schemaVersion -eq 1
} catch {}
if (-not $studioReady) {
  $studioNode = Get-Command node -ErrorAction SilentlyContinue
  if (-not $studioNode) { throw 'Node.js 22 or newer is required. Install Node.js, then open this launcher again.' }
  $studioLog = Join-Path $studioRoot 'data'
  New-Item -ItemType Directory -Path $studioLog -Force | Out-Null
  $studioScript = '"' + (Join-Path $studioRoot 'server.cjs') + '"'
  $studioProcess = Start-Process -FilePath $studioNode.Source -ArgumentList $studioScript -WorkingDirectory $studioRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $studioLog 'server.log') -RedirectStandardError (Join-Path $studioLog 'server-error.log') -PassThru
  for ($studioAttempt = 0; $studioAttempt -lt 40; $studioAttempt++) {
    Start-Sleep -Milliseconds 250
    try {
      $studioReply = Invoke-RestMethod -Uri "$studioUrl/api/workspace" -TimeoutSec 2
      if ($studioReply.schemaVersion -eq 1) { $studioReady = $true; break }
    } catch {}
    if ($studioProcess.HasExited) { break }
  }
}
if (-not $studioReady) { throw 'Personal Studio could not start. Check data\server-error.log or run npm start from this folder for details.' }
Start-Process "$studioUrl"
Write-Output "Personal Studio is open at $studioUrl"

