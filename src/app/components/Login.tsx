import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { getRoleHomePath } from "../auth/navigation";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectPath = useMemo(() => searchParams.get("redirect") || "", [searchParams]);

  useEffect(() => {
    rememberLoginSourceFromPage(searchParams);
  }, [searchParams]);

  if (getAuthToken() && storedUser) {
    return <Navigate to={redirectPath || getRoleHomePath(storedUser)} replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await api.login({ email, password });
      saveAuthSession(response.token, response.user);
      let user = response.user;
      try {
        user = await refreshStoredUser(response.token);
      } catch {
        // Login response still carries role for the normal redirect path.
      }
      navigate(redirectPath || getRoleHomePath(user), { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login gagal. Periksa email dan password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-4 lg:grid-cols-[minmax(330px,400px)_1fr] xl:gap-5">
          <section className="relative z-10 mx-auto w-full max-w-[390px] rounded-lg border border-white/10 bg-[#101010] p-5 shadow-2xl shadow-black/60 sm:p-7">
            <div className="mb-7 flex justify-center">
              <div className="flex items-center gap-2">
                <img src="/img/LogoGm.png" alt="GMT Group" className="h-8 w-8 object-contain brightness-0 invert" />
                <div className="leading-none">
                  <p className="text-sm font-semibold tracking-tight text-white">gmt</p>
                  <p className="text-[10px] text-white/55">suite</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-xl font-semibold tracking-tight text-white">Masuk Website Pusat</h1>
              <p className="mt-2 text-xs leading-5 text-white/50">
                Gunakan akun backend untuk masuk sesuai role operasional.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/70">
                <ShieldCheck className="h-3.5 w-3.5" />
                {clientName}
              </span>
              <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/70">
                agent / sales / admin
              </span>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-3.5">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-white/55">Email</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                    className="h-10 w-full rounded-md border border-white/10 bg-white px-9 text-xs text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-white focus:ring-2 focus:ring-white/15"
                    placeholder="sales@example.com"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-white/55">Password</span>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    autoComplete="current-password"
                    className="h-10 w-full rounded-md border border-white/10 bg-white px-9 text-xs text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-white focus:ring-2 focus:ring-white/15"
                    placeholder="Password"
                    required
                  />
                </div>
              </label>

              {errorMessage && (
                <div className="rounded-md border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-100">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white px-4 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/40"
              >
                {isSubmitting ? "Memproses..." : "Masuk"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-white/45">
              Belum punya akun?{" "}
              <Link to="/register" className="font-semibold text-white hover:text-white/80">
                Register
              </Link>
            </p>
          </section>

          <section className="relative hidden min-h-[650px] overflow-hidden rounded-lg border border-white/10 bg-[#070707] lg:block">
            <img
              src="/img/login-event-collage.png"
              alt="GMT event production collage"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/50 to-transparent" />
          </section>

          <section className="overflow-hidden rounded-lg border border-white/10 bg-[#070707] lg:hidden">
            <img
              src="/img/login-event-collage.png"
              alt="GMT event production collage"
              className="h-52 w-full object-cover sm:h-72"
            />
          </section>
        </div>
      </div>
    </main>
  );
}
