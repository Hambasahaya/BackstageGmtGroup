import { useEffect } from "react";
import { GlobalLoading } from "./GlobalLoading";
import { redirectToCentralAuth } from "../services/api";

export function ExternalAuthRedirect() {
  useEffect(() => {
    redirectToCentralAuth();
  }, []);

  return <GlobalLoading message="Mengalihkan ke GMT Suite..." />;
}