import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AuthSuiteShell, SpinnerIcon } from "./AuthSuiteShell";
import { api } from "../services/api";

const requestStorageKey = "gmt_last_code_request_time";
const requestCooldownSeconds = 120;

function getRemainingCooldown() {
  const lastRequest = Number(window.localStorage.getItem(requestStorageKey) || 0);
  return lastRequest ? Math.max(0, requestCooldownSeconds - Math.floor((Date.now() - lastRequest) / 1000)) : 0;
}

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(getRemainingCooldown);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(() => setCountdown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [countdown > 0]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();
    try {
      const response = await api.forgotPassword({ email: normalizedEmail });
      window.localStorage.setItem(requestStorageKey, String(Date.now()));
      setCountdown(requestCooldownSeconds);
      setSuccessMessage(response.message || "Kode reset telah dikirim ke email Anda.");
      window.setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(normalizedEmail)}&step=verify`);
      }, 900);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal mengirim kode reset. Periksa alamat email Anda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const countdownLabel = `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}`;

  return (
    <AuthSuiteShell mode="forgot-password">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-semibold leading-tight text-white">Lupa Kata Sandi</h1>
        <p className="text-[11px] font-normal text-[#6c6c6c]">Masukkan alamat email Anda untuk meminta kode reset.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 flex flex-1 flex-col gap-[17px]">
        <div className="h-6" />
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-normal text-[#9a9a9a]">Alamat Email</span>
          <input
            value={email}
            onChange={(event) => { setEmail(event.target.value); setErrorMessage(""); }}
            type="email"
            autoComplete="email"
            className="w-full rounded-[5px] border border-[#e3e3e3] bg-white px-3 py-[9px] text-xs text-[#111] outline-none transition placeholder:text-[#555] focus:border-white"
            placeholder="m@contoh.com"
            required
          />
        </label>

        {errorMessage && <p className="text-center text-[11px] leading-snug text-[#ff8a8a]">{errorMessage}</p>}
        {successMessage && <p className="text-center text-[11px] leading-snug text-[#a4e2a6]">{successMessage}</p>}

        <button
          type="submit"
          disabled={isSubmitting || countdown > 0}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-[5px] border border-transparent bg-[#191a1d] px-4 py-2.5 text-xs font-medium text-white transition hover:border-white/30 hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? <SpinnerIcon /> : countdown > 0 ? `Kirim Kode Reset (${countdownLabel})` : "Kirim Kode Reset"}
        </button>
      </form>

      <div className="mt-auto flex items-center justify-between pt-6">
        <Link to="/reset-password?step=verify" className="text-xs font-medium text-[#888] transition hover:text-white">Saya punya kode ?</Link>
        <Link to="/login" className="text-xs font-medium text-white transition hover:text-[#ddd]">Masuk</Link>
      </div>
    </AuthSuiteShell>
  );
}