# Run PowerShell as Administrator, then: .\scripts\enable-windows-long-paths.ps1
# Reboot may be required. Fixes "Filename longer than 260 characters" during Android native builds.

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Error "Run this script as Administrator (right-click PowerShell -> Run as administrator)."
}

New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force | Out-Null
Write-Host "LongPathsEnabled = 1"
Write-Host "Restart your PC, then run: npm run build:android:local"
