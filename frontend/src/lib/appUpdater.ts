import { Capacitor, registerPlugin } from "@capacitor/core";

type AppUpdaterPlugin = {
  startUpdate(options: { url: string; fileName?: string }): Promise<{ filePath: string; openedInstaller: boolean }>;
};

const AppUpdater = registerPlugin<AppUpdaterPlugin>("AppUpdater");

export async function startNativeUpdate(url: string, fileName = "app-debug.apk") {
  if (Capacitor.getPlatform() !== "android") {
    throw new Error("Native update is available only on Android.");
  }

  if (!Capacitor.isPluginAvailable("AppUpdater")) {
    throw new Error("AppUpdater plugin is not implemented on Android for this APK build.");
  }

  return AppUpdater.startUpdate({ url, fileName });
}

export function isNativeAndroid() {
  return Capacitor.getPlatform() === "android";
}
