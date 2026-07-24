import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { GlobalLoading } from "../components/GlobalLoading";
import { api, getAuthToken, refreshStoredUser, saveAuthSession, type UserSession } from "../services/api";

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

    return () => {
      isActive = false;
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
