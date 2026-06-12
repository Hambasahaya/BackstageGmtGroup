import { FileImage, Send, UserPlus } from "lucide-react";
import { useState } from "react";
import { api, getAuthToken, getStoredUser, saveAuthSession, type AgentVerificationPayload, type ApplyAgentPayload } from "../services/api";

const applyInitial: ApplyAgentPayload = {
  job: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  agent_program_type: "pekerjaan_utama",
  agent_motivation: "",
  referral_source: "sosmed_moxlite",
  referral_name: "",
  referral_other: "",
  target_product: "",
};

const verificationInitial: AgentVerificationPayload = {
  photo: "",
  ktp_photo: "",
  bank_name: "",
  account_number: "",
  ttl: "",
  full_address: "",
  domicile: "",
};

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
        placeholder={placeholder}
        required
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 w-full resize-y rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
        placeholder={placeholder}
        required
      />
    </label>
  );
}

export function ApplyAgent() {
  const storedUser = getStoredUser();
  const status = storedUser?.detail_user?.status ?? null;
  const [applyForm, setApplyForm] = useState<ApplyAgentPayload>(applyInitial);
  const [verificationForm, setVerificationForm] = useState<AgentVerificationPayload>(verificationInitial);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApplySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response = await api.applyAgent(applyForm);
      const session = await api.me();
      saveAuthSession(getAuthToken() ?? "", session.user);
      setSuccessMessage(response.message || "Pengajuan agent berhasil dikirim.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal mengirim pengajuan agent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response = await api.completeAgentVerification(verificationForm);
      const token = localStorage.getItem("gmt-auth-token") ?? "";
      saveAuthSession(token, response.user);
      setSuccessMessage(response.message || "Data verifikasi berhasil dilengkapi.");
      setVerificationForm(verificationInitial);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal melengkapi data verifikasi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">User</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Apply menjadi Moxlite Agent</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Pengajuan awal cukup berisi pekerjaan, sosial media, alasan, sumber informasi, dan target produk.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-semibold text-[#0F766E] ring-1 ring-teal-200">
          <UserPlus className="h-4 w-4" />
          Status: {status ?? "belum apply"}
        </div>
      </div>

      {errorMessage && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{errorMessage}</div>}
      {successMessage && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{successMessage}</div>}

      {status === "official_agent" ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium text-emerald-800">
          Akun kamu sudah menjadi official agent. Fitur agent penuh sudah tersedia di menu.
        </section>
      ) : status === "verif" ? (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-950">Lengkapi data verifikasi</h2>
            <p className="mt-1 text-sm text-slate-500">Isi data ini setelah admin mengubah status pengajuan menjadi verif.</p>
          </div>
          <form onSubmit={handleVerificationSubmit} className="space-y-5 p-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TextField label="Path foto" value={verificationForm.photo} onChange={(value) => setVerificationForm((current) => ({ ...current, photo: value }))} placeholder="uploads/users/photo.jpg" />
              <TextField label="Path KTP" value={verificationForm.ktp_photo} onChange={(value) => setVerificationForm((current) => ({ ...current, ktp_photo: value }))} placeholder="uploads/users/ktp.jpg" />
              <TextField label="Nama bank" value={verificationForm.bank_name} onChange={(value) => setVerificationForm((current) => ({ ...current, bank_name: value }))} placeholder="BCA" />
              <TextField label="Nomor rekening" value={verificationForm.account_number} onChange={(value) => setVerificationForm((current) => ({ ...current, account_number: value }))} placeholder="1234567890" />
              <TextField label="Tempat tanggal lahir" value={verificationForm.ttl} onChange={(value) => setVerificationForm((current) => ({ ...current, ttl: value }))} placeholder="Jakarta, 10 Januari 2000" />
              <TextField label="Domisili" value={verificationForm.domicile ?? ""} onChange={(value) => setVerificationForm((current) => ({ ...current, domicile: value }))} placeholder="Jakarta" />
            </div>
            <TextArea label="Alamat lengkap" value={verificationForm.full_address} onChange={(value) => setVerificationForm((current) => ({ ...current, full_address: value }))} placeholder="Jl. Contoh No. 10" />
            <div className="flex justify-end border-t border-slate-200 pt-5">
              <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-400">
                <FileImage className="h-4 w-4" />
                {isSubmitting ? "Menyimpan..." : "Simpan data verifikasi"}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-950">Data pengajuan awal</h2>
            <p className="mt-1 text-sm text-slate-500">Setelah dikirim, status detail user menjadi not_verif.</p>
          </div>
          <form onSubmit={handleApplySubmit} className="space-y-5 p-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TextField label="Pekerjaan" value={applyForm.job} onChange={(value) => setApplyForm((current) => ({ ...current, job: value }))} placeholder="Sales Executive" />
              <TextField label="Instagram" value={applyForm.instagram} onChange={(value) => setApplyForm((current) => ({ ...current, instagram: value }))} placeholder="user.ig" />
              <TextField label="TikTok" value={applyForm.tiktok} onChange={(value) => setApplyForm((current) => ({ ...current, tiktok: value }))} placeholder="user.tt" />
              <TextField label="Facebook" value={applyForm.facebook} onChange={(value) => setApplyForm((current) => ({ ...current, facebook: value }))} placeholder="User FB" />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Program ini sebagai</p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  ["pekerjaan_utama", "Pekerjaan utama"],
                  ["pekerjaan_sampingan", "Pekerjaan sampingan"],
                ].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <input type="radio" checked={applyForm.agent_program_type === value} onChange={() => setApplyForm((current) => ({ ...current, agent_program_type: value }))} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <TextArea label="Alasan ingin menjadi Moxlite Agent" value={applyForm.agent_motivation} onChange={(value) => setApplyForm((current) => ({ ...current, agent_motivation: value }))} placeholder="Ceritakan alasan kamu..." />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Mengetahui program ini dari siapa?</span>
                <select value={applyForm.referral_source} onChange={(event) => setApplyForm((current) => ({ ...current, referral_source: event.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100">
                  <option value="sosmed_moxlite">Sosmed Moxlite</option>
                  <option value="tim_sales_gmt">Tim sales GMT</option>
                  <option value="website_gmt">Website GMT</option>
                  <option value="teman_kerabat">Teman/kerabat</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </label>
              {applyForm.referral_source === "teman_kerabat" && <TextField label="Nama teman/kerabat" value={applyForm.referral_name ?? ""} onChange={(value) => setApplyForm((current) => ({ ...current, referral_name: value }))} placeholder="Nama referensi" />}
              {applyForm.referral_source === "lainnya" && <TextField label="Sumber lainnya" value={applyForm.referral_other ?? ""} onChange={(value) => setApplyForm((current) => ({ ...current, referral_other: value }))} placeholder="Isi sumber informasi" />}
            </div>

            <TextField label="Produk apa yang anda targetkan?" value={applyForm.target_product} onChange={(value) => setApplyForm((current) => ({ ...current, target_product: value }))} placeholder="Contoh: lighting, sound system, event equipment" />

            <div className="flex justify-end border-t border-slate-200 pt-5">
              <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-400">
                <Send className="h-4 w-4" />
                {isSubmitting ? "Mengirim..." : "Kirim pengajuan"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
