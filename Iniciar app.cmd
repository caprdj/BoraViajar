@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Bora Viajar - aplicativo de viagens
python server.py --host 0.0.0.0 --open
pause
