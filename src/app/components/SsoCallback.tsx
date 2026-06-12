import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getRoleHomePath } from "../auth/navigation";
import {
  api,
  refreshStoredUser,
  rememberDefaultLoginSource,
  rememberLoginSourceFromPage,
  saveAuthSession,
} from "../services/api";

export function SsoCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Menukar kode SSO Website A...");

  useEffect(() => {
    let isActive = true;

    const exchangeCode = async () => {
      const code = searchParams.get("code");
      rememberLoginSourceFromPage(searchParams);
      rememberDefaultLoginSource();

      if (!code) {
        setStatus("error");
        setMessage("Kode SSO tidak ditemukan di URL callback.");
        return;
      }

      try {
        const response = await api.ssoExchange({ code });

        if (!isActive) {
          return;
        }

        saveAuthSession(response.token, response.user);
        let user = response.user;
        try {
          user = await refreshStoredUser(response.token);
        } catch {
          // SSO response still carries role for the normal redirect path.
        }
        setStatus("success");
        setMessage("SSO berhasil. Mengarahkan ke dashboard...");
        navigate(getRoleHomePath(user), { replace: true });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Gagal menukar kode SSO.");
      }
    };

    void exchangeCode();

    return () => {
      isActive = false;
    };
  }, [navigate, searchParams]);

  const Icon = status === "error" ? AlertCircle : status === "success" ? CheckCircle2 : Loader2;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4 text-slate-900">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-lg ${
            status === "error" ? "bg-rose-50 text-rose-600" : "bg-teal-50 text-[#0F766E]"
          }`}
        >
          <Icon className={`h-6 w-6 ${status === "loading" ? "animate-spin" : ""}`} />
        </div>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-[#0F766E]">SSO Callback</p>
        <h1 className="mt-1 text-xl font-bold text-slate-950">Website Pusat</h1>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
      </section>
    </main>
  );
}
