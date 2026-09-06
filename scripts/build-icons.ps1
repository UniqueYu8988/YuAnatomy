param([string]$Source = (Join-Path $PSScriptRoot '../public/branding/source.png'))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$brandDir = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../public/branding'))
$original = [Drawing.Image]::FromFile([IO.Path]::GetFullPath($Source))
try {
  foreach ($size in @(256,512)) {
    $bitmap = New-Object Drawing.Bitmap($size,$size)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    $path = New-Object Drawing.Drawing2D.GraphicsPath
    try {
      $graphics.Clear([Drawing.Color]::Transparent)
      $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
      $diameter = [int]($size * 0.28)
      $path.AddArc(0,0,$diameter,$diameter,180,90)
      $path.AddArc(($size-$diameter),0,$diameter,$diameter,270,90)
      $path.AddArc(($size-$diameter),($size-$diameter),$diameter,$diameter,0,90)
      $path.AddArc(0,($size-$diameter),$diameter,$diameter,90,90)
      $path.CloseFigure()
      $graphics.SetClip($path)
      $graphics.DrawImage($original,0,0,$size,$size)
      $bitmap.Save((Join-Path $brandDir "icon-$size.png"),[Drawing.Imaging.ImageFormat]::Png)
    } finally { $path.Dispose(); $graphics.Dispose(); $bitmap.Dispose() }
  }
} finally { $original.Dispose() }
# Windows supports PNG payloads inside ICO; keep the original mark, with no redrawing.
$png = [IO.File]::ReadAllBytes((Join-Path $brandDir 'icon-256.png'))
$stream = [IO.File]::Create((Join-Path $brandDir 'YuAnatomy.ico'))
$writer = New-Object IO.BinaryWriter($stream)
try {
  $writer.Write([uint16]0); $writer.Write([uint16]1); $writer.Write([uint16]1)
  $writer.Write([byte]0); $writer.Write([byte]0); $writer.Write([byte]0); $writer.Write([byte]0)
  $writer.Write([uint16]1); $writer.Write([uint16]32)
  $writer.Write([uint32]$png.Length); $writer.Write([uint32]22); $writer.Write($png)
} finally { $writer.Dispose(); $stream.Dispose() }
Write-Output 'Created rounded PNG and Windows ICO assets from the supplied image.'
