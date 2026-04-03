@echo off
set PROJECT=C:\Users\mike\Documents\Code Projects\garden-manager2
set ZIP=%PROJECT%\garden-manager.zip

echo === Building React frontend ===
cd /d "%PROJECT%"
call npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo === Packaging for deployment ===
del "%ZIP%" 2>nul
cd /d "%PROJECT%"
"C:\Program Files\7-Zip\7z.exe" a "%ZIP%" dist\ server\db.js server\index.js package.json package-lock.json

echo.
echo === Uploading to server ===
psftp -i "C:\Users\mike\Documents\SSH Keys\DigitalOcean-Dcc-Private.ppk" mike@rentontrack.org -b "%PROJECT%\sftp-garden.scr"

echo.
echo === Opening SSH session ===
echo Run this on the server:  ~/garden-manager/server-install.sh
putty.exe -load "Digital Ocean Renton Track"
