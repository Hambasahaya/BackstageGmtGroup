import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { AuthSuiteShell, SpinnerIcon } from "./AuthSuiteShell";
import { api } from "../services/api";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response = await api.forgotPassword({ email });
      setSuccessMessage(response.message || "Reset token sent successfully! Checking email...");
      
      // Delay navigation slightly so they can read the success message
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to send reset token. Please check your email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthSuiteShell mode="forgot-password">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-semibold leading-tight text-white">Forgot Password</h1>
        <p className="text-[11px] font-normal text-[#6c6c6c]">
          Enter your email to receive a password reset token
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 flex flex-1 flex-col gap-[17px]">
        <div className="h-6" />

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-normal text-[#9a9a9a]">Email Address</span>
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

        {errorMessage && <p className="-mt-1 text-[11px] leading-snug text-[#ff8a8a]">{errorMessage}</p>}
        {successMessage && <p className="-mt-1 text-[11px] leading-snug text-[#8aff8a]">{successMessage}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-[5px] border border-transparent bg-[#191a1d] px-4 py-2.5 text-xs font-medium text-white transition hover:border-white/30 hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <SpinnerIcon /> : "Send Reset Token"}
        </button>
      </form>

      <div className="mt-auto flex justify-end pt-6">
        <Link to="/login" className="text-xs font-medium text-[#e7e7e7] transition hover:text-white">
          Login
        </Link>
      </div>
    </AuthSuiteShell>
  );
}
