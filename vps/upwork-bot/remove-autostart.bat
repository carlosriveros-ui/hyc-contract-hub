@echo off
set "TASK_NAME=UpworkBotHYC"
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1
if %errorlevel% equ 0 (
    echo OK: Inicio automatico desactivado.
) else (
    echo La tarea no existia o ya fue eliminada.
)
pause
