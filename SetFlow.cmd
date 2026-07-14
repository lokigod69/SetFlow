@echo off
rem SETFLOW launcher — double-click to start everything and open the app.
title SETFLOW
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\launch.ps1"
