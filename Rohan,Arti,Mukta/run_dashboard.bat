@echo off
title Urban Traffic Flow Optimization Web Dashboard
color 0B
echo ====================================================================
echo    TRAFFIC FLOW OPTIMIZATION & VOLUME PREDICTION SYSTEM
echo                 Mini Project 4 - Machine Learning
echo ====================================================================
echo.
echo [*] Launching Flask Web Application...
echo [*] Dashboard will be accessible at: http://127.0.0.1:5000
echo.
py -3.11 app.py
if errorlevel 1 (
    echo [!] Falling back to default python...
    python app.py
)
pause
