import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getRoleHomePath } from "../auth/navigation";
import {
  api,
  getAuthToken,
  refreshStoredUser,
  rememberDefaultLoginSource,
  rememberLoginSourceFromPage,
  saveAuthSession,
  type UserSession,
} from "../services/api";

export function MyGmtEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Membuka MyGMT...");

  useEffect(() => {
    let isActive = true;

    const continueToMyGmt = async () => {
      rememberLoginSourceFromPage(searchParams);
      rememberDefaultLoginSource();

      const token = getAuthToken();

      if (!token) {
        navigate(`/register?redirect=${encodeURIComponent("/apply-agent")}`, { replace: true });
        return;
      }

      try {
        setMessage("Memeriksa session MyGMT...");
        const session = await api.session();

        if (!isActive) {
          return;
        }

        if (!session.authenticated) {
          navigate(`/register?redirect=${encodeURIComponent("/apply-agent")}`, { replace: true });
          return;
        }

        saveAuthSession(token, session.user as UserSession);

        let user = session.user;
        try {
          user = await refreshStoredUser(token);
        } catch {
          // Session response is enough for a role-based fallback.
        }

        navigate(getRoleHomePath(user), { replace: true });
      } catch {
        if (isActive) {
          navigate(`/register?redirect=${encodeURIComponent("/apply-agent")}`, { replace: true });
        }
      }
    };

    void continueToMyGmt();

    return () => {
      isActive = false;
    };
  }, [navigate, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4 text-slate-900">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-[#0F766E]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-[#0F766E]">MyGMT</p>
        <h1 className="mt-1 text-xl font-bold text-slate-950">Website Pusat</h1>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
      </section>
    </main>
  );
}
