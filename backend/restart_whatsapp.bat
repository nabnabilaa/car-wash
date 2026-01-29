@echo off
echo ============================================
echo WhatsApp Service - Clean Restart
echo ============================================
echo.

REM Kill all node processes
echo [1/5] Stopping Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

REM Delete session folders
echo [2/5] Cleaning session data...
if exist .wwebjs_auth (
    rmdir /S /Q .wwebjs_auth
    echo    - Deleted .wwebjs_auth
)
if exist .wwebjs_cache (
    rmdir /S /Q .wwebjs_cache
    echo    - Deleted .wwebjs_cache
)

echo [3/5] Session cleaned!
echo.
echo [4/5] Starting WhatsApp service...
echo.
echo ============================================
echo INSTRUKSI:
echo 1. QR code akan muncul
echo 2. Scan SEMUA QR dengan WhatsApp (bisa ada 2-3 kali)
echo 3. Tunggu sampai muncul: "WhatsApp Client is ready!"
echo 4. Test dengan: python test_whatsapp.py
echo ============================================
echo.
echo [5/5] Starting service NOW...
echo.

node whatsapp_service.js
