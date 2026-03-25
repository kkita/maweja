import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "net.maweja.app",
  appName: "MAWEJA",
  webDir: "dist/public",
  server: {
    url: "https://maweja.net",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_notify",
      largeIcon: "ic_notif_large",
      iconColor: "#EC0000",
      sound: "default",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
