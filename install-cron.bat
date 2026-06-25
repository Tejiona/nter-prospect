@echo off
echo Installation de la tache planifiee T-Prospect...
schtasks /Create /TN "T-Prospect-Cron" /TR "node \"C:\Users\FIDELIS SERVICES\nter-prospect\cron-local.mjs\"" /SC HOURLY /ST 00:00 /F
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Tache planifiee installee avec succes!
    echo    Nom: T-Prospect-Cron
    echo    Frequence: Toutes les heures
    echo    Prochaine execution: A la prochaine heure pleine
    echo.
    echo Pour verifier: schtasks /Query /TN "T-Prospect-Cron"
    echo Pour supprimer: schtasks /Delete /TN "T-Prospect-Cron" /F
) else (
    echo.
    echo ❌ Erreur: Executez ce script en tant qu'administrateur
    echo    Clic droit sur install-cron.bat ^> Executer en tant qu'administrateur
)
pause
