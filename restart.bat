@echo off
echo Stopping existing server processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5175') do taskkill /PID %%a /F 2>nul
echo Starting server...
npm run dev
