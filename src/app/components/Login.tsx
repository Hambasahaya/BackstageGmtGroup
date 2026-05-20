import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <div className="hidden w-1/2 flex-col justify-between bg-[#0F766E] p-12 text-white lg:flex">
        <div>
          <div className="mb-8 flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white p-3">
              <img src="/img/LogoGm.png" alt="GMT Group" className="h-full w-full object-contain brightness-0" />
            </div>
            <div>
              <p className="text-4xl font-semibold leading-tight">GMT Group</p>
              <p className="text-lg text-teal-50">Central Dashboard</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8">
              <img src="/img/LogoGm.png" alt="GMT Group" className="mb-6 h-14 w-auto object-contain brightness-0" />
              <h2 className="mb-2 text-3xl font-bold text-slate-950">Masuk Dashboard</h2>
              <p className="text-slate-500">Gunakan akun GMT Group untuk melanjutkan.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@gmtgroup.id"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
                  />
                  <span className="ml-2 text-sm text-slate-600">Ingat saya</span>
                </label>
                <a href="#" className="text-sm font-medium text-[#0F766E] hover:underline">
                  Lupa password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#0F766E] py-3 font-semibold text-white shadow-sm transition hover:bg-[#115E59]"
              >
                Masuk
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            (c) 2026 GMT Group Central Dashboard. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
