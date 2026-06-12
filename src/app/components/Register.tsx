import { ArrowRight, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { getRoleHomePath } from "../auth/navigation";
import {
  api,
  getAuthToken,
  getStoredUser,
  refreshStoredUser,
  rememberLoginSourceFromPage,
  saveAuthSession,
} from "../services/api";

type RegisterForm = {
  name: string;
  phone_number: string;
  email: string;
  password: string;
};

const initialForm: RegisterForm = {
  name: "",
  phone_number: "",
  email: "",
  password: "",
};

function Field({
  label,
  name,
  value,
  onChange,
  icon: Icon,
  type = "text",
  placeholder,
}: {
  label: string;
  name: keyof RegisterForm;
  value: string;
  onChange: (name: keyof RegisterForm, value: string) => void;
  icon: typeof UserRound;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-white/55">{label}</span>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
        <input
          value={value}
          onChange={(event) => onChange(name, event.target.value)}
          type={type}
          className="h-10 w-full rounded-md border border-white/10 bg-white px-9 text-xs text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-white focus:ring-2 focus:ring-white/15"
          placeholder={placeholder}
          required
        />
      </div>
    </label>
  );
}

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storedUser = getStoredUser();
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectPath = searchParams.get("redirect") || "";
  const loginPath = redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : "/login";

  useEffect(() => {
    rememberLoginSourceFromPage(searchParams);
  }, [searchParams]);

  if (getAuthToken() && storedUser) {
    return <Navigate to={getRoleHomePath(storedUser)} replace />;
  }

  const updateForm = (name: keyof RegisterForm, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const normalizedForm: RegisterForm = {
      name: form.name.trim(),
      phone_number: form.phone_number.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };

    try {
      await api.register(normalizedForm);
      const loginResponse = await api.login({
        email: normalizedForm.email,
        password: normalizedForm.password,
      });
      saveAuthSession(loginResponse.token, loginResponse.user);
      try {
        await refreshStoredUser(loginResponse.token);
      } catch {
        // New users can continue with the login response if profile details are not available yet.
      }
      setSuccessMessage("Register berhasil. Mengarahkan ke apply agent...");
      navigate("/apply-agent", { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Register atau auto login gagal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-4 lg:grid-cols-[minmax(330px,400px)_1fr] xl:gap-5">
          <section className="relative z-10 mx-auto w-full max-w-[390px] rounded-lg border border-white/10 bg-[#101010] p-5 shadow-2xl shadow-black/60 sm:p-7">
            <div className="mb-7 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <img src="/img/LogoGm.png" alt="GMT Group" className="h-8 w-8 object-contain brightness-0 invert" />
                <div className="leading-none">
                  <p className="text-sm font-semibold tracking-tight text-white">gmt</p>
                  <p className="text-[10px] text-white/55">suite</p>
                </div>
              </div>
              <Link to={loginPath} className="rounded-md border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white/70 hover:bg-white/[0.04]">
                Login
              </Link>
            </div>

            <div className="text-center">
              <h1 className="text-xl font-semibold tracking-tight text-white">Create an account</h1>
              <p className="mt-2 text-xs leading-5 text-white/50">
                Isi data utama untuk membuat akun Website Pusat.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-3.5">
              <Field label="Nama" name="name" value={form.name} onChange={updateForm} icon={UserRound} placeholder="Nama lengkap" />
              <Field label="No HP" name="phone_number" value={form.phone_number} onChange={updateForm} icon={Phone} placeholder="081234567890" />

              <Field label="Email" name="email" value={form.email} onChange={updateForm} icon={Mail} type="email" placeholder="user@example.com" />
              <Field label="Password" name="password" value={form.password} onChange={updateForm} icon={LockKeyhole} type="password" placeholder="Password" />

              {errorMessage && (
                <div className="rounded-md border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-100">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-100">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white px-4 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/40"
              >
                {isSubmitting ? "Memproses..." : "Create account"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          </section>

          <section className="relative hidden min-h-[650px] overflow-hidden rounded-lg border border-white/10 bg-[#070707] lg:block">
            <img src="/img/login-event-collage.png" alt="GMT event production collage" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/50 to-transparent" />
          </section>
        </div>
      </div>
    </main>
  );
}
