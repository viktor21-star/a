import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "mk.zitomarketi.pecenje",
  appName: "Контрола на печење",
  webDir: "dist",
  android: {
    allowMixedContent: true
  },
  server: {
    androidScheme: "https"
  }
};

export default config;
