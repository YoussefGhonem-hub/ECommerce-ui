# Mobile App Conversion Guide

Your Angular ecommerce app has been successfully configured as a mobile app using Capacitor!

## 📱 What Was Done

### 1. Installed Dependencies

- `@capacitor/core` - Core Capacitor functionality
- `@capacitor/cli` - Command-line tools
- `@capacitor/android` - Android platform support
- `@capacitor/ios` - iOS platform support
- Mobile plugins: SplashScreen, StatusBar, Keyboard, Network, App, Haptics

### 2. Platform Setup

- ✅ Android platform added in `/android` folder
- ✅ iOS platform added in `/ios` folder
- ✅ Capacitor configuration created (`capacitor.config.ts`)

### 3. Mobile Initialization

- Created `src/app/mobile-init.ts` for platform initialization
- Integrated mobile features into `app.component.ts`
- Configured status bar, splash screen, and keyboard handling

### 4. Build Scripts Added to package.json

```json
"cap:sync": "npx cap sync",              // Sync web assets to native projects
"cap:open:android": "npx cap open android",  // Open Android Studio
"cap:open:ios": "npx cap open ios",      // Open Xcode
"build:mobile": "npm run build:prod && npx cap sync",  // Build and sync
"android": "npm run build:mobile && npx cap open android",  // Build & open Android
"ios": "npm run build:mobile && npx cap open ios"      // Build & open iOS
```

## 🚀 How to Build and Run Your Mobile App

### For Android:

1. **Build the app:**

   ```powershell
   npm run build:prod
   npx cap sync
   ```

2. **Open in Android Studio:**

   ```powershell
   npm run android
   ```

   Or manually:

   ```powershell
   npx cap open android
   ```

3. **Requirements:**

   - Install [Android Studio](https://developer.android.com/studio)
   - Install Android SDK (API 22+)
   - Create an Android Virtual Device (AVD) or connect a physical device
   - Enable USB debugging on physical device

4. **Run from Android Studio:**
   - Click the green "Run" button
   - Select your device/emulator
   - Wait for build and installation

### For iOS:

1. **Build the app:**

   ```powershell
   npm run build:prod
   npx cap sync
   ```

2. **Open in Xcode:**

   ```powershell
   npm run ios
   ```

   Or manually:

   ```powershell
   npx cap open ios
   ```

3. **Requirements:**

   - macOS with Xcode installed
   - iOS Simulator or physical iOS device
   - Apple Developer account (for device testing/deployment)

4. **Run from Xcode:**
   - Select a target device/simulator
   - Click the "Run" button (▶️)

## 🔧 Development Workflow

### During Development:

1. Make changes to your Angular code
2. Test in browser: `npm start`
3. When ready to test on mobile:
   ```powershell
   npm run build:prod
   npx cap sync
   ```

### Live Reload (Optional):

For faster development, you can use live reload:

```powershell
npm start
# Note your local IP (e.g., 192.168.1.100:4200)
```

Then update `capacitor.config.ts`:

```typescript
server: {
  url: 'http://192.168.1.100:4200',
  cleartext: true
}
```

Run `npx cap sync` and test on device. Changes will auto-reload!

**Important:** Remove the `server.url` before production builds.

## 📦 Building for Production

### Android APK/AAB:

1. Build the web assets:

   ```powershell
   npm run build:prod
   npx cap sync
   ```

2. Open Android Studio:

   ```powershell
   npx cap open android
   ```

3. In Android Studio:
   - Go to Build → Generate Signed Bundle/APK
   - Choose APK or Android App Bundle
   - Create/select keystore
   - Build release version

### iOS App Store:

1. Build the web assets:

   ```powershell
   npm run build:prod
   npx cap sync
   ```

2. Open Xcode:

   ```powershell
   npx cap open ios
   ```

3. In Xcode:
   - Select "Any iOS Device (arm64)"
   - Product → Archive
   - Upload to App Store Connect

## 🎨 Customization

### App Icon and Splash Screen:

1. **Icons:**

   - Android: Place icons in `android/app/src/main/res/mipmap-*` folders
   - iOS: Use Xcode asset catalog in `ios/App/App/Assets.xcassets/AppIcon.appiconset`

2. **Splash Screen:**
   - Android: Place `splash.png` in `android/app/src/main/res/drawable-*` folders
   - iOS: Use Xcode launch screen in `ios/App/App/Base.lproj/LaunchScreen.storyboard`

### App Name:

**Android:** Edit `android/app/src/main/res/values/strings.xml`:

```xml
<string name="app_name">Ecommerce App</string>
```

**iOS:** Edit in Xcode or `ios/App/App/Info.plist`:

```xml
<key>CFBundleDisplayName</key>
<string>Ecommerce App</string>
```

### App ID:

Change in `capacitor.config.ts`:

```typescript
appId: 'com.yourcompany.yourapp',
```

Then run:

```powershell
npx cap sync
```

## 🔌 Useful Capacitor Plugins

Already installed:

- ✅ @capacitor/splash-screen
- ✅ @capacitor/status-bar
- ✅ @capacitor/keyboard
- ✅ @capacitor/network
- ✅ @capacitor/app
- ✅ @capacitor/haptics

Additional plugins you might need:

```powershell
npm install @capacitor/camera --save --legacy-peer-deps
npm install @capacitor/filesystem --save --legacy-peer-deps
npm install @capacitor/geolocation --save --legacy-peer-deps
npm install @capacitor/push-notifications --save --legacy-peer-deps
npm install @capacitor/share --save --legacy-peer-deps
npm install @capacitor/storage --save --legacy-peer-deps
```

## 🐛 Troubleshooting

### Sync Issues:

```powershell
npx cap sync
```

### Clean Build:

```powershell
# Remove platforms
Remove-Item -Recurse -Force android, ios

# Re-add platforms
npx cap add android
npx cap add ios
npm run build:prod
npx cap sync
```

### Android Build Errors:

- Update Android SDK in Android Studio
- Sync Gradle files
- Clean and rebuild: Build → Clean Project, then Build → Rebuild Project

### iOS Build Errors:

- Clean build folder: Product → Clean Build Folder
- Update CocoaPods: `pod repo update` (in ios/App folder)
- Run `pod install` in ios/App folder

## 📱 Testing on Physical Devices

### Android:

1. Enable Developer Options on your device
2. Enable USB Debugging
3. Connect via USB
4. Device will appear in Android Studio
5. Click Run

### iOS:

1. Connect iPhone/iPad via USB
2. Trust the computer on device
3. Select device in Xcode
4. Sign the app with your Apple Developer account
5. Click Run
6. Trust the developer profile on device (Settings → General → Device Management)

## 🌐 API Configuration

Update your API URL in `capacitor.config.ts` for production:

```typescript
server: {
  androidScheme: 'https',
  iosScheme: 'https',
  cleartext: false  // Set to true for http during dev
}
```

Make sure your API supports CORS for the mobile app domains.

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Studio Setup](https://capacitorjs.com/docs/android)
- [Xcode Setup](https://capacitorjs.com/docs/ios)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)

## ✅ Next Steps

1. Test the web app: `npm start`
2. Build for mobile: `npm run build:prod && npx cap sync`
3. Open Android Studio: `npm run android`
4. Test on Android emulator/device
5. Customize app icon and splash screen
6. Test all features on mobile
7. Build production APK/AAB for release

Your ecommerce app is now ready to run on iOS and Android! 🎉
