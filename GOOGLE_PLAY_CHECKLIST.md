# Google Play Upload Checklist - ABI-Brand

Use this checklist to ensure you complete all steps before submitting to Google Play.

## Pre-Upload Preparation

### ☐ Account Setup

- [ ] Create Google Play Developer account ($25 fee)
- [ ] Complete business verification (if required)
- [ ] Set up payment methods (if selling)

### ☐ App Configuration

- [ ] Application ID: `com.ecommerce.app` ✓
- [ ] App Name: `ABI-Brand` ✓
- [ ] Version Code: `1` (increment for updates)
- [ ] Version Name: `1.0.0` (semantic versioning)

### ☐ Build Preparation

- [ ] Generate keystore file
  ```
  cd android/app
  keytool -genkey -v -keystore abi-brand-release.keystore -alias abi-brand -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] Create `key.properties` file with passwords
- [ ] Backup keystore and passwords securely
- [ ] Update `build.gradle` with signing configuration ✓

### ☐ Web App Build

- [ ] Test in production mode locally
- [ ] Build production web app: `npm run build:prod`
- [ ] Verify no console errors
- [ ] Test all critical features

### ☐ Mobile Build

- [ ] Sync with Capacitor: `npx cap sync android`
- [ ] Test on physical Android device
- [ ] Build release AAB: `.\build-release.ps1` or manual build
- [ ] Verify AAB file created successfully

## Store Listing Assets

### ☐ App Icon

- [ ] 512x512 PNG (32-bit with transparency)
- [ ] Follows Material Design guidelines
- [ ] Location: `android/app/src/main/res/mipmap-*/`

### ☐ Screenshots (Required: at least 2 for each)

Phone Screenshots (16:9 or 9:16 ratio):

- [ ] Home/Shop page
- [ ] Product details page
- [ ] Cart page
- [ ] Checkout page
- [ ] User profile/orders

Tablet Screenshots (optional but recommended):

- [ ] Home page (tablet layout)
- [ ] Product grid (tablet layout)

### ☐ Graphics

- [ ] Feature Graphic: 1024x500 JPG/PNG (required)
- [ ] Promo Graphic: 180x120 JPG/PNG (optional)
- [ ] TV Banner: 1280x720 JPG/PNG (if targeting TV)

### ☐ Video (Optional)

- [ ] YouTube promotional video URL

## App Information

### ☐ Descriptions

- [ ] Title: "ABI-Brand" (max 50 characters)
- [ ] Short Description: Compelling tagline (max 80 characters)
- [ ] Full Description: Detailed app description (max 4000 characters)
  - What the app does
  - Key features
  - Benefits to users
  - Any special offers

### ☐ Categorization

- [ ] Category: Shopping
- [ ] Tags: ecommerce, shopping, online store, etc.
- [ ] Content Rating: Complete questionnaire

### ☐ Contact Information

- [ ] Email address (publicly visible)
- [ ] Website URL (optional)
- [ ] Phone number (optional)

### ☐ Privacy Policy

- [ ] Privacy policy URL (publicly accessible)
- [ ] Policy covers all data collection and usage
- [ ] Link is working and accessible

## Google Play Console Setup

### ☐ Create App

- [ ] Click "Create App" in Play Console
- [ ] Enter app name: ABI-Brand
- [ ] Select default language
- [ ] Choose "App" (not Game)
- [ ] Choose "Free" or "Paid"
- [ ] Accept developer declarations

### ☐ Main Store Listing

- [ ] Upload app icon
- [ ] Upload feature graphic
- [ ] Upload phone screenshots
- [ ] Upload tablet screenshots (optional)
- [ ] Enter title
- [ ] Enter short description
- [ ] Enter full description
- [ ] Select category
- [ ] Add tags
- [ ] Enter contact email
- [ ] Enter privacy policy URL

### ☐ Content Rating

- [ ] Complete content rating questionnaire
- [ ] Submit for rating
- [ ] Wait for rating (usually instant)

### ☐ Pricing & Distribution

- [ ] Select countries/regions for distribution
- [ ] Confirm pricing (free or paid)
- [ ] Accept developer program policies
- [ ] Confirm app content guidelines
- [ ] Confirm export laws compliance

### ☐ App Content

- [ ] Privacy Policy section completed
- [ ] Ads declaration (does app contain ads?)
- [ ] Target audience and content
- [ ] News app declaration (if applicable)
- [ ] COVID-19 contact tracing/status apps (if applicable)
- [ ] Data safety section
  - Data collection practices
  - Data sharing practices
  - Data security practices

## Release Preparation

### ☐ Create Release (Internal Testing - Recommended First)

- [ ] Go to Testing > Internal Testing
- [ ] Create new release
- [ ] Upload AAB file: `android/app/build/outputs/bundle/release/app-release.aab`
- [ ] Add release name: "v1.0.0"
- [ ] Add release notes
- [ ] Save and review
- [ ] Add test users (email addresses)
- [ ] Start rollout to internal testing

### ☐ Internal Testing

- [ ] Test users receive link
- [ ] Install and test thoroughly
- [ ] Fix any issues found
- [ ] Collect feedback

### ☐ Create Production Release (After Testing)

- [ ] Go to Production
- [ ] Create new release
- [ ] Upload AAB file
- [ ] Add release name: "v1.0.0"
- [ ] Add release notes (multiple languages if needed)
- [ ] Review all warnings/errors
- [ ] Confirm rollout percentage (100% or staged)

## Pre-Submission Verification

### ☐ All Sections Complete

- [ ] Main store listing: ✓
- [ ] Content rating: ✓
- [ ] Pricing & distribution: ✓
- [ ] App content: ✓
- [ ] Release ready: ✓

### ☐ Final Checks

- [ ] All checkmarks green in Play Console
- [ ] No warnings or errors
- [ ] Release notes added
- [ ] Screenshots look correct
- [ ] App icon displays properly
- [ ] All links work (privacy policy, website)

## Submission

### ☐ Submit for Review

- [ ] Click "Start rollout to Production"
- [ ] Confirm rollout
- [ ] Note submission date/time
- [ ] Monitor Play Console for review status

## Post-Submission

### ☐ During Review (1-7 days)

- [ ] Check Play Console daily for status updates
- [ ] Check email for Google Play notifications
- [ ] Respond quickly to any review issues

### ☐ If Approved

- [ ] Note approval date
- [ ] Verify app appears in Play Store
- [ ] Test download and installation
- [ ] Share app link with users

### ☐ If Rejected

- [ ] Review rejection reasons carefully
- [ ] Fix all issues mentioned
- [ ] Update AAB if code changes needed
- [ ] Update store listing if metadata issues
- [ ] Resubmit after fixes
- [ ] Respond to reviewer if clarification needed

## Future Updates Checklist

For each new version:

- [ ] Increment `versionCode` in build.gradle
- [ ] Update `versionName` (e.g., 1.0.0 → 1.0.1)
- [ ] Build web app: `npm run build:prod`
- [ ] Sync: `npx cap sync android`
- [ ] Build new AAB with updated version
- [ ] Create new release in Play Console
- [ ] Upload new AAB
- [ ] Add release notes describing changes
- [ ] Submit for review

## Important Reminders

### 🔐 Security

- [ ] NEVER commit keystore files to git
- [ ] NEVER commit key.properties to git
- [ ] Backup keystore in secure location (minimum 2 backups)
- [ ] Store passwords in password manager

### 📊 Monitoring

- [ ] Set up crash reporting (Firebase Crashlytics)
- [ ] Monitor reviews and ratings
- [ ] Respond to user reviews
- [ ] Track download statistics

### 🔄 Maintenance

- [ ] Plan regular updates
- [ ] Keep dependencies up to date
- [ ] Test on new Android versions
- [ ] Monitor Play Console for policy updates

---

## Quick Reference

**Play Console:** https://play.google.com/console  
**Package Name:** com.ecommerce.app  
**App Name:** ABI-Brand  
**Current Version:** 1.0.0 (Code: 1)

**Build Command:**

```powershell
.\build-release.ps1
```

**AAB Location:**

```
android\app\build\outputs\bundle\release\app-release.aab
```

**Guide:** See `GOOGLE_PLAY_GUIDE.md` for detailed instructions
