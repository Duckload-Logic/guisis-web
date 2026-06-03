import { useState, useEffect, useCallback } from "react";
import { PostPushSubscribe, DeletePushSubscribe } from "../services";
import { useAuth } from "@/context";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { isAuthenticated } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" ? Notification.permission : "default",
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const syncSubscription = useCallback(async () => {
    if (!isSupported) return;
    try {
      if (Notification.permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      const rawKey = subscription.getKey("p256dh");
      const rawAuth = subscription.getKey("auth");

      const p256dhKey = rawKey
        ? btoa(String.fromCharCode(...new Uint8Array(rawKey)))
        : "";
      const authKey = rawAuth
        ? btoa(String.fromCharCode(...new Uint8Array(rawAuth)))
        : "";

      await PostPushSubscribe({
        endpoint: subscription.endpoint,
        p256dhKey,
        authKey,
      });
      setIsSubscribed(true);
    } catch (error) {
      console.error("Failed to sync push subscription:", error);
    }
  }, [isSupported]);

  useEffect(() => {
    if (isAuthenticated) {
      syncSubscription();
    }
  }, [isAuthenticated, syncSubscription]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      setIsSupported(true);
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) return;
    setIsPending(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        throw new Error("Push notification permission denied");
      }

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID public key not found in env");
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      const rawKey = subscription.getKey("p256dh");
      const rawAuth = subscription.getKey("auth");

      const p256dhKey = rawKey
        ? btoa(String.fromCharCode(...new Uint8Array(rawKey)))
        : "";
      const authKey = rawAuth
        ? btoa(String.fromCharCode(...new Uint8Array(rawAuth)))
        : "";

      await PostPushSubscribe({
        endpoint: subscription.endpoint,
        p256dhKey,
        authKey,
      });

      setIsSubscribed(true);
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    setIsPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await DeletePushSubscribe(subscription.endpoint);
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setPermission(Notification.permission);
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isPending,
    subscribe,
    unsubscribe,
    syncSubscription,
  };
}
