import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { getRoleHomePath } from "../auth/navigation";
import { AuthSuiteShell, SpinnerIcon } from "./AuthSuiteShell";
import {
  api,
  getAuthToken,
  getStoredUser,
  refreshStoredUser,
  rememberLoginSourceFromPage,
  saveAuthSession,
  type UserSession,
} from "../services/api";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

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
  const rawRedirect = searchParams.get("redirect") || searchParams.get("source_url") || searchParams.get("return_url") || searchParams.get("origin_url");
  const redirectTarget = useMemo(() => rawRedirect || (targetClient ? `/sso/start?${searchParams.toString()}` : ""), [rawRedirect, targetClient, searchParams]);

  const performRedirect = (user: UserSession) => {
    const destination = redirectTarget || getRoleHomePath(user);
    if (/^https?:\/\//i.test(destination)) window.location.href = destination;
    else navigate(destination, { replace: true });
  };

  useEffect(() => rememberLoginSourceFromPage(searchParams), [searchParams]);

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
      try { user = await refreshStoredUser(response.token); } catch { /* login response remains valid */ }
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
        <h1 className="text-[27px] font-semibold leading-tight text-white">Login</h1>
        <p className="text-sm font-normal text-[#666]">Enter your email and password to continue</p>
      </div>

      <button
        type="button"
        onClick={() => setErrorMessage("Login Google belum tersedia pada API dashboard ini.")}
        className="mt-6 inline-flex h-[72px] w-full items-center justify-center gap-3 rounded-[6px] border border-[#dedede] bg-white text-base font-medium text-[#111] transition hover:bg-[#f2f2f2]"
      >
        <GoogleIcon /> Continue with Google
      </button>

      <div className="my-[27px] flex items-center gap-5">
        <div className="h-px flex-1 bg-[#d4d4d4]" />
        <span className="text-sm text-[#777]">Or</span>
        <div className="h-px flex-1 bg-[#d4d4d4]" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-[22px]">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-normal text-[#9a9a9a]">Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" className="h-[48px] w-full rounded-[6px] border border-[#e3e3e3] bg-white px-4 text-base text-[#111] outline-none placeholder:text-[#666] focus:border-white" placeholder="m@example.com" required />
        </label>

        <label className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-normal text-[#9a9a9a]">Password</span>
            <Link to="/forgot-password" className="text-sm font-normal text-[#6c6c6c] transition hover:text-white">Forgot password?</Link>
          </div>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" className="h-[48px] w-full rounded-[6px] border border-[#e3e3e3] bg-white px-4 text-base text-[#111] outline-none placeholder:text-[#555] focus:border-white" placeholder="********" required />
        </label>

        {errorMessage && <p className="-my-1 text-center text-xs leading-snug text-[#ff8a8a]">{errorMessage}</p>}

        <button type="submit" disabled={isSubmitting} className="mt-1 inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-[6px] border border-transparent bg-[#191a1d] px-4 text-base font-medium text-white transition hover:border-white/30 hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? <SpinnerIcon /> : "Login"}
        </button>
      </form>

      <Link to="/register" className="mt-[45px] self-center px-3 py-3 text-base font-semibold text-[#e7e7e7] transition hover:text-white">
        <span className="mr-3">?</span> Back to register
      </Link>
    </AuthSuiteShell>
  );
}