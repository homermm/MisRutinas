@echo off
title Cerrando servidores
echo.
echo  ========================================
echo   Cerrando procesos en puerto 5173...
echo  ========================================
echo.

:: Buscar y matar procesos en el puerto 5173
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    echo Terminando proceso PID: %%a
    taskkill /F /PID %%a 2>nul
)

:: También matar cualquier proceso node huérfano
taskkill /F /IM node.exe 2>nul

echo.
echo Listo.
timeout /t 2 >nul
