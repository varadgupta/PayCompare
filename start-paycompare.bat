@echo off
echo ========================================
echo PayCompare Smart Transaction Analysis
echo ========================================
echo.

echo Checking XAMPP installation...
if exist "C:\xampp" (
    echo [✓] XAMPP found at C:\xampp
) else if exist "D:\xampp" (
    echo [✓] XAMPP found at D:\xampp
) else (
    echo [✗] XAMPP not found in default locations
    echo Please install XAMPP first: https://www.apachefriends.org/
    pause
    exit /b 1
)

echo.
echo Starting XAMPP services...
cd /d C:\xampp

echo Starting MySQL...
xampp_mysql.exe start

echo Starting Apache...
xampp_apache.exe start

echo.
echo Waiting for services to start...
timeout /t 5 /nobreak >nul

echo.
echo Checking service status...
tasklist | findstr "httpd.exe" >nul
if %errorlevel% equ 0 (
    echo [✓] Apache is running
) else (
    echo [✗] Apache failed to start
    echo Checking for IIS conflict...
    sc query W3SVC | findstr "RUNNING" >nul
    if %errorlevel% equ 0 (
        echo [!] IIS is running on port 80 - stopping it...
        net stop W3SVC /y
        echo Starting Apache again...
        xampp_apache.exe start
        timeout /t 3 /nobreak >nul
    )
)

tasklist | findstr "mysqld.exe" >nul
if %errorlevel% equ 0 (
    echo [✓] MySQL is running
) else (
    echo [✗] MySQL failed to start
)

echo.
echo Copying PayCompare files to htdocs...
xcopy "d:\VARAD GUPTA\Projects\PayCompare - VS Code\PayCompare\*" "C:\xampp\htdocs\PayCompare\" /E /Y /I

echo.
echo ========================================
echo PayCompare is ready!
echo ========================================
echo.
echo Access your application at:
echo http://localhost/PayCompare/
echo.
echo Test features at:
echo http://localhost/PayCompare/test-features.html
echo.
echo Admin login:
echo Email: admin@paycompare.com
echo Password: admin123
echo.
echo Press any key to open PayCompare in your browser...
pause >nul

start http://localhost/PayCompare/

echo.
echo To stop XAMPP services, run: stop-paycompare.bat
pause
