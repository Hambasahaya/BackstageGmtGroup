import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { getRoleHomePath } from "../auth/navigation";
import { AuthSuiteShell, SpinnerIcon } from "./AuthSuiteShell";
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
  type = "text",
  placeholder,
}: {
  label: string;
  name: keyof RegisterForm;
  value: string;
  onChange: (name: keyof RegisterForm, value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-normal text-[#9a9a9a]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        type={type}
        className="w-full rounded-[5px] border border-[#e3e3e3] bg-white px-3 py-[9px] text-xs text-[#111] outline-none transition placeholder:text-[#555] focus:border-white"
        placeholder={placeholder}
        required
      />
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
    <AuthSuiteShell mode="register">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-semibold leading-tight text-white">Create an account</h1>
        <p className="text-[11px] font-normal text-[#6c6c6c]">
          Enter your email below to create your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-1 flex-col gap-[17px]">
        <div className="grid gap-[18px] sm:grid-cols-2">
          <Field label="Name" name="name" value={form.name} onChange={updateForm} placeholder="eg. User Baru" />
          <Field label="Phone Number" name="phone_number" value={form.phone_number} onChange={updateForm} placeholder="081234567890" />
        </div>

        <Field label="Email" name="email" value={form.email} onChange={updateForm} type="email" placeholder="m@example.com" />
        <Field label="Password" name="password" value={form.password} onChange={updateForm} type="password" placeholder="********" />

        {errorMessage && <p className="-mt-1 text-[11px] leading-snug text-[#ff8a8a]">{errorMessage}</p>}
        {successMessage && <p className="-mt-1 text-[11px] leading-snug text-emerald-300">{successMessage}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-[5px] border border-transparent bg-[#191a1d] px-4 py-2.5 text-xs font-medium text-white transition hover:border-white/30 hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <SpinnerIcon /> : "Create account"}
        </button>
      </form>

      <Link
        to={loginPath}
        className="mt-3 self-center px-3 py-3 text-xs font-medium text-[#e7e7e7] transition hover:text-white"
      >
        Back to login <span className="ml-1.5">-&gt;</span>
      </Link>
    </AuthSuiteShell>
  );
}
