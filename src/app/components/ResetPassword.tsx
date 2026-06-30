import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { AuthSuiteShell, SpinnerIcon } from "./AuthSuiteShell";
import { api } from "../services/api";

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Password Validation Criteria
  const validations = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasNumber: /\d/.test(newPassword),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      hasUppercase: /[A-Z]/.test(newPassword),
    };
  }, [newPassword]);

  const allCriteriaMet = Object.values(validations).every(Boolean);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email) {
      setErrorMessage("Email is required.");
      return;
    }
    if (!token) {
      setErrorMessage("Verification token is required.");
      return;
    }
    if (!allCriteriaMet) {
      setErrorMessage("Please satisfy all password requirements.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.resetPassword({
        email,
        token,
        new_password: newPassword,
      });

      setSuccessMessage(response.message || "Password updated successfully! Redirecting to login...");
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to reset password. Please check your token.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthSuiteShell mode="reset-password">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-semibold leading-tight text-white">Update Password</h1>
        <p className="text-[11px] font-normal text-[#6c6c6c]">
          Please fill the form below to update the password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-1 flex-col gap-[15px]">
        {/* Email Field */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-normal text-[#9a9a9a]">Email Address</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            disabled={!!emailParam}
            className="w-full rounded-[5px] border border-[#e3e3e3] bg-white px-3 py-[9px] text-xs text-[#111] outline-none transition placeholder:text-[#555] focus:border-white disabled:bg-neutral-800 disabled:text-neutral-400 disabled:border-neutral-700"
            placeholder="m@example.com"
            required
          />
        </label>

        {/* Verification Token Field (labeled Current Password in mockup, but mapped to backend token) */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-normal text-[#9a9a9a]">Verification Code / Token</span>
          <input
            value={token}
            onChange={(event) => setToken(event.target.value)}
            type="text"
            className="w-full rounded-[5px] border border-[#e3e3e3] bg-white px-3 py-[9px] text-xs text-[#111] outline-none transition placeholder:text-[#555] focus:border-white"
            placeholder="new password" // matching placeholder in mockup
            required
          />
        </label>

        {/* New Password Field */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-normal text-[#9a9a9a]">New Password</span>
          <input
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            type="password"
            className="w-full rounded-[5px] border border-[#e3e3e3] bg-white px-3 py-[9px] text-xs text-[#111] outline-none transition placeholder:text-[#555] focus:border-white"
            placeholder="confirm new password" // matching placeholder in mockup
            required
          />
        </label>

        {/* Dynamic Criteria List */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-normal text-[#9a9a9a]">Your password must contain:</span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
            <div className={`flex items-center gap-1 transition ${validations.minLength ? "text-emerald-400" : "text-[#6c6c6c]"}`}>
              <span>•</span>
              <span>A minimum of 8 characters.</span>
            </div>
            <div className={`flex items-center gap-1 transition ${validations.hasNumber ? "text-emerald-400" : "text-[#6c6c6c]"}`}>
              <span>•</span>
              <span>At least one number</span>
            </div>
            <div className={`flex items-center gap-1 transition ${validations.hasSpecial ? "text-emerald-400" : "text-[#6c6c6c]"}`}>
              <span>•</span>
              <span>At least 1 special character</span>
            </div>
            <div className={`flex items-center gap-1 transition ${validations.hasUppercase ? "text-emerald-400" : "text-[#6c6c6c]"}`}>
              <span>•</span>
              <span>At least one uppercase letter</span>
            </div>
          </div>
        </div>

        {/* Confirm Password Field */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-normal text-[#9a9a9a]">Confirm Password</span>
          <input
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            type="password"
            className="w-full rounded-[5px] border border-[#e3e3e3] bg-white px-3 py-[9px] text-xs text-[#111] outline-none transition placeholder:text-[#555] focus:border-white"
            placeholder="confirm new password" // matching placeholder in mockup
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
          {isSubmitting ? <SpinnerIcon /> : "Update Password"}
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
