import { AlertCircle, CheckCircle2, FileImage, Send, UserPlus, X, User, IdCard, Camera } from "lucide-react";
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
import { Suspense, lazy } from "react";
import { useNavigate } from "react-router";

const WebcamCapture = lazy(() => import("./WebcamCapture").then(module => ({ default: module.WebcamCapture })));

type SocialMediaField = "instagram" | "tiktok" | "facebook";

const agentMode = import.meta.env.MODE_Agent ?? import.meta.env.VITE_MODE_AGENT ?? "1";
const isSplitAgentMode = agentMode === "2";

const socialMediaOptions: { value: SocialMediaField; label: string; placeholder: string }[] = [
  { value: "instagram", label: "Instagram", placeholder: "user.ig" },
  { value: "tiktok", label: "TikTok", placeholder: "user.tt" },
  { value: "facebook", label: "Facebook", placeholder: "User FB" },
];

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
  phone_number: string;
  domicile: string;
};

type FeedbackDialog = {
  type: "success" | "error";
  title: string;
  message: string;
};

type RequiredFieldKey =
  | "job"
  | "photo"
  | "ktp_photo"
  | "bank_name"
  | "account_number"
  | "tempat_lahir"
  | "tanggal_lahir"
  | "full_address"
  | "phone_number"
  | "agent_motivation"
  | "referral_name"
  | "referral_other"
  | "target_product";

const requiredFieldMessages: Record<RequiredFieldKey, string> = {
  job: "Pekerjaan wajib diisi.",
  photo: "Foto diri wajib diambil.",
  ktp_photo: "Foto KTP wajib diambil.",
  bank_name: "Nama bank wajib diisi.",
  account_number: "Nomor rekening wajib diisi.",
  tempat_lahir: "Tempat lahir wajib diisi.",
  tanggal_lahir: "Tanggal lahir wajib diisi.",
  full_address: "Alamat lengkap wajib diisi.",
  phone_number: "Nomor HP/Telepon wajib diisi.",
  agent_motivation: "Alasan menjadi agent wajib diisi.",
  referral_name: "Nama teman/kerabat wajib diisi.",
  referral_other: "Sumber informasi wajib diisi.",
  target_product: "Target produk wajib diisi.",
};

const hasLetter = (value: string) => /[^\W\d_]/u.test(value);
const phoneNumberPattern = /^(?:\+62|08)\d+$/;

function normalizePhoneNumberInput(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/\D/g, "")}`.slice(0, 14);
  }
  return trimmed.replace(/\D/g, "").slice(0, 14);
}

function getPhoneNumberError(value: string) {
  const phoneNumber = value.trim();
  if (!phoneNumber) return requiredFieldMessages.phone_number;
  if (!phoneNumberPattern.test(phoneNumber)) return "Nomor HP/Telepon harus diawali +62 atau 08 dan hanya berisi angka.";
  if (phoneNumber.length < 11) return "Nomor HP/Telepon minimal 11 karakter.";
  if (phoneNumber.length > 14) return "Nomor HP/Telepon maksimal 14 karakter.";
  return "";
}

const verificationInitial: VerificationForm = {
  photo: null,
  ktp_photo: null,
  bank_name: "",
  account_number: "",
  tempat_lahir: "",
  tanggal_lahir: "",
  full_address: "",
  phone_number: "",
  domicile: "",
};

const indonesiaBanks = [
  "BCA",
  "Mandiri",
  "BRI",
  "BNI",
  "BSI",
  "CIMB Niaga",
  "Danamon",
  "Permata Bank",
  "OCBC",
  "Panin Bank",
  "Maybank Indonesia",
  "Bank Mega",
  "Bank BTN",
  "Bank BTPN",
  "Jenius",
  "Bank Jago",
  "SeaBank",
  "Allo Bank",
  "Blu by BCA Digital",
  "Bank Raya",
  "Bank Neo Commerce",
  "Bank Muamalat",
  "Bank Sinarmas",
  "Bank Bukopin",
  "KB Bank",
  "UOB Indonesia",
  "HSBC Indonesia",
  "Standard Chartered",
  "Citibank",
  "DBS Indonesia",
  "Bank Commonwealth",
  "Bank Capital Indonesia",
  "Bank Victoria",
  "Bank Mayapada",
  "Bank Mestika",
  "Bank Maspion",
  "Bank Ganesha",
  "Bank Woori Saudara",
  "Bank KEB Hana Indonesia",
  "Bank SBI Indonesia",
  "Bank MNC Internasional",
  "Bank QNB Indonesia",
  "Bank Ina Perdana",
  "Bank Oke Indonesia",
  "Bank BJB",
  "Bank DKI",
  "Bank Jateng",
  "Bank Jatim",
  "Bank Sumut",
  "Bank Nagari",
  "Bank Riau Kepri Syariah",
  "Bank Sumsel Babel",
  "Bank Lampung",
  "Bank Kalsel",
  "Bank Kalbar",
  "Bank Kaltimtara",
  "Bank Kalteng",
  "Bank Sulselbar",
  "Bank SulutGo",
  "Bank NTB Syariah",
  "Bank NTT",
  "Bank Maluku Malut",
  "Bank Papua",
  "Bank Bengkulu",
  "Bank Jambi",
  "Bank Aceh Syariah",
  "Bank Banten",
];
const ndaSections = [
  {
    title: "1. PURPOSE",
    body: [
      "GMT Suite is a digital ecosystem developed by GMT Group to provide access to product information, business tools, marketing materials, training resources, technical documents, and other resources related to GMT Group and its affiliated brands.",
      "Through access to GMT Suite, the Recipient may receive confidential information owned by GMT Group. This Agreement is intended to protect such information from unauthorized use, distribution, or disclosure.",
    ],
  },
  {
    title: "2. CONFIDENTIAL INFORMATION",
    body: ["Confidential Information includes but is not limited to:"],
    bullets: [
      "Product data, specifications, pricing, and commercial information",
      "Sales materials, marketing strategies, and business plans",
      "Training materials, presentations, and internal documents",
      "Technical information, manuals, system designs, and development plans",
      "Partner, customer, vendor, and business information",
      "Platform features, concepts, and future development plans",
      "Any other information available inside GMT Suite that is not publicly accessible",
    ],
  },
  {
    title: "3. CONFIDENTIALITY OBLIGATION",
    body: ["The Recipient agrees to:"],
    bullets: [
      "Keep all Confidential Information strictly confidential",
      "Use the information only for authorized business purposes related to GMT Group",
      "Not copy, share, publish, distribute, sell, or disclose any Confidential Information without written approval from GMT Group",
      "Protect all information using reasonable security measures",
    ],
  },
  {
    title: "4. ACCESS & ACCOUNT RESPONSIBILITY",
    body: [
      "Access to GMT Suite is granted individually and must not be transferred, shared, or used by unauthorized parties.",
      "The Recipient is responsible for all activities conducted through their account and must immediately inform GMT Group if unauthorized access occurs.",
    ],
  },
  {
    title: "5. OWNERSHIP OF INFORMATION",
    body: [
      "All materials, documents, content, data, intellectual property, and information available within GMT Suite remain the exclusive property of GMT Group or its respective brand principals.",
      "Access to GMT Suite does not provide ownership rights, license rights, or permission to use materials outside the approved purpose.",
    ],
  },
  {
    title: "6. RESTRICTION OF USE",
    body: ["The Recipient shall not:"],
    bullets: [
      "Use GMT Suite information for personal commercial purposes without authorization",
      "Share information with competitors or unauthorized third parties",
      "Modify, reproduce, or distribute GMT Suite materials without permission",
      "Use confidential information in a way that may harm GMT Group's business interests",
    ],
  },
  {
    title: "7. DURATION OF CONFIDENTIALITY",
    body: ["The confidentiality obligations remain effective during the Recipient's access period to GMT Suite and continue after access termination for as long as the information remains confidential."],
  },
  {
    title: "8. TERMINATION OF ACCESS",
    body: [
      "GMT Group reserves the right to suspend or revoke GMT Suite access if the Recipient violates this Agreement or misuses any information provided through the platform.",
      "Upon termination, the Recipient must stop using and delete any confidential materials obtained from GMT Suite if requested.",
    ],
  },
  {
    title: "9. BREACH OF AGREEMENT",
    body: ["Any unauthorized disclosure, misuse, or violation of this Agreement may result in access termination and further action in accordance with applicable regulations."],
  },
  {
    title: "10. ACKNOWLEDGEMENT",
    body: ["By accessing, registering, or using GMT Suite, the Recipient acknowledges that they have read, understood, and agreed to comply with the terms of this Agreement."],
  },
];

function TextField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  list,
  required = true,
  error,
  inputMode,
  pattern,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  list?: string;
  required?: boolean;
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-lg border px-3 py-3 text-sm outline-none transition focus:ring-2 ${
          error
            ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-100"
            : "border-slate-300 focus:border-[#0F766E] focus:ring-teal-100"
        }`}
        placeholder={placeholder}
        required={required}
        list={list}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
      />
      {error && <span className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  
  );
}

function BankSelect({
  value,
  onChange,
  onBlur,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
}) {
  const isListedBank = indonesiaBanks.includes(value);
  const isOtherBank = Boolean(value && !isListedBank);
  const [useOtherBank, setUseOtherBank] = useState(isOtherBank);
  const selectValue = useOtherBank || isOtherBank ? "__other__" : value;

  useEffect(() => {
    if (isOtherBank) setUseOtherBank(true);
  }, [isOtherBank]);

  return (
    <div className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">Nama bank</span>
      <select
        value={selectValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (nextValue === "__other__") {
            setUseOtherBank(true);
            onChange("");
          } else {
            setUseOtherBank(false);
            onChange(nextValue);
          }
        }}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        required
        className={`w-full rounded-lg border bg-white px-3 py-3 text-sm outline-none transition focus:ring-2 ${
          error
            ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-100"
            : "border-slate-300 focus:border-[#0F766E] focus:ring-teal-100"
        }`}
      >
        <option value="">Pilih bank</option>
        {indonesiaBanks.map((bank) => (
          <option key={bank} value={bank}>
            {bank}
          </option>
        ))}
        <option value="__other__">Bank lainnya</option>
      </select>
      {useOtherBank && (
        <input
          value={isOtherBank ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={`mt-2 w-full rounded-lg border bg-white px-3 py-3 text-sm outline-none transition focus:ring-2 ${
            error
              ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-100"
              : "border-slate-300 focus:border-[#0F766E] focus:ring-teal-100"
          }`}
          placeholder="Tulis nama bank"
          required
        />
      )}
      {error && <span className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
    </div>
  );
}
function TextArea({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        className={`min-h-28 w-full resize-y rounded-lg border px-3 py-3 text-sm outline-none transition focus:ring-2 ${
          error
            ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-100"
            : "border-slate-300 focus:border-[#0F766E] focus:ring-teal-100"
        }`}
        placeholder={placeholder}
        required
      />
      {error && <span className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

function FileField({
  label,
  value,
  onChange,
  icon: Icon = Camera,
  livePhotoType,
  onOpenLivePhoto,
  error,
}: {
  label: string;
  value: File | null;
  onChange: (value: File | null) => void;
  icon?: any;
  livePhotoType?: "ktp" | "selfie";
  onOpenLivePhoto?: () => void;
  error?: string;
}) {
  const previewUrl = value ? URL.createObjectURL(value) : null;
  const Wrapper = livePhotoType ? "div" : "label";

  return (
    <div className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <Wrapper 
        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition hover:bg-slate-50 ${error ? "border-rose-300 bg-rose-50/40" : "border-slate-300"}`}
        onClick={livePhotoType ? onOpenLivePhoto : undefined}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <Icon className="h-6 w-6 text-slate-400" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <span className="text-sm font-semibold text-[#0F766E]">
            {value ? "Foto sudah tersimpan" : "Ketuk area ini untuk membuka kamera"}
          </span>
          <span className="w-full truncate text-xs text-slate-500">
            {value ? value.name : "Belum ada file terpilih"}
          </span>
        </div>
        {livePhotoType ? (
          <label
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={(event) => event.stopPropagation()}
          >
            Upload gambar
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event) => onChange(event.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </label>
        ) : (
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={(event) => onChange(event.target.files?.[0] ?? null)}
            className="sr-only"
            required={!value}
          />
        )}
      </Wrapper>
      {error && <span className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
    </div>
  );
}

function hasCompletedVerification(detailUser: DetailUserDto | undefined) {
  return Boolean(
    detailUser?.photo &&
      detailUser.ktp_photo &&
      detailUser.bank_name &&
      detailUser.account_number &&
      detailUser.full_address &&
      detailUser.phone_number,
  );
}

function WaitingCta() {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col items-center gap-5 py-8 sm:py-12">
      <img
        src="/imgloading/loadinganimation.png"
        alt="Menunggu verifikasi"
        className="w-full max-w-3xl object-contain"
      />
      <div className="w-full max-w-3xl rounded-lg border border-teal-200 bg-teal-50 px-4 py-4 text-center shadow-sm">
        <p className="text-sm leading-6 text-slate-700">
          Status pendaftaran kamu akan dikirimkan melalui <strong>WhatsApp atau email</strong> setelah proses verifikasi selesai.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Sambil menunggu, yuk kenali lebih jauh program <strong>Moxlite Authorized Agent</strong> melalui video onboarding kami.
        </p>
        <button
          type="button"
          onClick={() => navigate("/agent-onboarding")}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59]"
        >
          Tonton Video Onboarding
        </button>
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
  const [activeCamera, setActiveCamera] = useState<"ktp" | "selfie" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [feedbackDialog, setFeedbackDialog] = useState<FeedbackDialog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regions, setRegions] = useState<{ id: string; regency: string }[]>([]);
  const [selectedSocialMedia, setSelectedSocialMedia] = useState<SocialMediaField>("instagram");

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsReadCompleted, setTermsReadCompleted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsTimeLeft, setTermsTimeLeft] = useState(30);

  const [touchedFields, setTouchedFields] = useState<Partial<Record<RequiredFieldKey, boolean>>>({});

  const markFieldTouched = (field: RequiredFieldKey) => {
    setTouchedFields((current) => ({ ...current, [field]: true }));
  };

  const markFieldsTouched = (fields: RequiredFieldKey[]) => {
    setTouchedFields((current) => fields.reduce((next, field) => ({ ...next, [field]: true }), current));
  };

  const getMissingFields = (includeApplyFields = true, includeVerificationFields = true): RequiredFieldKey[] => {
    const missingFields: RequiredFieldKey[] = [];

    if (includeApplyFields && (!applyForm.job.trim() || !hasLetter(applyForm.job))) missingFields.push("job");
    if (includeVerificationFields && !verificationForm.photo) missingFields.push("photo");
    if (includeVerificationFields && !verificationForm.ktp_photo) missingFields.push("ktp_photo");
    if (includeVerificationFields && !verificationForm.bank_name.trim()) missingFields.push("bank_name");
    if (includeVerificationFields && (!verificationForm.account_number.trim() || /\D/.test(verificationForm.account_number))) missingFields.push("account_number");
    if (includeVerificationFields && !verificationForm.tempat_lahir.trim()) missingFields.push("tempat_lahir");
    if (includeVerificationFields && !verificationForm.tanggal_lahir.trim()) missingFields.push("tanggal_lahir");
    if (includeVerificationFields && !verificationForm.full_address.trim()) missingFields.push("full_address");
    if (includeVerificationFields && getPhoneNumberError(verificationForm.phone_number)) missingFields.push("phone_number");
    if (includeApplyFields && !applyForm.agent_motivation.trim()) missingFields.push("agent_motivation");
    if (includeApplyFields && applyForm.referral_source === "teman_kerabat" && !applyForm.referral_name?.trim()) missingFields.push("referral_name");
    if (includeApplyFields && applyForm.referral_source === "lainnya" && !applyForm.referral_other?.trim()) missingFields.push("referral_other");
    if (includeApplyFields && !applyForm.target_product.trim()) missingFields.push("target_product");

    return missingFields;
  };

  const getFieldError = (field: RequiredFieldKey, includeApplyFields = true) => {
    if (!touchedFields[field]) return "";
    if (field === "job") {
      if (!applyForm.job.trim()) return requiredFieldMessages.job;
      if (!hasLetter(applyForm.job)) return "Pekerjaan harus berisi huruf, tidak boleh angka saja.";
      return "";
    }
    if (field === "account_number") {
      if (!verificationForm.account_number.trim()) return requiredFieldMessages.account_number;
      if (/\D/.test(verificationForm.account_number)) return "Nomor rekening hanya boleh berisi angka.";
      return "";
    }
    if (field === "phone_number") return getPhoneNumberError(verificationForm.phone_number);
    return getMissingFields(includeApplyFields).includes(field) ? requiredFieldMessages[field] : "";
  };

  const isFormIncomplete = getMissingFields(true, !isSplitAgentMode).length > 0;
  const isVerificationIncomplete = getMissingFields(false, true).length > 0;

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/Caknoooo/provinces-cities-indonesia/master/json/regencies.json")
      .then((res) => res.json())
      .then((data) => setRegions(Array.isArray(data) ? data : []))
      .catch(() => setRegions([]));
  }, []);

  const syncLatestStatus = useCallback(async () => {
    try {
      const latestUser = await refreshStoredUser();
      const latestStatus = latestUser?.detail_user?.status;
      if (latestStatus !== undefined) {
        setStatus(latestStatus ?? null);
        setIsVerificationCompleted(hasCompletedVerification(latestUser?.detail_user));
      }
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
    const missingFields = getMissingFields(true, !isSplitAgentMode);
    if (missingFields.length > 0) {
      markFieldsTouched(missingFields);
      setErrorMessage("Lengkapi semua field wajib sebelum mengirim pengajuan.");
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await api.applyAgent(applyForm);

      if (isSplitAgentMode) {
        setApplyForm(applyInitial);
        setTouchedFields({});
        setStatus("not_verif");
        const currentUser = getStoredUser();
        if (currentUser) {
          saveAuthSession(getAuthToken() ?? "", {
            ...currentUser,
            detail_user: {
              ...currentUser.detail_user,
              status: "not_verif",
            },
          });
        }
        const message = response.message || "Pengajuan agent berhasil dikirim.";
        setSuccessMessage(message);
        setFeedbackDialog({
          type: "success",
          title: "Pengajuan berhasil",
          message: "Pengajuan agent berhasil dikirim. Data verifikasi bisa dilengkapi setelah status pengajuan menjadi verif.",
        });
      } else {
        if (!verificationForm.photo || !verificationForm.ktp_photo) {
          throw new Error("Foto diri dan foto KTP wajib diupload.");
        }

        const verificationResponse = await api.completeAgentVerification({
          photo: verificationForm.photo,
          ktp_photo: verificationForm.ktp_photo,
          bank_name: verificationForm.bank_name,
          account_number: verificationForm.account_number,
          phone_number: verificationForm.phone_number,
          full_address: verificationForm.full_address,
          domicile: verificationForm.domicile,
          ttl: `${verificationForm.tempat_lahir}, ${verificationForm.tanggal_lahir}`,
        });

        if (verificationResponse?.user) {
          saveAuthSession(getAuthToken() ?? "", verificationResponse.user);
          setStatus(verificationResponse.user.detail_user?.status ?? "verif");
          setIsVerificationCompleted(hasCompletedVerification(verificationResponse.user.detail_user));
        }
        setApplyForm(applyInitial);
        setVerificationForm(verificationInitial);
        setTouchedFields({});
        const message = response.message || verificationResponse.message || "Pengajuan dan data verifikasi berhasil dikirim.";
        setSuccessMessage(message);
        setFeedbackDialog({
          type: "success",
          title: "Upload berhasil",
          message: "Pengajuan dan data verifikasi berhasil dikirim.",
        });
      }
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
    const missingFields = getMissingFields(false, true);
    if (missingFields.length > 0) {
      markFieldsTouched(missingFields);
      setErrorMessage("Lengkapi semua field wajib sebelum menyimpan data verifikasi.");
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await api.completeAgentVerification({
        photo: verificationForm.photo,
        ktp_photo: verificationForm.ktp_photo,
        bank_name: verificationForm.bank_name,
        account_number: verificationForm.account_number,
        phone_number: verificationForm.phone_number,
        full_address: verificationForm.full_address,
        domicile: verificationForm.domicile,
        ttl: `${verificationForm.tempat_lahir}, ${verificationForm.tanggal_lahir}`,
      });
      const token = getAuthToken() ?? "";
      if (response?.user) {
        saveAuthSession(token, response.user);
        setStatus(response.user.detail_user?.status ?? "verif");
        setIsVerificationCompleted(hasCompletedVerification(response.user.detail_user));
      }
      const message = response.message || "Data verifikasi berhasil dilengkapi.";
      setSuccessMessage(message);
      setFeedbackDialog({
        type: "success",
        title: "Upload berhasil",
        message: `${message} Status halaman sudah diperbarui.`,
      });
      setVerificationForm(verificationInitial);
      setTouchedFields({});
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
            {isSplitAgentMode
              ? "Isi data pengajuan agent untuk ditinjau oleh admin."
              : "Isi data pengajuan dan verifikasi dalam satu langkah agar admin bisa langsung meninjau kelengkapan agent."}
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
        <WaitingCta />
      ) : status === "verif" ? (
        isVerificationCompleted ? (
          <WaitingCta />
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-950">Lengkapi data verifikasi</h2>
              <p className="mt-1 text-sm text-slate-500">Isi data ini setelah admin mengubah status pengajuan menjadi verif.</p>
            </div>
            <form onSubmit={handleVerificationSubmit} className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FileField label="Foto diri" value={verificationForm.photo} onChange={(value) => { markFieldTouched("photo"); setVerificationForm((current) => ({ ...current, photo: value })); }} error={getFieldError("photo")} icon={User} livePhotoType="selfie" onOpenLivePhoto={() => setActiveCamera("selfie")} />
                <FileField label="Foto KTP" value={verificationForm.ktp_photo} onChange={(value) => { markFieldTouched("ktp_photo"); setVerificationForm((current) => ({ ...current, ktp_photo: value })); }} error={getFieldError("ktp_photo")} icon={IdCard} livePhotoType="ktp" onOpenLivePhoto={() => setActiveCamera("ktp")} />
                <BankSelect value={verificationForm.bank_name} onChange={(value) => setVerificationForm((current) => ({ ...current, bank_name: value }))} onBlur={() => markFieldTouched("bank_name")} error={getFieldError("bank_name")} />
                <TextField label="Nomor rekening" value={verificationForm.account_number} onChange={(value) => { markFieldTouched("account_number"); setVerificationForm((current) => ({ ...current, account_number: value })); }} onBlur={() => markFieldTouched("account_number")} error={getFieldError("account_number")} placeholder="1234567890" inputMode="numeric" pattern="[0-9]*" />
                <TextField label="PhoneNumber (Nomor HP/Telepon)" value={verificationForm.phone_number} onChange={(value) => { markFieldTouched("phone_number"); setVerificationForm((current) => ({ ...current, phone_number: normalizePhoneNumberInput(value) })); }} onBlur={() => markFieldTouched("phone_number")} error={getFieldError("phone_number")} placeholder="081234567890" inputMode="tel" maxLength={14} />
                <TextField label="Tempat lahir" value={verificationForm.tempat_lahir} onChange={(value) => setVerificationForm((current) => ({ ...current, tempat_lahir: value }))} onBlur={() => markFieldTouched("tempat_lahir")} error={getFieldError("tempat_lahir")} placeholder="Jakarta" list="indonesia-regions" />
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Tanggal lahir</span>
                  <input
                    type="date"
                    required
                    value={verificationForm.tanggal_lahir}
                    onChange={(event) => setVerificationForm((current) => ({ ...current, tanggal_lahir: event.target.value }))}
                    onBlur={() => markFieldTouched("tanggal_lahir")}
                    aria-invalid={Boolean(getFieldError("tanggal_lahir"))}
                    className={`w-full rounded-lg border px-3 py-3 text-sm outline-none transition focus:ring-2 ${
                      getFieldError("tanggal_lahir")
                        ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-100"
                        : "border-slate-300 focus:border-[#0F766E] focus:ring-teal-100"
                    }`}
                  />
                  {getFieldError("tanggal_lahir") && <span className="mt-1.5 block text-xs font-medium text-rose-600">{getFieldError("tanggal_lahir")}</span>}
                </label>
                <TextField label="Domisili" value={verificationForm.domicile ?? ""} onChange={(value) => setVerificationForm((current) => ({ ...current, domicile: value }))} placeholder="Jakarta" list="indonesia-regions" />
              </div>
              <TextArea label="Alamat lengkap" value={verificationForm.full_address} onChange={(value) => setVerificationForm((current) => ({ ...current, full_address: value }))} onBlur={() => markFieldTouched("full_address")} error={getFieldError("full_address")} placeholder="Jl. Contoh No. 10" />
              <div className="flex justify-end border-t border-slate-200 pt-5">
                <button type="submit" disabled={isSubmitting || isVerificationIncomplete} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-400">
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
              <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <TextField label="Pekerjaan" value={applyForm.job} onChange={(value) => { markFieldTouched("job"); setApplyForm((current) => ({ ...current, job: value })); }} onBlur={() => markFieldTouched("job")} error={getFieldError("job")} placeholder="Sales Executive" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(10rem,0.45fr)_1fr] lg:col-span-1">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Sosmed</span>
                    <select
                      value={selectedSocialMedia}
                      onChange={(event) => setSelectedSocialMedia(event.target.value as SocialMediaField)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                    >
                      {socialMediaOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <TextField
                    label={`${socialMediaOptions.find((option) => option.value === selectedSocialMedia)?.label ?? "Sosmed"}`}
                    value={applyForm[selectedSocialMedia] ?? ""}
                    onChange={(value) => setApplyForm((current) => ({ ...current, [selectedSocialMedia]: value }))}
                    placeholder={socialMediaOptions.find((option) => option.value === selectedSocialMedia)?.placeholder}
                    required={false}
                  />
                </div>
              </div>
            </div>

            {!isSplitAgentMode && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Data verifikasi</h3>
              <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FileField label="Foto diri" value={verificationForm.photo} onChange={(value) => { markFieldTouched("photo"); setVerificationForm((current) => ({ ...current, photo: value })); }} error={getFieldError("photo")} icon={User} livePhotoType="selfie" onOpenLivePhoto={() => setActiveCamera("selfie")} />
                <FileField label="Foto KTP" value={verificationForm.ktp_photo} onChange={(value) => { markFieldTouched("ktp_photo"); setVerificationForm((current) => ({ ...current, ktp_photo: value })); }} error={getFieldError("ktp_photo")} icon={IdCard} livePhotoType="ktp" onOpenLivePhoto={() => setActiveCamera("ktp")} />
                <BankSelect value={verificationForm.bank_name} onChange={(value) => setVerificationForm((current) => ({ ...current, bank_name: value }))} onBlur={() => markFieldTouched("bank_name")} error={getFieldError("bank_name")} />
                <TextField label="Nomor rekening" value={verificationForm.account_number} onChange={(value) => { markFieldTouched("account_number"); setVerificationForm((current) => ({ ...current, account_number: value })); }} onBlur={() => markFieldTouched("account_number")} error={getFieldError("account_number")} placeholder="1234567890" inputMode="numeric" pattern="[0-9]*" />
                <TextField label="PhoneNumber (Nomor HP/Telepon)" value={verificationForm.phone_number} onChange={(value) => { markFieldTouched("phone_number"); setVerificationForm((current) => ({ ...current, phone_number: normalizePhoneNumberInput(value) })); }} onBlur={() => markFieldTouched("phone_number")} error={getFieldError("phone_number")} placeholder="081234567890" inputMode="tel" maxLength={14} />
                <TextField label="Tempat lahir" value={verificationForm.tempat_lahir} onChange={(value) => setVerificationForm((current) => ({ ...current, tempat_lahir: value }))} onBlur={() => markFieldTouched("tempat_lahir")} error={getFieldError("tempat_lahir")} placeholder="Jakarta" list="indonesia-regions" />
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Tanggal lahir</span>
                  <input
                    type="date"
                    required
                    value={verificationForm.tanggal_lahir}
                    onChange={(event) => setVerificationForm((current) => ({ ...current, tanggal_lahir: event.target.value }))}
                    onBlur={() => markFieldTouched("tanggal_lahir")}
                    aria-invalid={Boolean(getFieldError("tanggal_lahir"))}
                    className={`w-full rounded-lg border px-3 py-3 text-sm outline-none transition focus:ring-2 ${
                      getFieldError("tanggal_lahir")
                        ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-100"
                        : "border-slate-300 focus:border-[#0F766E] focus:ring-teal-100"
                    }`}
                  />
                  {getFieldError("tanggal_lahir") && <span className="mt-1.5 block text-xs font-medium text-rose-600">{getFieldError("tanggal_lahir")}</span>}
                </label>
                <TextField label="Domisili" value={verificationForm.domicile ?? ""} onChange={(value) => setVerificationForm((current) => ({ ...current, domicile: value }))} placeholder="Jakarta" list="indonesia-regions" />
              </div>
              <div className="mt-4">
                <TextArea label="Alamat lengkap" value={verificationForm.full_address} onChange={(value) => setVerificationForm((current) => ({ ...current, full_address: value }))} onBlur={() => markFieldTouched("full_address")} error={getFieldError("full_address")} placeholder="Jl. Contoh No. 10" />
              </div>
            </div>
            )}

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

            <TextArea label="Alasan ingin menjadi Moxlite Agent" value={applyForm.agent_motivation} onChange={(value) => setApplyForm((current) => ({ ...current, agent_motivation: value }))} onBlur={() => markFieldTouched("agent_motivation")} error={getFieldError("agent_motivation")} placeholder="Ceritakan alasan kamu..." />

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
              {applyForm.referral_source === "teman_kerabat" && <TextField label="Nama teman/kerabat" value={applyForm.referral_name ?? ""} onChange={(value) => setApplyForm((current) => ({ ...current, referral_name: value }))} onBlur={() => markFieldTouched("referral_name")} error={getFieldError("referral_name")} placeholder="Nama referensi" />}
              {applyForm.referral_source === "lainnya" && <TextField label="Sumber lainnya" value={applyForm.referral_other ?? ""} onChange={(value) => setApplyForm((current) => ({ ...current, referral_other: value }))} onBlur={() => markFieldTouched("referral_other")} error={getFieldError("referral_other")} placeholder="Isi sumber informasi" />}
            </div>

            <TextField label="Produk apa yang anda targetkan?" value={applyForm.target_product} onChange={(value) => setApplyForm((current) => ({ ...current, target_product: value }))} onBlur={() => markFieldTouched("target_product")} error={getFieldError("target_product")} placeholder="Contoh: lighting, sound system, event equipment" />

            <div className="border-t border-slate-200 pt-5">
              <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100/80">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    if (!termsReadCompleted) {
                      e.preventDefault();
                      setShowTermsModal(true);
                    } else {
                      setTermsAccepted(e.target.checked);
                    }
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E] cursor-pointer"
                />
                <span className="text-sm text-slate-700 select-none">
                  I have read and agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-[#0F766E] font-semibold underline hover:text-[#115E59]"
                  >
                    Terms of Use
                  </button>
                </span>
              </label>
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-5">
              <button type="submit" disabled={isSubmitting || !termsAccepted || isFormIncomplete} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-400">
                <Send className="h-4 w-4" />
                {isSubmitting ? "Mengirim..." : isSplitAgentMode ? "Kirim pengajuan" : "Kirim pengajuan dan verifikasi"}
              </button>
            </div>
          </form>
        </section>
      )}

      {activeCamera && (
        <Suspense fallback={
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
              <span>Menyiapkan kamera & AI...</span>
            </div>
          </div>
        }>
          <WebcamCapture
            overlayType={activeCamera}
            onClose={() => setActiveCamera(null)}
            onCapture={(file) => {
              if (activeCamera === "ktp") {
                markFieldTouched("ktp_photo");
                setVerificationForm((current) => ({ ...current, ktp_photo: file }));
              } else if (activeCamera === "selfie") {
                markFieldTouched("photo");
                setVerificationForm((current) => ({ ...current, photo: file }));
              }
              setActiveCamera(null);
            }}
          />
        </Suspense>
      )}

      {showTermsModal && (
        <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col overflow-hidden bg-white animate-fade-in">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2 text-[#0F766E]">
              <FileImage className="h-5 w-5 shrink-0" />
              <h2 className="text-base font-bold text-slate-950 sm:text-lg">NON-DISCLOSURE AGREEMENT (NDA) GMT SUITE</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowTermsModal(false);
              }}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-6 sm:px-8"
            onScroll={(event) => {
              const target = event.currentTarget;
              const isScrolledToBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 12;
              if (isScrolledToBottom) {
                setTermsReadCompleted(true);
              }
            }}
          >
            <article className="mx-auto max-w-3xl space-y-6 text-sm leading-7 text-slate-700">
              <header className="space-y-3 border-b border-slate-200 pb-5 text-center">
                <p className="text-xl font-bold text-slate-950 sm:text-2xl">NON-DISCLOSURE AGREEMENT (NDA)</p>
                <p className="text-lg font-semibold text-[#0F766E]">GMT SUITE</p>
              </header>

              <section className="space-y-3">
                <p>This Non-Disclosure Agreement ("Agreement") is entered into by and between:</p>
                <p><strong>PT Global Multipro Technology ("GMT Group")</strong>, as the owner and operator of GMT Suite,</p>
                <p>and</p>
                <p>The registered user, partner, affiliate, vendor, or any party who has been granted access to GMT Suite ("Recipient").</p>
                <p>Collectively referred to as "Parties".</p>
              </section>

              {ndaSections.map((section) => (
                <section key={section.title} className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-950">{section.title}</h3>
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets && (
                    <ul className="list-disc space-y-2 pl-5">
                      {section.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}

              <footer className="border-t border-slate-200 pt-5 font-bold text-slate-950">
                PT GLOBAL MULTIPRO TECHNOLOGY
              </footer>
            </article>
          </div>

          <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
            <button
              type="button"
              disabled={!termsReadCompleted}
              onClick={() => {
                setTermsAccepted(true);
                setShowTermsModal(false);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#115E59] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              Saya Setuju & Lanjutkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}











