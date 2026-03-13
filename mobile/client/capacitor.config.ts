import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.edcorp.maweja",
  appName: "MAWEJA",
  webDir: "www",
  server: {
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#dc2626",
    allowMixedContent: true,
  },
  ios: {
    backgroundColor: "#dc2626",
    contentInset: "automatic",
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: "#dc2626",
      androidSplashResourceName: "splash",
      iosSplashResourceName: "Splash",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "Default",
      backgroundColor: "#dc2626",
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_launcher_foreground",
      iconColor: "#dc2626",
      sound: "default",
    },
    Geolocation: {
      // Aucune config supplémentaire — permissions injectées dans le manifest
    },
    Camera: {
      // Aucune config supplémentaire — permissions injectées dans le manifest
    },
  },
};

export default config;
