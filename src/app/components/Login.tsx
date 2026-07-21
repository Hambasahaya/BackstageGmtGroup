import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { getRoleHomePath } from "../auth/navigation";
import { AuthSuiteShell, SpinnerIcon } from "./AuthSuiteShell";
import {
  api,
  clientName,
  getAuthToken,
  getStoredUser,
  refreshStoredUser,
  rememberLoginSourceFromPage,
  saveAuthSession,
} from "../services/api";

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storedUser = getStoredUser();
  const token = getAuthToken();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetClient = searchParams.get("target_client") || searchParams.get("client");
  const rawRedirect =
    searchParams.get("redirect") ||
    searchParams.get("source_url") ||
    searchParams.get("return_url") ||
    searchParams.get("origin_url");

  const redirectTarget = useMemo(() => {
    if (rawRedirect) {
      return rawRedirect;
    }
    if (targetClient) {
      return `/sso/start?${searchParams.toString()}`;
    }
    return "";
  }, [rawRedirect, targetClient, searchParams]);

  const performRedirect = (user: UserSession) => {
    const destination = redirectTarget || getRoleHomePath(user);
    if (/^https?:\/\//i.test(destination)) {
      window.location.href = destination;
    } else {
      navigate(destination, { replace: true });
    }
  };

  useEffect(() => {
    rememberLoginSourceFromPage(searchParams);
  }, [searchParams]);

  if (token && storedUser) {
    performRedirect(storedUser);
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await api.login({ email, password });
      saveAuthSession(response.token, response.user, response.refresh_token);
      let user = response.user;
      try {
        user = await refreshStoredUser(response.token);
      } catch {
        // Login response still carries role for the normal redirect path.
      }
      performRedirect(user);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login gagal. Periksa email dan password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthSuiteShell mode="login">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-semibold leading-tight text-white">Login</h1>
        <p className="text-[11px] font-normal text-[#6c6c6c]">
          Enter your email and password to continue
        </p>
        <p className="text-[11px] font-normal text-[#6c6c6c]">{clientName}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 flex flex-1 flex-col gap-[17px]">
        <div className="h-6" />

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-normal text-[#9a9a9a]">Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            className="w-full rounded-[5px] border border-[#e3e3e3] bg-white px-3 py-[9px] text-xs text-[#111] outline-none transition placeholder:text-[#555] focus:border-white"
            placeholder="m@example.com"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-normal text-[#9a9a9a]">Password</span>
            <Link
              to="/forgot-password"
              className="text-[11px] font-normal text-[#9a9a9a] transition hover:text-white"
            >
              Forgot Password?
            </Link>
          </div>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            className="w-full rounded-[5px] border border-[#e3e3e3] bg-white px-3 py-[9px] text-xs text-[#111] outline-none transition placeholder:text-[#555] focus:border-white"
            placeholder="********"
            required
          />
        </label>

        {errorMessage && <p className="-mt-1 text-[11px] leading-snug text-[#ff8a8a]">{errorMessage}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-[5px] border border-transparent bg-[#191a1d] px-4 py-2.5 text-xs font-medium text-white transition hover:border-white/30 hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <SpinnerIcon /> : "Login"}
        </button>
      </form>

      <Link
        to="/register"
        className="mt-3 self-center px-3 py-3 text-xs font-medium text-[#e7e7e7] transition hover:text-white"
      >
        <span className="mr-1.5">&lt;-</span> Back to register
      </Link>
    </AuthSuiteShell>
  );
}
