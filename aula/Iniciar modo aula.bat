@echo off
chcp 65001 >nul
title Mercado - Modo aula
cd /d "%~dp0"

rem Busca Python. En Windows puede llamarse python, python3 o py.
where python >nul 2>&1 && (python servidor.py & goto :fin)
where py >nul 2>&1 && (py servidor.py & goto :fin)
where python3 >nul 2>&1 && (python3 servidor.py & goto :fin)

echo.
echo   ==========================================================
echo    No encuentro Python en este computador.
echo.
echo    Se instala una sola vez, es gratis y toma dos minutos:
echo    abre la Microsoft Store, busca "Python" e instalalo.
echo.
echo    Despues vuelve a hacer doble clic en este archivo.
echo   ==========================================================
echo.
pause

:fin
