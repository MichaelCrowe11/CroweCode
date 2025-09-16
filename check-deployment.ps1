# Railway Deployment Status Check Script

Write-Host "Checking Railway Deployment Status..." -ForegroundColor Cyan
Write-Host ""

# Check status
Write-Host "Project Status:" -ForegroundColor Yellow
C:\Users\micha\AppData\Roaming\npm\railway.cmd status

Write-Host ""
Write-Host "Live URL:" -ForegroundColor Yellow
Write-Host "https://crowe-logic-production.up.railway.app" -ForegroundColor Green

Write-Host ""
Write-Host "Dashboard:" -ForegroundColor Yellow
Write-Host "https://railway.app/project/92965d56-d5e6-4b0b-9ea2-d405701625ad" -ForegroundColor Green

Write-Host ""
Write-Host "Build Logs:" -ForegroundColor Yellow
Write-Host "https://railway.com/project/92965d56-d5e6-4b0b-9ea2-d405701625ad/service/9f17dcab-3614-4bcc-9a8a-405b5b46e328" -ForegroundColor Green

Write-Host ""
Write-Host "To check logs, run:" -ForegroundColor Yellow
Write-Host "C:\Users\micha\AppData\Roaming\npm\railway.cmd logs" -ForegroundColor White

Write-Host ""
Write-Host "Press any key to open the dashboard in your browser..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Start-Process "https://railway.app/project/92965d56-d5e6-4b0b-9ea2-d405701625ad"