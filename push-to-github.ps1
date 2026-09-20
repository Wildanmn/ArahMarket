# =============================================
# ArahMarket v2.0 — Push to GitHub Script
# =============================================
# Jalankan script ini di PowerShell:
#   powershell -ExecutionPolicy Bypass -File "C:\Users\user\.gemini\antigravity\scratch\ArahMarket\push-to-github.ps1"
# =============================================

$ErrorActionPreference = "Stop"
$gitExe = "C:\Users\user\.gemini\antigravity\tools\git\cmd\git.exe"
$repoDir = "C:\Users\user\.gemini\antigravity\scratch\ArahMarket"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ArahMarket v2.0 — Push to GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Untuk push, Anda butuh GitHub Personal Access Token." -ForegroundColor Yellow
Write-Host ""
Write-Host "Cara mendapatkan token:" -ForegroundColor White
Write-Host "  1. Buka: https://github.com/settings/tokens" -ForegroundColor Gray
Write-Host "  2. Klik 'Generate new token (classic)'" -ForegroundColor Gray
Write-Host "  3. Centang scope: repo (full control)" -ForegroundColor Gray
Write-Host "  4. Klik Generate token, lalu copy" -ForegroundColor Gray
Write-Host ""

$token = Read-Host "Paste GitHub token Anda disini"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "Token kosong. Dibatalkan." -ForegroundColor Red
    exit 1
}

$remoteUrl = "https://${token}@github.com/Wildanmn/ArahMarket.git"

Set-Location $repoDir

Write-Host ""
Write-Host "[1/3] Mengkonfigurasi remote..." -ForegroundColor Cyan
& $gitExe remote set-url origin $remoteUrl 2>$null
if ($LASTEXITCODE -ne 0) {
    & $gitExe remote add origin $remoteUrl 2>$null
}

Write-Host "[2/3] Pushing ke GitHub (force)..." -ForegroundColor Cyan
& $gitExe push -u origin master:main --force 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  BERHASIL! Repository sudah di-update" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Cek di: https://github.com/Wildanmn/ArahMarket" -ForegroundColor White
    Write-Host ""
    
    # Cleanup token from remote URL for security
    & $gitExe remote set-url origin "https://github.com/Wildanmn/ArahMarket.git" 2>$null
    Write-Host "[3/3] Token dibersihkan dari config." -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "GAGAL push. Cek apakah token sudah benar." -ForegroundColor Red
    Write-Host "Pastikan token punya scope 'repo'." -ForegroundColor Yellow
    
    # Cleanup token
    & $gitExe remote set-url origin "https://github.com/Wildanmn/ArahMarket.git" 2>$null
}

Write-Host ""
Write-Host "Tekan Enter untuk menutup..." -ForegroundColor Gray
Read-Host
