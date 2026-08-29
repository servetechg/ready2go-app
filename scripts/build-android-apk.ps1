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
    "/XD", "node_modules", ".git", "android", "ios",
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

# Releases file handles a previous run left on android/ and node_modules build output.
# Invoked by absolute path and never from inside the folder that is about to be deleted,
# and treated as best effort: a daemon that cannot be reached is not a build failure.
function Stop-GradleDaemon {
  param([string]$Root)

  $gradlew = Join-Path $Root "android\gradlew.bat"
  if (-not (Test-Path $gradlew)) {
    return
  }

  Write-Host "Stopping Gradle daemon..."
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    & $gradlew "--project-dir" (Join-Path $Root "android") "--stop" 2>&1 | Out-String | Write-Host
  } catch {
    Write-Host "Gradle daemon stop skipped: $($_.Exception.Message)"
  } finally {
    $ErrorActionPreference = $prevEap
  }
  Start-Sleep -Seconds 2
}

function Clean-AndroidBuildArtifacts {
  param([string]$Root)

  $androidDir = Join-Path $Root "android"
  if (-not (Test-Path $androidDir)) {
    return
  }

  Stop-GradleDaemon -Root $Root

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
  Stop-GradleDaemon -Root $Root

  if (Test-Path $androidDir) {
    Write-Host "Removing stale android folder..."
    Remove-Item $androidDir -Recurse -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
  }

  # CMake caches absolute paths from the previous run, so a stale .cxx makes ninja fail
  # with "Filename longer than 260 characters" or an undeletable libc++_shared.so.
  $nodeModules = Join-Path $Root "node_modules"
  if (Test-Path $nodeModules) {
    Write-Host "Removing stale native CMake output in node_modules..."
    Get-ChildItem $nodeModules -Recurse -Directory -Filter ".cxx" -ErrorAction SilentlyContinue |
      ForEach-Object { Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }
    Get-ChildItem $nodeModules -Recurse -Directory -Filter "cxx" -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -like "*\android\build\intermediates\cxx" } |
      ForEach-Object { Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }
  }

  Write-Host "Generating fresh android project (expo prebuild --clean)..."
  Push-Location $Root
  $prevCi = $env:CI
  $env:CI = "true"
  try {
    npx expo prebuild --platform android --no-install --clean
    $code = $LASTEXITCODE
  } finally {
    if ($null -eq $prevCi) {
      Remove-Item Env:CI -ErrorAction SilentlyContinue
    } else {
      $env:CI = $prevCi
    }
    Pop-Location
  }
  if ($code -ne 0) {
    throw "expo prebuild failed with exit code $code"
  }
}

$sourceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$buildRoot = $sourceRoot

# CMake/Ninja still hit the 260-char MAX_PATH limit even when Windows long paths are enabled.
$pathTooLong = $sourceRoot.Length -gt 45 -or $sourceRoot -match "OneDrive"

if ($pathTooLong) {
  $buildRoot = "C:\ready2go"
  Write-Host "Project path is long ($($sourceRoot.Length) chars)."
  Write-Host "Building from short path $buildRoot to avoid CMake/Ninja MAX_PATH failures."
  if ($sourceRoot -ne $buildRoot) {
    Sync-ProjectToShortPath -SourceRoot $sourceRoot -TargetRoot $buildRoot
    Set-Location $buildRoot
    if (-not (Test-Path (Join-Path $buildRoot "node_modules"))) {
      Write-Host "Installing dependencies in $buildRoot ..."
      npm install
      if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    # Always regenerate native project on short path so object paths stay short.
    Reset-AndroidNativeProject -Root $buildRoot
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

function Get-JavaMajorVersion {
  param([string]$JavaHome)
  $javaExe = Join-Path $JavaHome "bin\java.exe"
  if (-not (Test-Path $javaExe)) { return $null }
  # java -version writes to stderr; with ErrorActionPreference=Stop that throws.
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $out = & $javaExe -version 2>&1 | ForEach-Object { "$_" } | Out-String
    if ($out -match 'version "(\d+)') {
      return [int]$Matches[1]
    }
  } catch {
    return $null
  } finally {
    $ErrorActionPreference = $prevEap
  }
  return $null
}

function Find-CompatibleJavaHome {
  $candidates = @()
  # Prefer known Temurin/Adoptium installs over a stale JAVA_HOME (often Studio JBR 25).
  $candidates += @(
    "C:\Program Files\Eclipse Adoptium\jdk-17*",
    "C:\Program Files\Eclipse Adoptium\jdk-21*",
    "C:\Program Files\Microsoft\jdk-17*",
    "C:\Program Files\Microsoft\jdk-21*",
    "C:\Program Files\Java\jdk-17*",
    "C:\Program Files\Java\jdk-21*"
  )
  if ($env:JAVA_HOME) { $candidates += $env:JAVA_HOME }
  $candidates += "C:\Program Files\Android\Android Studio\jbr"

  $resolved = @()
  foreach ($pattern in $candidates) {
    $found = @(Get-Item $pattern -ErrorAction SilentlyContinue)
    foreach ($item in $found) {
      if (Test-Path (Join-Path $item.FullName "bin\java.exe")) {
        $resolved += $item.FullName
      }
    }
  }

  foreach ($jdkHome in ($resolved | Select-Object -Unique)) {
    $major = Get-JavaMajorVersion -JavaHome $jdkHome
    Write-Host "Checked JDK: $jdkHome (major=$major)"
    # React Native / AGP need JDK 17 or 21 — JDK 25 breaks plugin resolution.
    if ($major -eq 17 -or $major -eq 21) {
      return $jdkHome
    }
  }
  return $null
}

$compatibleJava = Find-CompatibleJavaHome
if (-not $compatibleJava) {
  Write-Error @"
No compatible JDK found (need 17 or 21).
Android Studio's bundled JBR is Java 25, which breaks this Gradle build.
Install Temurin/Adoptium JDK 17, then re-run:
  winget install EclipseAdoptium.Temurin.17.JDK
"@
}
if ($env:JAVA_HOME -and $env:JAVA_HOME -ne $compatibleJava) {
  Write-Host "Ignoring incompatible JAVA_HOME=$env:JAVA_HOME"
}
$env:JAVA_HOME = $compatibleJava

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

# Ensure native android/ exists (expo run:android requires a device/emulator;
# assembleRelease builds an APK without one).
$androidDir = Join-Path $buildRoot "android"
$gradlew = Join-Path $androidDir "gradlew.bat"
if (-not (Test-Path $gradlew)) {
  Reset-AndroidNativeProject -Root $buildRoot
} else {
  Clean-AndroidBuildArtifacts -Root $buildRoot
}

Write-Host "Assembling release APK via Gradle (no device required)..."
Push-Location $androidDir
& .\gradlew.bat assembleRelease
$gradleCode = $LASTEXITCODE
Pop-Location
if ($gradleCode -ne 0) {
  exit $gradleCode
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
