import { AlertCircle, ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import {
  api,
  getAuthToken,
  getStoredUser,
  rememberLoginSourceFromPage,
} from "../services/api";
import { GlobalLoading } from "./GlobalLoading";

export function SsoStart() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const targetClient = searchParams.get("target_client") || searchParams.get("client") || "website_a";
  const stateParam = searchParams.get("state") || undefined;

  const startSsoProcess = async () => {
    setStatus("loading");
    setErrorMessage("");

    rememberLoginSourceFromPage(searchParams);

    const token = getAuthToken();
    const user = getStoredUser();

    if (!token || !user) {
      const currentFullUrl = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(currentFullUrl)}`, { replace: true });
      return;
    }

    try {
      const response = await api.ssoCode({
        target_client: targetClient,
        state: stateParam,
      });

      if (response.redirect_url) {
        window.location.href = response.redirect_url;
      } else {
        throw new Error("Redirect URL tidak ditemukan dari server SSO.");
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal menginisialisasi sesi Single Sign-On (SSO)."
      );
    }
  };

  useEffect(() => {
    void startSsoProcess();
  }, [searchParams]);

  if (status === "loading") {
    return <GlobalLoading message="Menyiapkan otentikasi SSO..." />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4 text-slate-900">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#0F766E]">
          <ShieldCheck className="h-4 w-4" />
          <span>Single Sign-On (SSO)</span>
        </div>

        <h1 className="mt-1 text-xl font-bold text-slate-950">Gagal Menginisialisasi SSO</h1>
        <p className="mt-2 text-sm text-slate-600">{errorMessage}</p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => void startSsoProcess()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0F766E] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0D655E]"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>
          <button
            onClick={() => navigate("/", { replace: true })}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </button>
        </div>
      </section>
    </main>
  );
}
