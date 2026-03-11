import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "cd.maweja.client",
  appName: "MAWEJA",
  webDir: "www",
  server: {
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#dc2626",
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
      style: "Default",
      backgroundColor: "#dc2626",
    },
  },
};

export default config;
