import { getStoredUser } from "./api";

declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
  }
}

const DEFAULT_CLARITY_PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID || "xxygs9488k";

export function initClarity(projectId?: string) {
  const id = projectId || DEFAULT_CLARITY_PROJECT_ID;
  if (!id || typeof window === "undefined") {
    return;
  }

  if (!window.clarity) {
    (function (c: any, l: any, a: string, r: string, i: string, t?: any, y?: any) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode?.insertBefore(t, y);
    })(window, document, "clarity", "script", id);
  } else {
    window.clarity("resume");
  }

  const storedUser = getStoredUser();
  if (storedUser?.id) {
    identifyClarityUser(storedUser.id, storedUser.name || storedUser.email);
  }
}

export function pauseClarity() {
  if (typeof window !== "undefined" && window.clarity) {
    window.clarity("pause");
  }
}

export function resumeClarity() {
  if (typeof window !== "undefined" && window.clarity) {
    window.clarity("resume");
  }
}

export function identifyClarityUser(userId: string | number, friendlyName?: string) {
  if (typeof window !== "undefined" && window.clarity && userId) {
    window.clarity("identify", String(userId), undefined, undefined, friendlyName);
  }
}

export function setClarityTag(key: string, value: string | string[]) {
  if (typeof window !== "undefined" && window.clarity) {
    window.clarity("set", key, value);
  }
}

export function trackClarityEvent(eventName: string) {
  if (typeof window !== "undefined" && window.clarity) {
    window.clarity("event", eventName);
  }
}
