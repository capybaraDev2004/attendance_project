@echo off
echo Restarting backend server...
cd /d "C:\ĐỒ_ÁN_TN\attendance_project\backend"

echo Stopping any existing Node processes...
taskkill /f /im node.exe 2>nul

echo Starting backend server...
node server.js

pause