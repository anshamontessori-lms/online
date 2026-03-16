@echo off
echo Starting Ansha Montessori LMS...
echo.
start "" "http://localhost:8080"
"C:\Program Files\Git\usr\bin\perl.exe" "%~dp0server.pl"
pause
