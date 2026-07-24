# Windows local release APK build - uses project .env (loaded automatically by Expo CLI).
# If the project path is too long, builds from C:\ready2go automatically.

$ErrorActionPreference = "Stop"

function Test-WindowsLongPathsEnabled {
  try {
    $val = Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -ErrorAction SilentlyContinue
    return $val.LongPathsEnabled -eq 1
  } catch {
    return $false
  }
}

function Sync-ProjectToShortPath {
  param(
    [string]$SourceRoot,
    [string]$TargetRoot
  )

  Write-Host "Syncing project to short path: $TargetRoot"
  New-Item -ItemType Directory -Force -Path $TargetRoot | Out-Null

  $robocopyArgs = @(
    $SourceRoot,
    $TargetRoot,
    "/MIR",
    "/XD", "node_modules", "android", ".git",
    "/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np"
  )
  $null = & robocopy @robocopyArgs
  # Robocopy exit codes 0-7 mean success (with or without copied files).
  if ($LASTEXITCODE -gt 7) {
    throw "robocopy failed with exit code $LASTEXITCODE"
  }

  $envFile = Join-Path $SourceRoot ".env"
  if (Test-Path $envFile) {
    Copy-Item $envFile (Join-Path $TargetRoot ".env") -Force
  }
}

function Clean-AndroidBuildArtifacts {
  param([string]$Root)

  $androidDir = Join-Path $Root "android"
  if (-not (Test-Path $androidDir)) {
    return
  }

  $gradlew = Join-Path $androidDir "gradlew.bat"
  if (Test-Path $gradlew) {
    Write-Host "Stopping Gradle daemon..."
    Push-Location $androidDir
    & .\gradlew.bat --stop 2>$null
    Pop-Location
  }

  $dirsToRemove = @(
    (Join-Path $androidDir "app\build"),
    (Join-Path $androidDir "app\.cxx"),
    (Join-Path $androidDir "build"),
    (Join-Path $androidDir ".gradle")
  )
  foreach ($dir in $dirsToRemove) {
    if (Test-Path $dir) {
      Write-Host "Removing $dir"
      Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
}

function Reset-AndroidNativeProject {
  param([string]$Root)

  $androidDir = Join-Path $Root "android"
  $gradlew = Join-Path $androidDir "gradlew.bat"
  if (Test-Path $gradlew) {
    Write-Host "Stopping Gradle daemon..."
    Push-Location $androidDir
    & .\gradlew.bat --stop 2>$null
    Pop-Location
  }

  if (Test-Path $androidDir) {
    Write-Host "Removing stale android folder..."
    Remove-Item $androidDir -Recurse -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
  }

  Write-Host "Generating fresh android project (expo prebuild)..."
  Push-Location $Root
  npx expo prebuild --platform android --no-install
  $code = $LASTEXITCODE
  Pop-Location
  if ($code -ne 0) {
    throw "expo prebuild failed with exit code $code"
  }
}

$sourceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$buildRoot = $sourceRoot
$pathTooLong = $sourceRoot.Length -gt 45 -or $sourceRoot -match "OneDrive"

if ($pathTooLong -and -not (Test-WindowsLongPathsEnabled)) {
  $buildRoot = "C:\ready2go"
  if ($sourceRoot -ne $buildRoot) {
    Sync-ProjectToShortPath -SourceRoot $sourceRoot -TargetRoot $buildRoot
    Set-Location $buildRoot
    if (-not (Test-Path (Join-Path $buildRoot "node_modules"))) {
      Write-Host "Installing dependencies in $buildRoot ..."
      npm install
      if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    if (-not (Test-Path (Join-Path $buildRoot "android"))) {
      Reset-AndroidNativeProject -Root $buildRoot
    } else {
      Clean-AndroidBuildArtifacts -Root $buildRoot
    }
  }
}

if (-not $env:ANDROID_HOME) {
  $defaultSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
  if (Test-Path $defaultSdk) {
    $env:ANDROID_HOME = $defaultSdk
  } else {
    Write-Error "ANDROID_HOME is not set. Install Android Studio or set ANDROID_HOME to your Android SDK path."
  }
}

if (-not $env:JAVA_HOME) {
  $javaCandidates = @(
    "C:\Program Files\Android\Android Studio\jbr",
    "C:\Program Files\Eclipse Adoptium\jdk-21*",
    "C:\Program Files\Eclipse Adoptium\jdk-17*",
    "C:\Program Files\Java\jdk-21*",
    "C:\Program Files\Java\jdk-17*"
  )
  foreach ($pattern in $javaCandidates) {
    $match = Get-Item $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($match -and (Test-Path (Join-Path $match.FullName "bin\java.exe"))) {
      $env:JAVA_HOME = $match.FullName
      break
    }
  }
}

if (-not $env:JAVA_HOME) {
  Write-Error "JAVA_HOME is not set. Install JDK 17 or 21 (Android Studio includes one), or set JAVA_HOME manually."
}

if (-not $env:GRADLE_USER_HOME) {
  $env:GRADLE_USER_HOME = "C:\gradle"
}
New-Item -ItemType Directory -Force -Path $env:GRADLE_USER_HOME | Out-Null

$platformTools = Join-Path $env:ANDROID_HOME "platform-tools"
$emulator = Join-Path $env:ANDROID_HOME "emulator"
$javaBin = Join-Path $env:JAVA_HOME "bin"
$env:Path = "$javaBin;$platformTools;$emulator;$env:Path"
Set-Location $buildRoot

Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "ANDROID_HOME=$env:ANDROID_HOME"
Write-Host "GRADLE_USER_HOME=$env:GRADLE_USER_HOME"
Write-Host "Building from=$buildRoot"
if (Test-WindowsLongPathsEnabled) {
  Write-Host "Windows long paths: enabled"
}
$javaExe = Join-Path $env:JAVA_HOME "bin\java.exe"
& $javaExe -version
Write-Host ""
Write-Host "Building release APK (Expo loads .env automatically)..."
Write-Host ""

Clean-AndroidBuildArtifacts -Root $buildRoot

npx expo run:android --variant release --no-install --no-bundler
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

$apk = Join-Path $buildRoot "android\app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $apk)) {
  Write-Error "Build finished but APK not found at android/app/build/outputs/apk/release/app-release.apk"
}

if ($buildRoot -ne $sourceRoot) {
  $destDir = Join-Path $sourceRoot "android\app\build\outputs\apk\release"
  New-Item -ItemType Directory -Force -Path $destDir | Out-Null
  $destApk = Join-Path $destDir "app-release.apk"
  Copy-Item $apk $destApk -Force
  Write-Host ""
  Write-Host "APK ready (build copy):"
  Write-Host (Resolve-Path $apk)
  Write-Host "APK copied to original project:"
  Write-Host (Resolve-Path $destApk)
} else {
  Write-Host ""
  Write-Host "APK ready:"
  Write-Host (Resolve-Path $apk)
}
