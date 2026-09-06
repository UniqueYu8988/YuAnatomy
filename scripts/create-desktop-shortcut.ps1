$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'YuAnatomy.lnk'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/powershell.exe'
$launcher = Join-Path $PSScriptRoot 'launch.ps1'
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcher`""
$shortcut.WorkingDirectory = $projectRoot
$shortcut.IconLocation = (Join-Path $projectRoot 'public/branding/YuAnatomy.ico') + ',0'
$shortcut.Description = 'YuAnatomy'
$shortcut.WindowStyle = 7
$shortcut.Save()
Write-Output $shortcutPath
