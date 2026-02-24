@echo off
echo ============================================
echo   AI Student Advisory System - Backend
echo ============================================
cd /d "%~dp0backend"
echo Starting FastAPI server on http://localhost:8000
echo Press Ctrl+C to stop
python main.py
pause
