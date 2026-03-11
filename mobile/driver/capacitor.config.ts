import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "cd.maweja.driver",
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
      iosSplashResourceName: "Splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "Dark",
      backgroundColor: "#dc2626",
    },
  },
};

export default config;
