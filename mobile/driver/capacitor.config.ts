import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.edcorp.maweja.driver",
  appName: "MAWEJA Driver",
  webDir: "www",
  server: {
    url: "https://maweja.net/driver/login",
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    backgroundColor: "#EC0000",
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
    },
    StatusBar: {
      style: "Dark",
      backgroundColor: "#EC0000",
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_notify",
      largeIcon: "ic_notif_large",
      iconColor: "#EC0000",
      sound: "default",
    },
    Geolocation: {},
    Camera: {},
  },
};

export default config;
