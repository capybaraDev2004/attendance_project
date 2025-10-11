@echo off
echo Restarting Backend Server...
echo.

cd backend

echo Installing dependencies...
call npm install

echo.
echo Starting backend server...
echo Press Ctrl+C to stop the server
echo.

call npm start

pause
