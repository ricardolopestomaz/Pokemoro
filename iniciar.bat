@echo off
title Iniciar Pokemoro
echo ========================================
echo   Iniciando Pokemoro (Backend + Frontend)
echo ========================================
echo.

echo Iniciando Backend na porta 3001...
start "Pokemoro - Backend (Porta 3001)" cmd /k "cd /d %~dp0backend && npm run build && npm start"

timeout /t 2 /nobreak > nul

echo Iniciando Frontend na porta 5173...
start "Pokemoro - Frontend (Porta 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   Backend: http://localhost:3001
echo   Frontend (PC): http://localhost:5173
echo   Baixar APK no Celular: http://192.168.10.103:5173/pokemoro.apk
echo ========================================
echo.
echo Para instalar no seu celular Android:
echo 1. Conecte o celular na mesma rede Wi-Fi do computador
echo 2. Acesse http://192.168.10.103:5173/pokemoro.apk para baixar o instalador
echo 3. Abra o arquivo baixado e toque em Instalar!
echo.
