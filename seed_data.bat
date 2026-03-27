@echo off
echo ===========================================
echo   Vendor Portal - Demo Data Seeder
echo ===========================================
echo.
echo Initializing database and running migrations...
.venv\Scripts\python.exe manage.py migrate

echo.
echo Seeding test users...
.venv\Scripts\python.exe create_test_users.py

echo.
echo ===========================================
echo               CREDENTIALS
echo ===========================================
echo Employee:    emp@hindujarenewables.com
echo Admin:       admin@hindujarenewables.com
echo SAP User:    sap@hindujarenewables.com
echo.
echo Password for all: password123
echo ===========================================
echo.
echo Done! You can now log into the portal.
pause
