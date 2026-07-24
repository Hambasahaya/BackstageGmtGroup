import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { AuthSuiteShell, SpinnerIcon } from "./AuthSuiteShell";
import { api } from "../services/api";

type ResetStep = "verify" | "password" | "success";

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<ResetStep>(searchParams.get("step") === "password" ? "password" : "verify");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validations = useMemo(() => ({
    minLength: newPassword.length >= 8,
    hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    hasUppercase: /[A-Z]/.test(newPassword),
  }), [newPassword]);
  const allCriteriaMet = Object.values(validations).every(Boolean);

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);
    try {
      const response = await api.verifyResetToken({ email: email.trim().toLowerCase(), token: token.trim() });
      setSuccessMessage(response.message || "Email dan kode berhasil diverifikasi.");
      setStep("password");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kode verifikasi tidak valid atau sudah kedaluwarsa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!allCriteriaMet) {
      setErrorMessage("Pastikan kata sandi memenuhi seluruh kriteria.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.resetPassword({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        new_password: newPassword,
      });
      setSuccessMessage(response.message || "Kata sandi berhasil diperbarui.");
      setStep("success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memperbarui kata sandi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <AuthSuiteShell mode="reset-password">
        <div className="flex flex-1 animate-in flex-col items-center justify-center text-center fade-in">
          <div className="mb-3 text-4xl text-emerald-500">?</div>
          <h1 className="text-xl font-medium text-white">Kata Sandi Diperbarui!</h1>
          <p className="mt-2 max-w-[300px] text-[13px] leading-5 text-[#888]">Kata sandi Anda berhasil diperbarui. Sekarang Anda dapat masuk menggunakan kata sandi baru.</p>
          {successMessage && <p className="mt-3 text-[11px] text-[#a4e2a6]">{successMessage}</p>}
          <button type="button" onClick={() => navigate("/login")} className="mt-6 w-[150px] rounded-[5px] border border-transparent bg-[#191a1d] px-4 py-2.5 text-xs font-medium text-white transition hover:border-white/30 hover:bg-white/[0.14]">Masuk</button>
        </div>
      </AuthSuiteShell>
    );
  }

  return (
    <AuthSuiteShell mode="reset-password">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-semibold leading-tight text-white">{step === "verify" ? "Verifikasi Email" : "Perbarui Kata Sandi"}</h1>
        <p className="text-[11px] font-normal text-[#6c6c6c]">{step === "verify" ? "Masukkan email dan kode reset yang dikirim ke email Anda." : "Verifikasi berhasil. Silakan buat kata sandi baru."}</p>
      </div>

      {step === "verify" ? (
        <form onSubmit={verifyCode} className="mt-10 flex flex-1 flex-col gap-[17px]">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-[#9a9a9a]">Alamat Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="w-full rounded-[5px] border border-[#e3e3e3] bg-white px-3 py-[9px] text-xs text-[#111] outline-none placeholder:text-[#555]" placeholder="m@contoh.com" required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-[#9a9a9a]">Kode Reset</span>
            <input value={token} onChange={(event) => setToken(event.target.value)} inputMode="numeric" autoComplete="one-time-code" className="w-full rounded-[5px] border border-[#e3e3e3] bg-white px-3 py-[9px] text-xs tracking-[0.2em] text-[#111] outline-none placeholder:tracking-normal placeholder:text-[#555]" placeholder="masukkan kode dari email" required />
          </label>
          {errorMessage && <p className="text-center text-[11px] text-[#ff8a8a]">{errorMessage}</p>}
          <button type="submit" disabled={isSubmitting} className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-[5px] border border-transparent bg-[#191a1d] px-4 py-2.5 text-xs font-medium text-white transition hover:border-white/30 hover:bg-white/[0.14] disabled:opacity-50">{isSubmitting ? <SpinnerIcon /> : "Verifikasi Kode"}</button>
        </form>
      ) : (
        <form onSubmit={updatePassword} className="mt-7 flex flex-1 flex-col gap-[14px]">
          {successMessage && <p className="text-center text-[11px] text-[#a4e2a6]">{successMessage}</p>}
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-[#9a9a9a]">Kata Sandi Baru</span>
            <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" autoComplete="new-password" className="w-full rounded-[5px] border border-[#e3e3e3] bg-white px-3 py-[9px] text-xs text-[#111] outline-none" placeholder="kata sandi baru" required />
          </label>
          <div className="rounded-md border border-white/5 bg-white/[0.02] px-3 py-2.5">
            <p className="mb-1.5 text-[11px] font-medium text-[#e2e2e2]">Kata sandi Anda harus berisi:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
              <Criterion valid={validations.minLength}>Minimal 8 karakter</Criterion>
              <Criterion valid={validations.hasNumber}>Setidaknya 1 angka</Criterion>
              <Criterion valid={validations.hasSpecial}>Setidaknya 1 karakter spesial</Criterion>
              <Criterion valid={validations.hasUppercase}>Setidaknya 1 huruf besar</Criterion>
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-[#9a9a9a]">Konfirmasi Kata Sandi</span>
            <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" className="w-full rounded-[5px] border border-[#e3e3e3] bg-white px-3 py-[9px] text-xs text-[#111] outline-none" placeholder="konfirmasi kata sandi baru" required />
          </label>
          {errorMessage && <p className="text-center text-[11px] text-[#ff8a8a]">{errorMessage}</p>}
          <button type="submit" disabled={isSubmitting || !allCriteriaMet} className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-[5px] border border-transparent bg-[#191a1d] px-4 py-2.5 text-xs font-medium text-white transition hover:border-white/30 hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? <SpinnerIcon /> : "Perbarui Kata Sandi"}</button>
        </form>
      )}

      <div className="mt-auto flex items-center justify-between pt-5">
        <Link to="/forgot-password" className="text-xs font-medium text-[#888] transition hover:text-white">? Minta kode baru</Link>
        <Link to="/login" className="text-xs font-medium text-white">Masuk</Link>
      </div>
    </AuthSuiteShell>
  );
}

function Criterion({ valid, children }: { valid: boolean; children: React.ReactNode }) {
  return <div className={`flex items-start gap-1 ${valid ? "font-medium text-emerald-500" : "text-[#6c6c6c]"}`}><span>•</span><span>{children}</span></div>;
}