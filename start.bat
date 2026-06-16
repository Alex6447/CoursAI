@echo off
rem ============================================================
rem  CoursAI launcher.
rem  Double-click opens the app WITHOUT keeping a console window:
rem  the script relaunches itself hidden and logs everything to
rem  start.log next to this file. If the app does not appear,
rem  open start.log to see what went wrong.
rem ============================================================

if /i "%~1"=="__hidden" goto :main

rem --- first pass (visible): relaunch ourselves hidden, then close ---
set "SELF=%~f0"
powershell -NoProfile -Command "Start-Process -WindowStyle Hidden -FilePath $env:SELF -ArgumentList '__hidden'"
exit /b

:main
setlocal
cd /d "%~dp0"
set "LOG=%~dp0start.log"

echo ============================================ > "%LOG%"
echo   CoursAI - starting %date% %time%>> "%LOG%"
echo ============================================>> "%LOG%"

if not exist "backend\.venv\Scripts\python.exe" (
  echo [backend] venv not found. Creating and installing deps...>> "%LOG%"
  where uv >nul 2>nul
  if errorlevel 1 (
    python -m venv backend\.venv >> "%LOG%" 2>&1
    backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt >> "%LOG%" 2>&1
  ) else (
    pushd backend
    uv venv >> "%LOG%" 2>&1
    uv pip install -r requirements.txt >> "%LOG%" 2>&1
    popd
  )
)

if not exist "node_modules\electron-vite" (
  echo [frontend] node_modules missing. Running npm install...>> "%LOG%"
  call npm install >> "%LOG%" 2>&1
  if errorlevel 1 (
    echo [ERROR] npm install failed. Check network access.>> "%LOG%"
    endlocal
    exit /b 1
  )
)

echo [start] Launching app ^(Electron will start the Python backend^)...>> "%LOG%"
call npm run dev >> "%LOG%" 2>&1

if errorlevel 1 echo [ERROR] Launch failed. See messages above.>> "%LOG%"
endlocal
