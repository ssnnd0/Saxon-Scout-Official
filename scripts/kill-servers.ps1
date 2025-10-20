# Kill all Node.js processes (use with caution)
Write-Host "Finding all Node.js processes..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Cyan
    $nodeProcesses | ForEach-Object {
        Write-Host "  Killing process $($_.Id) - $($_.ProcessName)" -ForegroundColor Red
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "All Node.js processes stopped!" -ForegroundColor Green
} else {
    Write-Host "No Node.js processes found" -ForegroundColor Green
}

# Wait a moment for ports to be released
Start-Sleep -Seconds 2

# Check if port 8787 is free
$port8787 = Get-NetTCPConnection -LocalPort 8787 -ErrorAction SilentlyContinue
if ($port8787) {
    Write-Host "Port 8787 status:" -ForegroundColor Yellow
    $port8787 | Select-Object State,OwningProcess,LocalPort | Format-Table -AutoSize
} else {
    Write-Host "Port 8787 is now free!" -ForegroundColor Green
}
