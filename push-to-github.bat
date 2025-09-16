@echo off
echo Pushing CroweCode to GitHub...
echo ==============================
echo.

REM Add all changes
git add -A

REM Commit (skip if nothing to commit)
git commit -m "Deploy-ready: Enhanced platform with Monaco editor, plugins, collaboration, and Railway config" 2>nul

REM Push to both remotes
echo Pushing to origin (CroweCode)...
git push origin main

echo.
echo Pushing to crowecode remote...
git push crowecode main

echo.
echo ==============================
echo Push complete!
echo.
echo Your repositories:
echo - https://github.com/MichaelCrowe11/CroweCode
echo - https://github.com/MichaelCrowe11/crowecode
echo.
echo Now go to Railway and:
echo 1. Connect your GitHub repo
echo 2. Railway will auto-deploy
echo.
pause