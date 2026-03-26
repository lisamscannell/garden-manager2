Write-Host "Stopping existing server processes..."
foreach ($port in @(3001, 5173, 5174, 5175)) {
    netstat -ano | Select-String ":$port\s" | ForEach-Object {
        $pid = ($_ -split '\s+')[-1]
        if ($pid -match '^\d+$') {
            taskkill /PID $pid /F 2>$null | Out-Null
        }
    }
}
Write-Host "Starting server..."
npm run dev
