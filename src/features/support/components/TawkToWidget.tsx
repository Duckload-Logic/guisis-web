import { useEffect } from "react";

declare global {
  interface Window {
    Tawk_API?: Record<string, unknown>;
    Tawk_LoadStart?: Date;
  }
}

const TAWK_SCRIPT_ID = "tawk-to-widget-script";

function isValidTawkValue(value?: string) {
  if (!value) return false;

  const trimmed = value.trim();

  return (
    trimmed.length > 0 &&
    trimmed !== "your_tawk_property_id" &&
    trimmed !== "your_tawk_widget_id" &&
    trimmed !== "undefined" &&
    trimmed !== "null"
  );
}

export function TawkToWidget() {
  useEffect(() => {
    const propertyId = import.meta.env.VITE_TAWK_PROPERTY_ID;
    const widgetId = import.meta.env.VITE_TAWK_WIDGET_ID || "default";

    if (!isValidTawkValue(propertyId) || !isValidTawkValue(widgetId)) {
      console.warn(
        "[TawkToWidget] Missing or invalid Tawk.to environment variables. Please set VITE_TAWK_PROPERTY_ID and VITE_TAWK_WIDGET_ID.",
      );
      return;
    }

    if (document.getElementById(TAWK_SCRIPT_ID)) {
      return;
    }

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    script.id = TAWK_SCRIPT_ID;
    script.async = true;
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    script.onerror = () => {
      console.error(
        "[TawkToWidget] Failed to load Tawk.to. Check if your Property ID and Widget ID are correct.",
      );
    };

    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById(TAWK_SCRIPT_ID);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null;
}

export default TawkToWidget;