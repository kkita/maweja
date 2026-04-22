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
    backgroundColor: "#EC0000",
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
      launchAutoHide: true,
    },
    /**
     * StatusBar — contrôle dynamique des system bars depuis le web.
     * overlaysWebView: false → la status bar ne chevauche pas la WebView (iOS).
     * style et backgroundColor sont mis à jour en temps réel par theme.tsx
     * via syncNativeStatusBar() selon le thème actif (clair/sombre).
     */
    StatusBar: {
      overlaysWebView: false,
      style: "LIGHT",
      backgroundColor: "#FFFFFF",
    },
  },
};

export default config;
