# PowerShell Script to Push CroweCode to GitHub
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Pushing CroweCode to GitHub" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".git")) {
    Write-Host "Error: Not in a Git repository!" -ForegroundColor Red
    exit 1
}

# Show current status
Write-Host "Checking repository status..." -ForegroundColor Yellow
git status --short

# Add all changes
Write-Host "`nStaging all changes..." -ForegroundColor Yellow
git add -A

# Show what will be committed
$changes = git status --porcelain
if ($changes) {
    Write-Host "`nFiles to commit:" -ForegroundColor Green
    git status --short

    # Commit changes
    Write-Host "`nCommitting changes..." -ForegroundColor Yellow
    git commit -m "Deploy-ready platform with enhanced features and Railway config"
}

# Push to GitHub
Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow
Write-Host "Target: origin/main" -ForegroundColor Cyan

# Try to push
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your code is now available at:" -ForegroundColor Cyan
    Write-Host "  https://github.com/MichaelCrowe11/CroweCode" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Go to Railway: https://railway.app/dashboard" -ForegroundColor White
    Write-Host "  2. Connect your GitHub repo" -ForegroundColor White
    Write-Host "  3. Railway will auto-deploy!" -ForegroundColor White
} else {
    Write-Host "`n❌ Push failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "If authentication failed, try:" -ForegroundColor Yellow
    Write-Host "  1. Open GitHub Desktop" -ForegroundColor White
    Write-Host "  2. Sign in to your account" -ForegroundColor White
    Write-Host "  3. Try pushing from there" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use Personal Access Token:" -ForegroundColor Yellow
    Write-Host "  1. Go to: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "  2. Generate new token (classic)" -ForegroundColor White
    Write-Host "  3. Select 'repo' scope" -ForegroundColor White
    Write-Host "  4. Use token as password when prompted" -ForegroundColor White
}