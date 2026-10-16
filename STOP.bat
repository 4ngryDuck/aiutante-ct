@echo off
rem Aiutante CT - stops what START started (and frees the graphics card).
cd /d "%~dp0"
for /f "usebackq delims=" %%p in (`powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\windows\python.ps1"`) do set "PY=%%p"
"%PY%" scripts\launch.py stop
timeout /t 4
