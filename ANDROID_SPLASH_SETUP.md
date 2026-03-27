# Android Splash Screen Setup — MAWEJA

## Single Splash Architecture

The app uses a **single splash** approach:

1. **Android 12+ (API 31+)**: Uses the native `windowSplashScreen` API with `splash_logo.png` on `#EC0000` red background
2. **Android < 12**: Uses `splash_screen.xml` (layer-list drawable) with the same logo/color
3. **Capacitor SplashScreen plugin**: DISABLED (`launchShowDuration: 0`) — no second splash
4. **Web custom splash**: The web app has its own video splash that plays immediately when the WebView loads

## Files Provided (ready to copy into Capacitor Android project)

### Resource files (per project: root, mobile/client, mobile/driver)

```
android/app/src/main/res/
├── values/
│   ├── colors.xml         ← #EC0000 brand red
│   └── styles.xml         ← AppTheme.Splash with splash_screen drawable
├── values-v31/
│   └── styles.xml         ← Android 12 windowSplashScreenAnimatedIcon + background
├── drawable/
│   ├── splash_screen.xml  ← Layer-list: red bg + centered logo (pre-Android 12)
│   └── splash_logo.png    ← MAWEJA icon
├── drawable-v31/
│   └── splash_logo.png    ← Same icon for Android 12+ splash API
├── drawable-mdpi/
│   └── splash_logo.png
├── drawable-hdpi/
│   └── splash_logo.png
├── drawable-xhdpi/
│   └── splash_logo.png
├── drawable-xxhdpi/
│   └── splash_logo.png
└── drawable-xxxhdpi/
    └── splash_logo.png
```

## Build Instructions

After running `npx cap add android` or `npx cap sync android`:

### 1. Set the launch theme in AndroidManifest.xml

```xml
<activity
    android:name=".MainActivity"
    android:theme="@style/AppTheme.Splash"
    android:exported="true">
    <!-- ... intent filters ... -->
</activity>
```

### 2. Switch theme in MainActivity.java/kt

In `MainActivity.java` (or `.kt`), switch theme BEFORE super.onCreate:

```java
@Override
protected void onCreate(Bundle savedInstanceState) {
    // Switch from splash theme to normal theme
    setTheme(R.style.AppTheme);
    super.onCreate(savedInstanceState);
}
```

### 3. Copy resource files

Copy all files from the corresponding project's `android/app/src/main/res/` into the Capacitor-generated `android/app/src/main/res/` folder.

### 4. Verify capacitor.config.ts

Ensure `SplashScreen.launchShowDuration` is `0` to prevent Capacitor's own splash from showing.

## Result

- App opens → Android native splash (red + MAWEJA logo, ~0.5s)
- WebView loads → Web video splash plays seamlessly on same red background
- No double splash, no flicker, no icon-on-white screen
