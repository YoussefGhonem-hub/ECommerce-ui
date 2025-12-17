# Build Release AAB for Google Play
# Run this script from the project root directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ABI-Brand - Build Release AAB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build production web app
Write-Host "[1/4] Building production web app..." -ForegroundColor Yellow
npm run build:prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Web build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Web build complete" -ForegroundColor Green
Write-Host ""

# Step 2: Sync with Capacitor
Write-Host "[2/4] Syncing with Capacitor Android..." -ForegroundColor Yellow
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Capacitor sync complete" -ForegroundColor Green
Write-Host ""

# Step 3: Check for keystore
Write-Host "[3/4] Checking for release keystore..." -ForegroundColor Yellow

$keystoreExists = Test-Path "android\app\abi-brand-release.keystore"
$keyPropertiesExists = Test-Path "android\app\key.properties"

if (-not $keystoreExists) {
    Write-Host "⚠️  WARNING: Keystore not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need to generate a keystore first:" -ForegroundColor Yellow
    Write-Host "  cd android\app" -ForegroundColor Cyan
    Write-Host "  keytool -genkey -v -keystore abi-brand-release.keystore -alias abi-brand -keyalg RSA -keysize 2048 -validity 10000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Then create key.properties file with your keystore password" -ForegroundColor Yellow
    Write-Host "See key.properties.example for template" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

if (-not $keyPropertiesExists) {
    Write-Host "⚠️  WARNING: key.properties not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Copy key.properties.example to key.properties and fill in your passwords" -ForegroundColor Yellow
    Write-Host "  cd android\app" -ForegroundColor Cyan
    Write-Host "  copy key.properties.example key.properties" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "✓ Release signing configured" -ForegroundColor Green
Write-Host ""

# Step 4: Build release AAB
Write-Host "[4/4] Building release AAB..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

Push-Location android
.\gradlew bundleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ AAB build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

Write-Host "✓ AAB build complete" -ForegroundColor Green
Write-Host ""

# Success
Write-Host "========================================" -ForegroundColor Green
Write-Host "     🎉 BUILD SUCCESSFUL! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your release AAB is located at:" -ForegroundColor Yellow
Write-Host "  android\app\build\outputs\bundle\release\app-release.aab" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Go to Google Play Console" -ForegroundColor White
Write-Host "  2. Create a new release" -ForegroundColor White
Write-Host "  3. Upload the AAB file" -ForegroundColor White
Write-Host "  4. Fill in release notes" -ForegroundColor White
Write-Host "  5. Submit for review" -ForegroundColor White
Write-Host ""
Write-Host "See GOOGLE_PLAY_GUIDE.md for detailed instructions" -ForegroundColor Gray
