@echo off
setlocal

REM Athena MVP quick start (Windows)
REM - Installs dependencies when missing
REM - Runs DB migrations
REM - Builds React frontend
REM - Starts the backend server at http://127.0.0.1:3000

cd /d "%~dp0"
set "ATHENA_URL=http://127.0.0.1:3000"

where node >nul 2>&1
if errorlevel 1 (
  echo [athena] Node.js not found in PATH. Install Node.js and try again.
  goto fail
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [athena] npm not found in PATH. Install Node.js with npm and try again.
  goto fail
)

if not exist node_modules (
  echo [athena] Installing backend dependencies...
  call npm install
  if errorlevel 1 goto fail
) else (
  echo [athena] Backend dependencies found.
)

if not exist client\node_modules (
  echo [athena] Installing frontend dependencies...
  call npm --prefix client install
  if errorlevel 1 goto fail
) else (
  echo [athena] Frontend dependencies found.
)

echo [athena] Applying migrations...
call npm run migrate
if errorlevel 1 goto fail

echo [athena] Building frontend...
call npm run client:build
if errorlevel 1 goto fail

powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if not errorlevel 1 (
  echo [athena] Server is already running at %ATHENA_URL%
  start "" "%ATHENA_URL%"
  goto done
)

echo [athena] Starting server at %ATHENA_URL%
start "" "%ATHENA_URL%"
node server\server.js
goto done

:fail
echo.
echo [athena] Startup failed. Read the error above.
pause
exit /b 1

:done
echo.
echo [athena] Done.
