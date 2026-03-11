import { CapacitorConfig } from "@capacitor/cli";

// DRIVER APP — Android uniquement (pas d'iOS)
const config: CapacitorConfig = {
  appId: "com.edcorp.maweja.driver",
  appName: "MAWEJA Driver",
  webDir: "www",
  server: {
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#1f2937",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#dc2626",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "Dark",
      backgroundColor: "#dc2626",
    },
  },
};

export default config;
