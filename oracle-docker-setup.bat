@echo off
echo ========================================
echo Oracle Database 23ai Free Setup Script
echo ========================================
echo.

REM Set variables
set CONTAINER_NAME=oracle-free
set ORACLE_PWD=Welcome123
set ORACLE_PORT=1521
set ORACLE_DATA_DIR=C:\oracle-data

echo Step 1: Creating Oracle data directory...
if not exist "%ORACLE_DATA_DIR%" mkdir "%ORACLE_DATA_DIR%"
echo Data directory: %ORACLE_DATA_DIR%
echo.

echo Step 2: Checking if container already exists...
docker ps -a | findstr %CONTAINER_NAME% >nul
if %errorlevel%==0 (
    echo Container %CONTAINER_NAME% already exists. Removing...
    docker stop %CONTAINER_NAME% 2>nul
    docker rm %CONTAINER_NAME% 2>nul
)
echo.

echo Step 3: Starting Oracle Database 23ai Free container...
echo This may take a few minutes on first run...
echo.
docker run -d ^
  --name %CONTAINER_NAME% ^
  -p %ORACLE_PORT%:1521 ^
  -e ORACLE_PWD=%ORACLE_PWD% ^
  -e ORACLE_CHARACTERSET=AL32UTF8 ^
  -e ENABLE_ARCHIVELOG=false ^
  -e ENABLE_FORCE_LOGGING=false ^
  -v %ORACLE_DATA_DIR%:/opt/oracle/oradata ^
  container-registry.oracle.com/database/free:latest-lite

if %errorlevel%==0 (
    echo.
    echo Container started successfully!
    echo.
    echo Connection Details:
    echo -------------------
    echo Host: localhost
    echo Port: %ORACLE_PORT%
    echo Service: FREE or FREEPDB1
    echo Username: SYSTEM
    echo Password: %ORACLE_PWD%
    echo.
    echo Connection Strings:
    echo -------------------
    echo CDB: localhost:%ORACLE_PORT%/FREE
    echo PDB: localhost:%ORACLE_PORT%/FREEPDB1
    echo.
    echo Waiting for database to be ready...
    echo This may take 2-3 minutes...
    echo.
    
    :WAIT_LOOP
    timeout /t 10 >nul
    docker exec %CONTAINER_NAME% sqlplus -s system/%ORACLE_PWD%@FREE -c "SELECT 'Database is ready' FROM dual;" 2>nul | findstr "ready" >nul
    if %errorlevel%==0 (
        echo Database is ready!
        echo.
        echo You can now connect using:
        echo - SQL*Plus: sqlplus system/%ORACLE_PWD%@//localhost:%ORACLE_PORT%/FREE
        echo - Your IDE: Update .env.local with the connection details
        echo.
        docker ps | findstr %CONTAINER_NAME%
    ) else (
        echo Still waiting for database to be ready...
        goto WAIT_LOOP
    )
) else (
    echo Error starting container!
    echo Please check Docker is running and try again.
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
pause