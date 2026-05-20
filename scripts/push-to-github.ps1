# Jamit — push to GitHub (run in PowerShell from repo root)
# Usage: .\scripts\push-to-github.ps1 -RepoName "jamit" -Public

param(
    [string]$RepoName = "jamit",
    [switch]$Public
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "=== Jamit GitHub setup ===" -ForegroundColor Cyan

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed. Install from https://git-scm.com"
}

if (-not (Test-Path .git)) {
    git init
    Write-Host "Initialized git repository." -ForegroundColor Green
}

git add -A
$status = git status --short
if (-not $status) {
    Write-Host "Nothing to commit (already clean?)." -ForegroundColor Yellow
} else {
    git commit -m @"
Initial commit: Jamit full-stack music remix platform

React + NestJS + MongoDB + FastAPI AI service.
Features: auth, upload, stem separation, remix studio, mood recommendations, community feed.
"@
    Write-Host "Committed changes." -ForegroundColor Green
}

if (Get-Command gh -ErrorAction SilentlyContinue) {
    $visibility = if ($Public) { "--public" } else { "--private" }
    $remote = git remote get-url origin 2>$null
    if (-not $remote) {
        Write-Host "Creating GitHub repo '$RepoName'..." -ForegroundColor Cyan
        gh repo create $RepoName $visibility --source=. --remote=origin --push
    } else {
        Write-Host "Remote exists: $remote" -ForegroundColor Cyan
        git push -u origin HEAD
    }
    Write-Host "Done! Open: https://github.com/$(gh api user -q .login)/$RepoName" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "GitHub CLI (gh) not found. Do this manually:" -ForegroundColor Yellow
    Write-Host "1. Create a new repo at https://github.com/new (name: $RepoName)"
    Write-Host "2. Do NOT add README/license if this folder already has code"
    Write-Host "3. Run:"
    Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/$RepoName.git"
    Write-Host "   git branch -M main"
    Write-Host "   git push -u origin main"
}
