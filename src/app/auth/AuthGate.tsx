import { useEffect, useState, type ReactNode } from "react";
import { GlobalLoading } from "../components/GlobalLoading";
import { api, getAuthToken, redirectToCentralAuth, refreshStoredUser, saveAuthSession, type UserSession } from "../services/api";

export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"checking" | "authenticated">("checking");

  useEffect(() => {
    let isActive = true;

    const checkSession = async () => {
      const token = getAuthToken();
      if (!token) {
        redirectToCentralAuth();
        return;
      }

      try {
        const response = await api.session();
        if (!isActive) return;

        if (!response.authenticated) {
          redirectToCentralAuth();
          return;
        }

        saveAuthSession(token, response.user as UserSession);
        try {
          await refreshStoredUser(token);
        } catch {
          // Session endpoint already confirmed authentication.
        }
        if (isActive) setStatus("authenticated");
      } catch {
        if (isActive) redirectToCentralAuth();
      }
    };

    void checkSession();
    return () => { isActive = false; };
  }, []);

  if (status === "checking") {
    return <GlobalLoading message="Memeriksa session Website Pusat..." />;
  }

  return <>{children}</>;
}