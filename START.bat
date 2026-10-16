@echo off
rem Aiutante CT - starts the local model and the helper server. Close this window when it says ON.
cd /d "%~dp0"
for /f "usebackq delims=" %%p in (`powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\windows\python.ps1"`) do set "PY=%%p"
if not defined PY ( echo Python not available: run SETUP.bat first. & pause & exit /b 1 )
"%PY%" scripts\launch.py start
if errorlevel 1 ( pause ) else ( timeout /t 8 )
