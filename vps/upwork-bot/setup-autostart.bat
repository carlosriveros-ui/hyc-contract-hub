@echo off
title Configurar inicio automatico — Upwork Bot HYC

cd /d "%~dp0"

echo ============================================
echo  Configurar inicio automatico con Windows
echo ============================================
echo.
echo Esto creara una tarea en el Programador de Tareas
echo que abre el bot cuando inicias sesion en Windows.
echo.
set "BOT_DIR=%~dp0"
set "BOT_DIR=%BOT_DIR:~0,-1%"
set "TASK_NAME=UpworkBotHYC"

REM Eliminar tarea anterior si existe
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

REM Crear nueva tarea: ejecutar start.bat al iniciar sesion
schtasks /create ^
  /tn "%TASK_NAME%" ^
  /tr "cmd /c \"cd /d \"%BOT_DIR%\" && start.bat\"" ^
  /sc ONLOGON ^
  /rl HIGHEST ^
  /f >nul 2>&1

if %errorlevel% equ 0 (
    echo OK: Tarea creada exitosamente!
    echo.
    echo El bot arrancara automaticamente la proxima vez
    echo que inicies sesion en Windows.
    echo.
    echo Para desactivarlo: ejecuta remove-autostart.bat
) else (
    echo AVISO: No se pudo crear la tarea automaticamente.
    echo.
    echo Hazlo manualmente:
    echo  1. Presiona Win+R, escribe: shell:startup
    echo  2. Crea un acceso directo a start.bat en esa carpeta
)

echo.
pause
