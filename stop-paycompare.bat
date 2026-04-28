@echo off
echo ========================================
echo Stopping PayCompare Services
echo ========================================
echo.

cd /d C:\xampp

echo Stopping Apache...
xampp_apache.exe stop

echo Stopping MySQL...
xampp_mysql.exe stop

echo.
echo [✓] XAMPP services stopped
echo.
echo PayCompare application is now offline.
pause
