$ErrorActionPreference = "Stop"

function Find-Tesseract {
    if ($env:TESSERACT_CMD) {
        $configured = Get-Command $env:TESSERACT_CMD -ErrorAction SilentlyContinue
        if ($configured) { return $configured.Source }
        if (Test-Path -LiteralPath $env:TESSERACT_CMD -PathType Leaf) { return $env:TESSERACT_CMD }
    }
    $command = Get-Command tesseract -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }

    $roots = @($env:ProgramFiles, ${env:ProgramFiles(x86)}, (Join-Path $env:LOCALAPPDATA "Programs"))
    foreach ($root in $roots) {
        if (-not $root) { continue }
        $candidate = Join-Path $root "Tesseract-OCR\tesseract.exe"
        if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
    }
    return $null
}

function Test-Tesseract($Path) {
    Write-Host "Tesseract found at: $Path"
    $version = & $Path --version 2>&1
    $version | ForEach-Object { Write-Host $_ }
    if ($LASTEXITCODE -ne 0) { return $false }

    $languages = & $Path --list-langs 2>&1
    $languages | ForEach-Object { Write-Host $_ }
    if ($languages -match '(?m)^\s*eng\s*$') { return $true }

    Write-Host "English language data (eng.traineddata) is missing. Re-run the Tesseract installer and select English, or install eng.traineddata in Tesseract's tessdata directory."
    Write-Host "Verify again with: `"$Path`" --list-langs"
    return $false
}

$tesseract = Find-Tesseract
if ($tesseract) {
    if (Test-Tesseract $tesseract) { exit 0 } else { exit 1 }
}

Write-Host "Tesseract was not found. This script will not install anything without your confirmation."
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Host "Install winget, or use the Windows installer linked from: https://tesseract-ocr.github.io/tessdoc/Installation.html"
    Write-Host "The Tesseract documentation links to the UB Mannheim Windows builds. Include English language data and add the install folder to PATH."
    exit 1
}

$answer = Read-Host "Install UB Mannheim Tesseract using winget now? This may request administrator approval (y/N)"
if ($answer -notin @("y", "Y", "yes", "YES")) {
    Write-Host "No changes made. Install Tesseract manually, then run this script again."
    exit 0
}

winget install --id UB-Mannheim.TesseractOCR --exact --accept-source-agreements --accept-package-agreements
if ($LASTEXITCODE -ne 0) {
    Write-Error "winget installation failed. Use the installer fallback documented in README.md."
}

$tesseract = Find-Tesseract
if (-not $tesseract) {
    Write-Error "Installation completed or was requested, but Tesseract is not yet discoverable. Restart this terminal and run this script again."
}
if (-not (Test-Tesseract $tesseract)) { exit 1 }
Write-Host "Tesseract and English data are ready."
