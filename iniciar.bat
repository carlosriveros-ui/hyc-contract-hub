@echo off
echo Iniciando servidores MantHYC - Marca Personal...
echo.

cd /d "%~dp0"

:: Cargar API key desde .env
for /f "tokens=2 delims==" %%a in ('findstr "ANTHROPIC_API_KEY" .env') do set ANTHROPIC_API_KEY=%%a

:: Iniciar servidor API en nueva ventana
start "API Server (puerto 3001)" cmd /k "cd /d "%~dp0" && set ANTHROPIC_API_KEY=%ANTHROPIC_API_KEY% && node dev-server.js"

:: Esperar 2 segundos para que el API server arranque primero
timeout /t 2 /nobreak >nul

:: Iniciar Vite en nueva ventana
start "Frontend Vite (puerto 8080)" cmd /k "cd /d "%~dp0" && npx vite --port 8080"

:: Esperar que Vite arranque y abrir el navegador
timeout /t 4 /nobreak >nul
start "" "http://localhost:8080/marca-personal"

echo.
echo Servidores iniciados:
echo   API:      http://localhost:3001
echo   Frontend: http://localhost:8080
echo.
echo Cierra las ventanas de los servidores para detenerlos.
