@echo off
echo Stopping backend...
taskkill /F /IM node.exe 2>nul

echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo Starting backend...
cd backend
npm start
