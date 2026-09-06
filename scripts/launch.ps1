$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$address = 'http://127.0.0.1:3016/'
$mutex = New-Object Threading.Mutex($false, 'Local\YuAnatomyLauncher')
$locked = $false
function Get-AtlasStatus {
  try {
    $response = Invoke-WebRequest $address -UseBasicParsing -TimeoutSec 2
    if ($response.Content -match 'YuAnatomy') { return 'ready' }
    return 'occupied'
  } catch { return 'offline' }
}
try {
  $locked = $mutex.WaitOne(30000)
  if (-not $locked) { throw 'YuAnatomy is still starting. Please try again shortly.' }
  $status = Get-AtlasStatus
  if ($status -eq 'occupied') { throw 'Port 3016 is occupied by another application.' }
  if ($status -ne 'ready') {
    $node = (Get-Command node.exe -ErrorAction Stop).Source
    $vite = Join-Path $projectRoot 'node_modules/vite/bin/vite.js'
    if (-not (Test-Path -LiteralPath $vite)) { throw 'Please run Start-YuAnatomy.cmd once to install dependencies.' }
    $logDir = Join-Path $projectRoot 'work/logs'
    New-Item -ItemType Directory -Force $logDir | Out-Null
    $server = Start-Process -FilePath $node -ArgumentList @("`"$vite`"",'--host','127.0.0.1','--port','3016','--strictPort') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'server.log') -RedirectStandardError (Join-Path $logDir 'server-error.log')
    for ($i = 0; $i -lt 50; $i++) {
      if ((Get-AtlasStatus) -eq 'ready') { break }
      if ($server.HasExited) { throw 'The local server could not start. See work/logs/server-error.log.' }
      Start-Sleep -Milliseconds 200
    }
    if ((Get-AtlasStatus) -ne 'ready') { throw 'The local server did not become ready. Please try again.' }
  }
  Start-Process $address
} catch {
  Add-Type -AssemblyName System.Windows.Forms
  [Windows.Forms.MessageBox]::Show($_.Exception.Message, 'YuAnatomy') | Out-Null
  exit 1
} finally {
  if ($locked) { $mutex.ReleaseMutex() }
  $mutex.Dispose()
}
