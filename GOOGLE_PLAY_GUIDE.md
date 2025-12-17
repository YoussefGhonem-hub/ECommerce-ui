# Google Play Upload Guide - ABI-Brand

## Prerequisites

Before uploading to Google Play, you need:

1. **Google Play Console Account** - [Create one here](https://play.google.com/console)

   - One-time registration fee: $25 USD
   - Business verification may take 1-3 days

2. **Android Studio** - [Download here](https://developer.android.com/studio)

   - Required for building signed APK/AAB

3. **Java Development Kit (JDK)** - Version 17 (already configured in your project)

## Step 1: Build the Production Web App

First, build your Angular app in production mode:

```powershell
# Build the web app
npm run build:prod
```

This creates optimized files in `dist/vuexy/`

## Step 2: Sync with Capacitor

Copy the web build to the Android project:

```powershell
# Sync web files to native platforms
npx cap sync android
```

Or use the combined command:

```powershell
npm run build:mobile
```

## Step 3: Generate a Keystore (First Time Only)

You need a keystore to sign your app. **Keep this file and password safe!** You'll need them for all future updates.

```powershell
# Navigate to android/app directory
cd android/app

# Generate keystore (replace YOUR_NAME with your name/company)
keytool -genkey -v -keystore abi-brand-release.keystore -alias abi-brand -keyalg RSA -keysize 2048 -validity 10000

# Follow the prompts and enter:
# - Keystore password (remember this!)
# - Key password (can be same as keystore password)
# - Your name/organization details
```

**⚠️ CRITICAL: Backup this keystore file!** Store it securely - losing it means you can't update your app!

## Step 4: Configure Gradle for Release Signing

Create/update the file: `android/app/key.properties`

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=abi-brand
storeFile=abi-brand-release.keystore
```

**⚠️ Important: Add `key.properties` to `.gitignore`** - Never commit passwords to git!

Then update `android/app/build.gradle`:

Add this BEFORE the `android` block:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('app/key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Update the `signingConfigs` and `buildTypes` sections:

```gradle
android {
    // ... existing config ...

    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Step 5: Update Version Information

Edit `android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId "com.ecommerce.app"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1        // Increment this for each release (1, 2, 3, ...)
    versionName "1.0.0"  // Semantic version (1.0.0, 1.0.1, 1.1.0, ...)
    // ...
}
```

**For each new release:**

- Increment `versionCode` by 1 (must be higher than previous)
- Update `versionName` following semantic versioning

## Step 6: Build the Release App Bundle (AAB)

Google Play requires AAB format (not APK) for new apps:

```powershell
# Open Android project in Android Studio
npx cap open android

# Or manually open the folder:
# android/ folder in Android Studio
```

**In Android Studio:**

1. **Build > Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Click **Next**
4. Choose your keystore file (`abi-brand-release.keystore`)
5. Enter passwords
6. Select **release** build variant
7. Check **V2 (Full APK Signature)**
8. Click **Finish**

The AAB file will be in: `android/app/release/app-release.aab`

### Alternative: Build via Command Line

```powershell
cd android

# Build release AAB
./gradlew bundleRelease

# The AAB file will be at:
# app/build/outputs/bundle/release/app-release.aab
```

## Step 7: Prepare App Store Assets

Before uploading, prepare these assets:

### Required Screenshots (at least 2 for each):

- **Phone**: 16:9 or 9:16 ratio, min 320px
- **Tablet (optional)**: 16:9 or 9:16 ratio

### App Icon:

- 512x512 PNG (32-bit)
- Already configured in `android/app/src/main/res/`

### Feature Graphic:

- 1024x500 JPG or PNG
- Displayed on Google Play

### Privacy Policy URL:

- Required for apps requesting permissions
- Must be publicly accessible URL

### App Description:

- **Title**: ABI-Brand (max 50 characters)
- **Short Description**: max 80 characters
- **Full Description**: max 4000 characters

### Category:

- Shopping

### Content Rating:

- Complete questionnaire in Play Console

## Step 8: Create App in Google Play Console

1. **Go to**: [Google Play Console](https://play.google.com/console)
2. Click **Create App**
3. Fill in:
   - App name: **ABI-Brand**
   - Default language: **English (United States)** or your language
   - App or game: **App**
   - Free or paid: **Free** (or Paid)
   - Accept declarations

## Step 9: Complete Store Listing

In your app's dashboard:

### Main Store Listing:

1. **App Details**:
   - Title: ABI-Brand
   - Short description
   - Full description
2. **Graphics**:

   - Upload app icon
   - Upload feature graphic
   - Upload screenshots (phone and tablet)

3. **Categorization**:

   - Category: Shopping
   - Tags (optional)

4. **Contact Details**:

   - Email
   - Phone (optional)
   - Website (optional)

5. **Privacy Policy**:
   - Enter your privacy policy URL

## Step 10: Content Rating

1. Navigate to **Content Rating**
2. Fill out the questionnaire
3. Submit for rating

## Step 11: Set Up Pricing & Distribution

1. **Pricing**:
   - Free or Paid
2. **Countries**:
   - Select countries where app will be available
3. **Consent**:
   - Check required boxes

## Step 12: Upload Your App Bundle

1. Go to **Production** (or Internal Testing for testing first)
2. Click **Create New Release**
3. **Upload** your `app-release.aab` file
4. Add **Release Name**: "v1.0.0" or your version
5. Add **Release Notes** in supported languages
6. **Save** and **Review Release**

## Step 13: Submit for Review

1. Review all sections (must have green checkmarks)
2. Click **Start rollout to Production** (or testing track)
3. Confirm rollout

## Review Process

- **Review Time**: 1-7 days (typically 24-48 hours)
- **Status**: Track in Play Console
- **If Rejected**: Fix issues and resubmit

## Testing Before Production

**Recommended**: Use Internal Testing first!

1. Create **Internal Testing** release
2. Add test users via email
3. They receive link to install
4. Test thoroughly
5. Move to Production when ready

## Future Updates

For each update:

1. Increment `versionCode` in `build.gradle`
2. Update `versionName`
3. Build web app: `npm run build:prod`
4. Sync: `npx cap sync android`
5. Generate new AAB with Android Studio
6. Upload to Play Console
7. Add release notes
8. Submit

## Troubleshooting

### Common Issues:

**Build fails with signing errors:**

- Verify keystore path and passwords in `key.properties`

**"You uploaded a debuggable APK":**

- Make sure you're building **release** variant, not debug

**Version code conflict:**

- Increment `versionCode` in `build.gradle`

**Missing permissions:**

- Declared in `AndroidManifest.xml` automatically by Capacitor

**App crashes on startup:**

- Check ProGuard rules if you enabled minification
- Test the release build before uploading

## Important Files to Backup

**CRITICAL - Backup these files securely:**

1. `android/app/abi-brand-release.keystore` - YOUR SIGNING KEY
2. `android/app/key.properties` - Your passwords (encrypted backup)
3. Keystore passwords (in password manager)

**Without these, you cannot update your app on Google Play!**

## Resources

- [Android Developer Guide](https://developer.android.com/distribute/googleplay/start)
- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Play Console Help](https://support.google.com/googleplay/android-developer)

---

## Quick Commands Summary

```powershell
# Build and sync
npm run build:prod
npx cap sync android

# Open in Android Studio
npx cap open android

# Build AAB via command line
cd android
./gradlew bundleRelease
```

**Next Steps:**

1. Generate your keystore
2. Configure signing in build.gradle
3. Build the AAB
4. Create app in Play Console
5. Upload and submit!

Good luck with your app launch! 🚀
