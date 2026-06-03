@echo off
echo ============================================
echo  Upwork Bot HYC — Instalacion inicial
echo ============================================
echo.

REM Verificar Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python no esta instalado.
    echo Descargalo en https://www.python.org/downloads/
    echo Asegurate de marcar "Add Python to PATH" al instalar.
    pause
    exit /b 1
)

echo [1/4] Creando entorno virtual...
python -m venv venv
if %errorlevel% neq 0 (
    echo ERROR al crear venv. Verifica tu instalacion de Python.
    pause
    exit /b 1
)

echo [2/4] Instalando dependencias...
venv\Scripts\pip install -r requirements.txt -q
if %errorlevel% neq 0 (
    echo ERROR al instalar dependencias.
    pause
    exit /b 1
)

echo [3/4] Instalando Playwright (navegador Chromium)...
venv\Scripts\playwright install chromium
if %errorlevel% neq 0 (
    echo ERROR al instalar Playwright.
    pause
    exit /b 1
)

echo [4/4] Verificando archivo .env...
if not exist .env (
    echo.
    echo AVISO: No se encontro el archivo .env
    echo Copia .env.example a .env y completa los valores.
    echo.
    if exist .env.example (
        copy .env.example .env >nul
        echo Se creo .env desde .env.example — editalo con tus datos!
    )
) else (
    echo .env encontrado OK
)

echo.
echo ============================================
echo  Instalacion completada!
echo  Ahora edita el archivo .env con tus datos
echo  y luego ejecuta start.bat
echo ============================================
pause
