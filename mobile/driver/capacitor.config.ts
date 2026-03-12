import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.edcorp.maweja.driver",
  appName: "MAWEJA Driver",
  webDir: "www",
  server: {
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#dc2626",
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: "#dc2626",
      androidSplashResourceName: "splash",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "Dark",
      backgroundColor: "#dc2626",
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_notify",
      iconColor: "#dc2626",
      sound: "default",
    },
    Geolocation: {
      // Géolocalisation obligatoire pour le suivi livreur
    },
    Camera: {
      // Pour photos de livraison
    },
  },
};

export default config;
