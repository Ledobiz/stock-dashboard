import OneSignal from "react-onesignal";

// One private user, so one fixed External ID. The backend stores the same value as
// `push_external_id` and addresses OneSignal messages to it.
export const PUSH_EXTERNAL_ID = "owner";

let initialised: string | null = null;

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

async function init(appId: string): Promise<void> {
  if (initialised === appId) return;
  await OneSignal.init({ appId, allowLocalhostAsSecureOrigin: true });
  initialised = appId;
}

/** Asks for browser permission, subscribes this device and links it to `PUSH_EXTERNAL_ID`. */
export async function enablePush(appId: string): Promise<void> {
  if (!pushSupported()) throw new Error("This browser does not support web push.");
  await init(appId);
  await OneSignal.Notifications.requestPermission();
  if (!OneSignal.Notifications.permission) {
    throw new Error("Notification permission was not granted in the browser.");
  }
  await OneSignal.login(PUSH_EXTERNAL_ID);
  await OneSignal.User.PushSubscription.optIn();
}

/** Whether this browser is currently subscribed (initialises the SDK to find out). */
export async function pushSubscribed(appId: string): Promise<boolean> {
  if (!pushSupported()) return false;
  await init(appId);
  return OneSignal.User.PushSubscription.optedIn === true;
}
