@echo off
title Upwork Bot HYC — Carlos Riveros

REM Ir a la carpeta del script (funciona desde cualquier ubicacion)
cd /d "%~dp0"

REM Verificar que existe el entorno virtual
if not exist venv\Scripts\python.exe (
    echo ERROR: Entorno virtual no encontrado.
    echo Ejecuta install.bat primero.
    pause
    exit /b 1
)

REM Verificar que existe .env
if not exist .env (
    echo ERROR: Archivo .env no encontrado.
    echo Crea el archivo .env con tus credenciales.
    pause
    exit /b 1
)

echo ============================================
echo  Upwork Bot HYC iniciando...
echo  El navegador se abrira automaticamente.
echo  Si la sesion expiro, inicia sesion en Upwork.
echo  NO CIERRES ESTA VENTANA mientras uses el bot.
echo ============================================
echo.

venv\Scripts\python local_main.py

echo.
echo Bot detenido.
pause
