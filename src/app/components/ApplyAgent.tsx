import { AlertCircle, CheckCircle2, Clock3, FileImage, Send, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  api,
  getAuthToken,
  getStoredUser,
  refreshStoredUser,
  saveAuthSession,
  type AgentApplicationStatus,
  type ApplyAgentPayload,
  type DetailUserDto,
} from "../services/api";

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

type VerificationForm = {
  photo: File | null;
  ktp_photo: File | null;
  bank_name: string;
  account_number: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  full_address: string;
  domicile: string;
};

type FeedbackDialog = {
  type: "success" | "error";
  title: string;
  message: string;
};

const verificationInitial: VerificationForm = {
  photo: null,
  ktp_photo: null,
  bank_name: "",
  account_number: "",
  tempat_lahir: "",
  tanggal_lahir: "",
  full_address: "",
  domicile: "",
};

function TextField({
  label,
  value,
  onChange,
  placeholder,
  list,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  list?: string;
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
        list={list}
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

function FileField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: File | null;
  onChange: (value: File | null) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#0F766E] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
        required
      />
      {value && <span className="mt-1 block text-xs text-slate-500">{value.name}</span>}
    </label>
  );
}

function hasCompletedVerification(detailUser: DetailUserDto | undefined) {
  return Boolean(
    detailUser?.photo &&
      detailUser.ktp_photo &&
      detailUser.bank_name &&
      detailUser.account_number &&
      detailUser.full_address,
  );
}

function WaitingCta({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-amber-700 ring-1 ring-amber-200">
          <Clock3 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-amber-950">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-amber-800">{description}</p>
        </div>
      </div>
    </section>
  );
}

function FeedbackModal({
  feedback,
  onClose,
}: {
  feedback: FeedbackDialog;
  onClose: () => void;
}) {
  const isSuccess = feedback.type === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl ring-1 ring-black/5">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                isSuccess ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-950">{feedback.title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{feedback.message}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex justify-end p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59]"
          >
            Oke
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApplyAgent() {
  const storedUser = getStoredUser();
  const [status, setStatus] = useState<AgentApplicationStatus | null>(storedUser?.detail_user?.status ?? null);
  const [isVerificationCompleted, setIsVerificationCompleted] = useState(hasCompletedVerification(storedUser?.detail_user));
  const [applyForm, setApplyForm] = useState<ApplyAgentPayload>(applyInitial);
  const [verificationForm, setVerificationForm] = useState<VerificationForm>(verificationInitial);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [feedbackDialog, setFeedbackDialog] = useState<FeedbackDialog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regions, setRegions] = useState<{ id: string; regency: string }[]>([]);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/Caknoooo/provinces-cities-indonesia/master/json/regencies.json")
      .then((res) => res.json())
      .then((data) => setRegions(data))
      .catch(() => {});
  }, []);

  const syncLatestStatus = useCallback(async () => {
    try {
      const latestUser = await refreshStoredUser();
      setStatus(latestUser.detail_user?.status ?? null);
      setIsVerificationCompleted(hasCompletedVerification(latestUser.detail_user));
    } catch {
    }
  }, []);

  useEffect(() => {
    void syncLatestStatus();

    const syncWhenVisible = () => {
      if (!document.hidden) {
        void syncLatestStatus();
      }
    };

    const intervalId = window.setInterval(syncLatestStatus, 30000);
    window.addEventListener("focus", syncLatestStatus);
    document.addEventListener("visibilitychange", syncWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncLatestStatus);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, [syncLatestStatus]);

  const handleApplySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      if (!verificationForm.photo || !verificationForm.ktp_photo) {
        throw new Error("Foto diri dan foto KTP wajib diupload.");
      }

      const response = await api.applyAgent(applyForm);
      const verificationResponse = await api.completeAgentVerification({
        photo: verificationForm.photo,
        ktp_photo: verificationForm.ktp_photo,
        bank_name: verificationForm.bank_name,
        account_number: verificationForm.account_number,
        full_address: verificationForm.full_address,
        domicile: verificationForm.domicile,
        ttl: `${verificationForm.tempat_lahir}, ${verificationForm.tanggal_lahir}`,
      });

      saveAuthSession(getAuthToken() ?? "", verificationResponse.user);
      setStatus(verificationResponse.user.detail_user?.status ?? "verif");
      setIsVerificationCompleted(true);
      setApplyForm(applyInitial);
      setVerificationForm(verificationInitial);
      const message = response.message || verificationResponse.message || "Pengajuan dan data verifikasi berhasil dikirim.";
      setSuccessMessage(message);
      setFeedbackDialog({
        type: "success",
        title: "Upload berhasil",
        message: `${message} Status halaman sudah diperbarui.`,
      });
      void syncLatestStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengirim pengajuan agent.";
      setErrorMessage(message);
      setFeedbackDialog({ type: "error", title: "Upload gagal", message });
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
      if (!verificationForm.photo || !verificationForm.ktp_photo) {
        throw new Error("Foto dan KTP wajib diupload.");
      }
      const response = await api.completeAgentVerification({
        photo: verificationForm.photo,
        ktp_photo: verificationForm.ktp_photo,
        bank_name: verificationForm.bank_name,
        account_number: verificationForm.account_number,
        full_address: verificationForm.full_address,
        domicile: verificationForm.domicile,
        ttl: `${verificationForm.tempat_lahir}, ${verificationForm.tanggal_lahir}`,
      });
      const token = localStorage.getItem("gmt-auth-token") ?? "";
      saveAuthSession(token, response.user);
      setStatus(response.user.detail_user?.status ?? "verif");
      setIsVerificationCompleted(true);
      const message = response.message || "Data verifikasi berhasil dilengkapi.";
      setSuccessMessage(message);
      setFeedbackDialog({
        type: "success",
        title: "Upload berhasil",
        message: `${message} Status halaman sudah diperbarui.`,
      });
      setVerificationForm(verificationInitial);
      void syncLatestStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal melengkapi data verifikasi.";
      setErrorMessage(message);
      setFeedbackDialog({ type: "error", title: "Upload gagal", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <datalist id="indonesia-regions">
        {regions.map((region) => (
          <option key={region.id} value={region.regency} />
        ))}
      </datalist>

      {feedbackDialog && <FeedbackModal feedback={feedbackDialog} onClose={() => setFeedbackDialog(null)} />}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">User</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Apply menjadi Moxlite Agent</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Isi data pengajuan dan verifikasi dalam satu langkah agar admin bisa langsung meninjau kelengkapan agent.
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
      ) : status === "not_verif" ? (
        <WaitingCta
          title="Menunggu verifikasi admin"
          description="Pengajuan awal kamu sudah masuk. Tim admin akan mengecek data terlebih dahulu sebelum membuka tahap upload data verifikasi."
        />
      ) : status === "verif" ? (
        isVerificationCompleted ? (
          <WaitingCta
            title="Menunggu aktivasi official agent"
            description="Data verifikasi kamu sudah lengkap dan sedang ditinjau. Setelah admin menyetujui, status akan berubah menjadi official_agent."
          />
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-950">Lengkapi data verifikasi</h2>
              <p className="mt-1 text-sm text-slate-500">Isi data ini setelah admin mengubah status pengajuan menjadi verif.</p>
            </div>
            <form onSubmit={handleVerificationSubmit} className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <FileField label="Foto diri" value={verificationForm.photo} onChange={(value) => setVerificationForm((current) => ({ ...current, photo: value }))} />
                <FileField label="Foto KTP" value={verificationForm.ktp_photo} onChange={(value) => setVerificationForm((current) => ({ ...current, ktp_photo: value }))} />
                <TextField label="Nama bank" value={verificationForm.bank_name} onChange={(value) => setVerificationForm((current) => ({ ...current, bank_name: value }))} placeholder="BCA" />
                <TextField label="Nomor rekening" value={verificationForm.account_number} onChange={(value) => setVerificationForm((current) => ({ ...current, account_number: value }))} placeholder="1234567890" />
                <TextField label="Tempat lahir" value={verificationForm.tempat_lahir} onChange={(value) => setVerificationForm((current) => ({ ...current, tempat_lahir: value }))} placeholder="Jakarta" list="indonesia-regions" />
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Tanggal lahir</span>
                  <input type="date" required value={verificationForm.tanggal_lahir} onChange={(event) => setVerificationForm((current) => ({ ...current, tanggal_lahir: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" />
                </label>
                <TextField label="Domisili" value={verificationForm.domicile ?? ""} onChange={(value) => setVerificationForm((current) => ({ ...current, domicile: value }))} placeholder="Jakarta" list="indonesia-regions" />
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
        )
      ) : status === "stopped_agent" ? (
        <section className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm font-medium text-rose-800">
          Status agent kamu sedang dihentikan. Hubungi admin untuk mengaktifkan kembali akun agent.
        </section>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-950">Data pengajuan dan verifikasi</h2>
            <p className="mt-1 text-sm text-slate-500">Lengkapi semua data berikut dalam satu pengajuan.</p>
          </div>
          <form onSubmit={handleApplySubmit} className="space-y-5 p-5">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Data pengajuan</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4">
                <TextField label="Pekerjaan" value={applyForm.job} onChange={(value) => setApplyForm((current) => ({ ...current, job: value }))} placeholder="Sales Executive" />
                <TextField label="Instagram" value={applyForm.instagram} onChange={(value) => setApplyForm((current) => ({ ...current, instagram: value }))} placeholder="user.ig" />
                <TextField label="TikTok" value={applyForm.tiktok} onChange={(value) => setApplyForm((current) => ({ ...current, tiktok: value }))} placeholder="user.tt" />
                <TextField label="Facebook" value={applyForm.facebook} onChange={(value) => setApplyForm((current) => ({ ...current, facebook: value }))} placeholder="User FB" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Data verifikasi</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4">
                <FileField label="Foto diri" value={verificationForm.photo} onChange={(value) => setVerificationForm((current) => ({ ...current, photo: value }))} />
                <FileField label="Foto KTP" value={verificationForm.ktp_photo} onChange={(value) => setVerificationForm((current) => ({ ...current, ktp_photo: value }))} />
                <TextField label="Nama bank" value={verificationForm.bank_name} onChange={(value) => setVerificationForm((current) => ({ ...current, bank_name: value }))} placeholder="BCA" />
                <TextField label="Nomor rekening" value={verificationForm.account_number} onChange={(value) => setVerificationForm((current) => ({ ...current, account_number: value }))} placeholder="1234567890" />
                <TextField label="Tempat lahir" value={verificationForm.tempat_lahir} onChange={(value) => setVerificationForm((current) => ({ ...current, tempat_lahir: value }))} placeholder="Jakarta" list="indonesia-regions" />
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Tanggal lahir</span>
                  <input type="date" required value={verificationForm.tanggal_lahir} onChange={(event) => setVerificationForm((current) => ({ ...current, tanggal_lahir: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" />
                </label>
                <TextField label="Domisili" value={verificationForm.domicile ?? ""} onChange={(value) => setVerificationForm((current) => ({ ...current, domicile: value }))} placeholder="Jakarta" list="indonesia-regions" />
              </div>
              <div className="mt-4">
                <TextArea label="Alamat lengkap" value={verificationForm.full_address} onChange={(value) => setVerificationForm((current) => ({ ...current, full_address: value }))} placeholder="Jl. Contoh No. 10" />
              </div>
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

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
