@echo off
echo Opening .env.local file for API key configuration...
notepad.exe "%~dp0.env.local"
echo.
echo ==========================================
echo INSTRUCTIONS:
echo ==========================================
echo 1. Look for line 18 in the file
echo 2. It shows: ANTHROPIC_API_KEY=your_claude_api_key_here
echo 3. Replace "your_claude_api_key_here" with your actual API key
echo 4. Save the file (Ctrl+S) and close Notepad
echo ==========================================
pause