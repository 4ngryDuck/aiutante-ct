@echo off
rem Aiutante CT - one-time setup: downloads the engine (llama.cpp) and a model, all checked with SHA-256.
cd /d "%~dp0"
for /f "usebackq delims=" %%p in (`powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\windows\python.ps1"`) do set "PY=%%p"
if not defined PY ( echo Python not available. & pause & exit /b 1 )
"%PY%" scripts\setup.py %*
pause
