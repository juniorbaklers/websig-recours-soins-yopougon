@echo off
title WebSIG - Recours aux soins Yopougon
echo Demarrage du serveur local du WebSIG...
echo Laissez cette fenetre ouverte pendant l'utilisation.
start "" http://localhost:8971
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
