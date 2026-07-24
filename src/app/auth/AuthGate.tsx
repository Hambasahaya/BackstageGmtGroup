import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { GlobalLoading } from "../components/GlobalLoading";
import { api, getAuthToken, refreshStoredUser, saveAuthSession, authSessionUpdatedEvent, type UserSession } from "../services/api";

export function AuthGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [status, setStatus] = useState<"checking" | "authenticated" | "guest">("checking");

  useEffect(() => {
    let isActive = true;

    const checkSession = async () => {
      const token = getAuthToken();

      if (!token) {
        setStatus("guest");
        return;
      }

      try {
        const response = await api.session();
        if (!isActive) {
          return;
        }

        if (response.authenticated) {
          saveAuthSession(token, response.user as UserSession);
          try {
            await refreshStoredUser(token);
          } catch {
            // Session data is still enough to keep the user authenticated.
          }
          setStatus("authenticated");
          return;
        }

        setStatus("guest");
      } catch {
        if (isActive) {
          setStatus("guest");
        }
      }
    };

    void checkSession();

    // Listen for session updates (e.g. token expired/revoked) to redirect automatically
    const handleSessionUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ user: UserSession | null }>;
      if (!customEvent.detail.user && isActive) {
        setStatus("guest");
      }
    };

    window.addEventListener(authSessionUpdatedEvent, handleSessionUpdate);

    return () => {
      isActive = false;
      window.removeEventListener(authSessionUpdatedEvent, handleSessionUpdate);
    };
  }, []);

  if (status === "checking") {
    return <GlobalLoading message="Memeriksa session Website Pusat..." />;
  }

  if (status === "guest") {
    const redirectTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/register?redirect=${encodeURIComponent(redirectTo)}`} replace />;
  }

  return <>{children}</>;
}
