@echo off
echo Stopping any existing backend processes...
taskkill /F /IM node.exe 2>nul

echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo Starting backend...
cd backend
start "Backend Server" cmd /k "npm start"

echo Waiting 5 seconds for server to start...
timeout /t 5 /nobreak >nul

echo Testing API...
curl -s http://localhost:3001/api/users/debug

echo.
echo Backend should be running now. Check the new terminal window.
pause
