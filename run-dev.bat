@echo off
setlocal

REM Athena dev quick start (Windows)
REM - Starts backend at http://127.0.0.1:3000
REM - Starts Vite frontend at http://127.0.0.1:5173

cd /d "%~dp0"
set "PROJECT_DIR=%~dp0"
set "BACKEND_URL=http://127.0.0.1:3000"
set "FRONTEND_URL=http://127.0.0.1:5173"

where node >nul 2>&1
if errorlevel 1 (
  echo [athena-dev] Node.js not found in PATH. Install Node.js and try again.
  goto fail
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [athena-dev] npm not found in PATH. Install Node.js with npm and try again.
  goto fail
)

if not exist node_modules (
  echo [athena-dev] Installing backend dependencies...
  call npm install
  if errorlevel 1 goto fail
) else (
  echo [athena-dev] Backend dependencies found.
)

if not exist client\node_modules (
  echo [athena-dev] Installing frontend dependencies...
  call npm --prefix client install
  if errorlevel 1 goto fail
) else (
  echo [athena-dev] Frontend dependencies found.
)

echo [athena-dev] Applying migrations...
call npm run migrate
if errorlevel 1 goto fail

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3000/config' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; exit 1"
if errorlevel 1 (
  echo [athena-dev] Starting backend at %BACKEND_URL%
  start "Athena Backend" cmd /k "cd /d ""%PROJECT_DIR%"" && npm run dev"
) else (
  echo [athena-dev] Backend already running at %BACKEND_URL%
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; exit 1"
if errorlevel 1 (
  echo [athena-dev] Starting frontend at %FRONTEND_URL%
  start "Athena Frontend" cmd /k "cd /d ""%PROJECT_DIR%client"" && npm run dev -- --host 127.0.0.1"
) else (
  echo [athena-dev] Frontend already running at %FRONTEND_URL%
)

echo [athena-dev] Opening %FRONTEND_URL%
start "" "%FRONTEND_URL%"
goto done

:fail
echo.
echo [athena-dev] Startup failed. Read the error above.
pause
exit /b 1

:done
echo.
echo [athena-dev] Done. Close the backend/frontend windows to stop dev servers.
