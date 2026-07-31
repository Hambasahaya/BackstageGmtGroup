export type ApiRole = "user" | "agent" | "super_admin" | "sales" | "marketing";
export type PreorderStatus = "draft" | "in_review" | "approve" | "shipped" | "barang_sudah_terkirim" | "invalid";
export type PaymentStatus = "unpaid" | "pending" | "partial" | "paid" | "shipped" | "barang_sudah_terkirim" | "expired" | "failed" | "refund";
export type PaymentMode = "full" | "split" | "50%" | "100%" | "50" | "100";
export type WithdrawStatus = "on_progress" | "approval";
export type OnboardingProgressStatus = "in_progress" | "completed";
export const onboardingProgressUpdatedEvent = "onboarding-progress-updated";

export type ProductDto = {
  id: number;
  namaproduct: string;
  foto?: string | null;
  deskripsi?: string | null;
  unit?: string | null;
  price: number;
  status?: string | null;
  komisi?: number | null;
  commission_tiers?: Record<string, number>;
  created_at?: string;
  updated_at?: string;
};

export type PreorderItemDto = {
  id?: number;
  id_product?: number;
  product_id?: number;
  product?: ProductDto;
  product_snapshot?: string;
  product_name?: string;
  namaproduct?: string;
  qty: number;
  discount_percent: number;
  price?: number;
  subtotal?: number;
  discount_total?: number;
  total?: number;
  komisi?: number;
};

export type PreorderDto = {
  id: number;
  po_number?: string;
  status: PreorderStatus;
  agent_name?: string | null;
  agent_email?: string | null;
  sales_agent_name?: string | null;
  sales_agent_email?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  agent?: {
    name?: string | null;
    email?: string | null;
  } | null;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  nama_customer: string;
  nama_perusahaan?: string | null;
  email: string;
  alamat: string;
  no_hp: string;
  catatan?: string | null;
  items?: PreorderItemDto[];
  preorder_items?: PreorderItemDto[];
  subtotal: number;
  total_discount?: number;
  total_diskon?: number;
  total: number;
  total_komisi: number;
  payment_mode?: PaymentMode | null;
  payment_status?: PaymentStatus | null;
  payment_url?: string | null;
  payment_token?: string | null;
  midtrans_order_id?: string | null;
  invalid_reason?: string | null;
  invoice_received?: boolean;
  invoice_received_at?: string | null;
  payment_proof?: string | null;
  dp_proof?: string | null;
  remaining_proof?: string | null;
  last_payment_stage?: string | null;
  created_at?: string;
};

export type PaymentLinkResponse = {
  message?: string;
  payment_url?: string | null;
  payment_token?: string | null;
  midtrans_order_id?: string | null;
  payment_status?: PaymentStatus | null;
  preorder?: PreorderDto;
};

export type WalletDto = {
  total_commission: number;
  available_balance: number;
  pending_withdraw: number;
  withdrawn_balance: number;
};

export type WithdrawDto = {
  id: number;
  withdraw_number?: string;
  amount: number;
  status: WithdrawStatus;
  created_at: string;
  approved_at?: string | null;
  agent_name?: string | null;
  user_name?: string | null;
  bank_name?: string | null;
  bank?: string | null;
  account_number?: string | null;
  nomor_rekening?: string | null;
  nama_penerima?: string | null;
  recipient_name?: string | null;
  account_holder?: string | null;
  transfer_proof?: string | null;
  payment_proof?: string | null;
  proof_of_transfer?: string | null;
  bukti_transfer?: string | null;
  user?: {
    name?: string | null;
    detail_user?: DetailUserDto;
  } | null;
  agent?: {
    name?: string | null;
    detail_user?: DetailUserDto;
  } | null;
};

export type OnboardingVideoDto = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  video_url: string;
  duration_seconds: number;
  sort_order: number;
  is_required: boolean;
};

export type OnboardingVideoPayload = {
  title: string;
  description?: string;
  video_url: string;
  duration_seconds: number;
  sort_order?: number;
  is_required?: boolean;
  slug?: string;
};

export type OnboardingProgressDto = {
  video_id: number;
  slug: string;
  status: OnboardingProgressStatus;
  watched_seconds: number;
  completed_at?: string | null;
};

export type OnboardingSummaryDto = {
  completed_count: number;
  total_required: number;
  completion_percent: number;
  is_completed: boolean;
  progress: OnboardingProgressDto[];
};

export type UserSession = {
  id: number;
  name: string;
  email: string;
  role: ApiRole;
  detail_user?: DetailUserDto;
};

export type AgentApplicationStatus = "not_verif" | "verif" | "official_agent" | "stopped_agent";

export type DetailUserDto = {
  id?: number;
  user_id?: number;
  company_name?: string;
  job?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  agent_program_type?: string | null;
  agent_motivation?: string | null;
  referral_source?: string | null;
  referral_name?: string | null;
  referral_other?: string | null;
  target_product?: string | null;
  photo?: string | null;
  ktp_photo?: string | null;
  full_address?: string | null;
  bank_name?: string | null;
  bank?: string | null;
  account_number?: string | null;
  nomor_rekening?: string | null;
  nama_penerima?: string | null;
  recipient_name?: string | null;
  account_holder?: string | null;
  transfer_proof?: string | null;
  payment_proof?: string | null;
  proof_of_transfer?: string | null;
  bukti_transfer?: string | null;
  status?: AgentApplicationStatus | null;
  created_at?: string;
  updated_at?: string;
};

export type AuthResponse = {
  message: string;
  token: string;
  refresh_token?: string;
  session: {
    session_id: string;
    user_id?: number;
    client: string;
    expires_at?: string;
    revoked_at?: string | null;
  };
  user: UserSession;
};

export type RegisterPayload = {
  name: string;
  phone_number: string;
  email: string;
  password: string;
  gender?: string;
  ttl?: string;
  domicile?: string;
  company_name?: string;
  job?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  photo?: string;
  ktp_photo?: string;
  full_address?: string;
  bank_name?: string;
  account_number?: string;
  status?: string;
  role?: ApiRole;
};

export type ApplyAgentPayload = {
  job: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  agent_program_type: string;
  agent_motivation: string;
  referral_source: string;
  referral_name?: string;
  referral_other?: string;
  target_product: string;
};

export type AgentVerificationPayload = {
  photo: File;
  ktp_photo: File;
  bank_name: string;
  account_number: string;
  ttl: string;
  full_address: string;
  domicile?: string;
};


export type CustomerCareTicketType = "complaint" | "demo_request" | "warranty_claim" | "general_support";
export type CustomerCareTicketStatus = "diterima" | "diproses" | "menunggu_customer" | "selesai";
export type CustomerCareTicketCategory =
  | "produk_rusak"
  | "barang_kurang_salah"
  | "keterlambatan_pengiriman"
  | "pembayaran"
  | "garansi"
  | "lainnya";

export type CustomerCareInvoiceDto = {
  invoice_id: number;
  invoice_number: string;
  date: string;
  products: { product_id: number; product_name: string; qty: number }[];
};

export type CustomerCareAttachmentDto = {
  id: number;
  ticket_id: number;
  file_url: string;
  file_type: "image" | "video" | string;
  created_at: string;
};

export type CustomerCareLogDto = {
  id: number;
  ticket_id?: number;
  actor_id?: number;
  action: string;
  note?: string;
  created_at: string;
};

export type CustomerCareMessageDto = {
  id: number;
  ticket_id?: number;
  sender_id?: number;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
};

export type CustomerCareTicketDto = {
  id: number;
  ticket_number: string;
  type: CustomerCareTicketType;
  invoice_id?: number;
  invoice_number?: string;
  product_id?: number;
  product_name?: string;
  category: CustomerCareTicketCategory | string;
  subject: string;
  description?: string;
  status: CustomerCareTicketStatus;
  pic_id?: number;
  pic_name?: string;
  contact_channel?: string;
  rating?: number | null;
  feedback?: string | null;
  response_due_at?: string;
  resolve_due_at?: string;
  attachments?: CustomerCareAttachmentDto[];
  logs?: CustomerCareLogDto[];
  created_at: string;
};

export type CustomerCareTicketPayload = {
  type: CustomerCareTicketType;
  invoice_id?: number;
  product_id?: number;
  category: string;
  subject: string;
  description?: string;
  contact_channel?: string;
};

export type AgentApplicationDto = UserSession & {
  phone_number?: string;
  domicile?: string;
  ttl?: string;
  detail_user?: DetailUserDto;
};

export type NotificationDto = {
  id?: number;
  role?: ApiRole;
  title?: string;
  message?: string;
  data?: string | Record<string, unknown> | null;
  read_at?: string | null;
  status?: "belum_terbaca" | "terbaca";
};

export type EducationStatus = "Available" | "Full" | "Closed" | "Cancelled" | string;
export type EducationType = "Offline" | "Online" | "Hybrid" | string;

export type EducationParticipantDto = {
  id?: string | number;
  registration_id?: string;
  user_id?: string | number;
  status?: string;
  salutation?: string;
  first_name?: string;
  surname?: string;
  name?: string;
  email?: string;
  phone_landline?: string | null;
  phone_mobile?: string | null;
  company?: string | null;
  position?: string | null;
  meal_preference?: string | null;
  additional_information?: string | null;
  created_at?: string;
  registered_at?: string;
};

export type EducationDto = {
  id: string;
  title: string;
  description?: string | null;
  full_description?: string | null;
  date: string;
  time?: string | null;
  type: EducationType;
  status: EducationStatus;
  max_attendees?: number | null;
  current_attendees?: number | null;
  location?: string | null;
  venue?: string | null;
  image?: string | null;
  participants?: EducationParticipantDto[];
  registrations?: EducationParticipantDto[];
  [key: string]: unknown;
};

export type EducationListResponse = {
  success?: boolean;
  message?: string;
  data: EducationDto[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
};

export type BookingType = "demo" | "event" | string;

export type BookingDto = {
  id: string;
  type: BookingType;
  name: string;
  email: string;
  position?: string;
  referralSource?: string;
  category?: string;
  preferredDate?: string;
  usedGmtProduct?: string;
  interestedProduct?: string;
  capacity?: number | string;
  eventCapacity?: number | string;
  deck?: string;
  eventDeck?: string;
  deckUrl?: string;
  description?: string;
  eventDescription?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type BookingsListResponse = {
  success: boolean;
  data: BookingDto[];
  message?: string;
  error?: string;
};


export type EducationDetailResponse = {
  success?: boolean;
  message?: string;
  data: EducationDto;
};

export type EducationPayload = {
  title: string;
  description?: string;
  full_description?: string;
  date: string;
  time?: string;
  type: string;
  status: string;
  max_attendees?: number;
  current_attendees?: number;
  location?: string;
  venue?: string;
};

export type ArticleSEO = {
  title?: string;
  description?: string;
  canonical_url?: string;
};

export type ArticleMetadata = {
  gallery?: string[];
  related_products?: number[];
  related_articles?: number[];
};

export type ArticleDto = {
  id: number;
  title: string;
  slug: string;
  category?: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  author?: string;
  source_url?: string;
  status: string;
  seo?: ArticleSEO;
  metadata?: ArticleMetadata;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type ArticlePayload = {
  title: string;
  slug: string;
  category?: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  author?: string;
  source_url?: string;
  status?: string;
  seo?: ArticleSEO;
  metadata?: ArticleMetadata;
  published_at?: string;
  updated_at?: string;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const assetBaseUrl = import.meta.env.VITE_ASSET_BASE_URL ?? "https://is3.cloudhost.id/gmtsuites";
export const clientName = import.meta.env.VITE_CLIENT_NAME ?? "website_utama";
const websiteAUrl = import.meta.env.VITE_WEBSITE_A_URL ?? "";
const defaultLogoutRedirectUrl = import.meta.env.VITE_LOGOUT_REDIRECT_URL ?? "/";
export const authTokenStorageKey = "token";
export const authRefreshTokenStorageKey = "refresh_token";
export const userStorageKey = "gmt-auth-user";
export const loginSourceStorageKey = "gmt-login-source-url";
export const authSessionUpdatedEvent = "gmt-auth-session-updated";
const legacyRoleStorageKey = "gmt-current-role";

type RequestOptions = RequestInit & {
  auth?: boolean;
  query?: Record<string, string | number | undefined>;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const base = apiBaseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`, window.location.origin);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export function resolveApiAssetUrl(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(value) || /^(blob|data):/i.test(value)) {
    return value;
  }

  const normalizedPath = value.startsWith("/") ? value : `/${value}`;

  if (normalizedPath.startsWith("/uploads/")) {
    const apiBase = apiBaseUrl.replace(/\/$/, "");
    return `${apiBase}${normalizedPath}`;
  }

  const base = (assetBaseUrl || apiBaseUrl).replace(/\/$/, "");
  return `${base}${normalizedPath}`;
}

function parseSseEvent(rawEvent: string) {
  let eventName = "message";
  const dataLines: string[] = [];

  rawEvent.split(/\r?\n/).forEach((line) => {
    if (!line || line.startsWith(":")) {
      return;
    }

    const separatorIndex = line.indexOf(":");
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
    const value = separatorIndex === -1 ? "" : line.slice(separatorIndex + 1).replace(/^ /, "");

    if (field === "event") {
      eventName = value || "message";
    }

    if (field === "data") {
      dataLines.push(value);
    }
  });

  return { eventName, data: dataLines.join("\n") };
}

export function connectSalesNotificationStream({
  onNotification,
  onOpen,
  onError,
}: {
  onNotification: (notification: NotificationDto) => void;
  onOpen?: () => void;
  onError?: (error: unknown) => void;
}) {
  const controller = new AbortController();
  let retryTimer: number | undefined;
  let retryDelay = 1000;

  const connect = async () => {
    try {
      const token = getAuthToken();
      const headers = new Headers({ Accept: "text/event-stream" });

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const response = await fetch(buildUrl("/api/sales/notifications/stream"), {
        headers,
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Notification stream failed with status ${response.status}`);
      }

      onOpen?.();
      retryDelay = 1000;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!controller.signal.aborted) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split(/\r?\n\r?\n/);
        buffer = chunks.pop() ?? "";

        chunks.forEach((chunk) => {
          const { eventName, data } = parseSseEvent(chunk);

          if (eventName !== "notification" || !data) {
            return;
          }

          try {
            onNotification(JSON.parse(data) as NotificationDto);
          } catch {
            onNotification({ title: "Notifikasi Baru", message: data });
          }
        });
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        onError?.(error);
      }
    }

    if (!controller.signal.aborted) {
      retryTimer = window.setTimeout(connect, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 15000);
    }
  };

  void connect();

  return () => {
    controller.abort();

    if (retryTimer) {
      window.clearTimeout(retryTimer);
    }
  };
}

export function connectAgentPreorderStream({
  onPreorderUpdated,
  onOpen,
  onError,
}: {
  onPreorderUpdated: (preorder: Partial<PreorderDto>) => void;
  onOpen?: () => void;
  onError?: (error: unknown) => void;
}) {
  const controller = new AbortController();
  let retryTimer: number | undefined;
  let retryDelay = 1000;

  const connect = async () => {
    try {
      const token = getAuthToken();
      const headers = new Headers({ Accept: "text/event-stream" });

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const response = await fetch(buildUrl("/api/agent/preorders/stream"), {
        headers,
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Preorder stream failed with status ${response.status}`);
      }

      onOpen?.();
      retryDelay = 1000;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!controller.signal.aborted) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split(/\r?\n\r?\n/);
        buffer = chunks.pop() ?? "";

        chunks.forEach((chunk) => {
          const { eventName, data } = parseSseEvent(chunk);

          if (eventName !== "preorder_updated" || !data) {
            return;
          }

          try {
            onPreorderUpdated(JSON.parse(data) as Partial<PreorderDto>);
          } catch {
            // ignore JSON parse errors
          }
        });
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        onError?.(error);
      }
    }

    if (!controller.signal.aborted) {
      retryTimer = window.setTimeout(connect, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 15000);
    }
  };

  void connect();

  return () => {
    controller.abort();

    if (retryTimer) {
      window.clearTimeout(retryTimer);
    }
  };
}

export function getAuthToken() {
  return window.localStorage.getItem(authTokenStorageKey);
}

export function saveAuthSession(token: string, user: UserSession, refreshToken?: string) {
  window.localStorage.setItem(authTokenStorageKey, token);
  if (refreshToken) {
    window.localStorage.setItem(authRefreshTokenStorageKey, refreshToken);
  }
  window.localStorage.setItem(userStorageKey, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent(authSessionUpdatedEvent, { detail: { user } }));
}

export function clearAuthSession() {
  window.localStorage.removeItem(authTokenStorageKey);
  window.localStorage.removeItem(authRefreshTokenStorageKey);
  window.localStorage.removeItem(userStorageKey);
  window.localStorage.removeItem(legacyRoleStorageKey);
  window.dispatchEvent(new CustomEvent(authSessionUpdatedEvent, { detail: { user: null } }));
}

export function getStoredUser(): UserSession | null {
  try {
    const value = window.localStorage.getItem(userStorageKey);
    return value ? (JSON.parse(value) as UserSession) : null;
  } catch {
    return null;
  }
}

function toSafeRedirectUrl(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value, window.location.origin);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

export function rememberLoginSource(sourceUrl?: string | null) {
  const safeSource = toSafeRedirectUrl(sourceUrl) || toSafeRedirectUrl(websiteAUrl);

  if (safeSource) {
    window.localStorage.setItem(loginSourceStorageKey, safeSource);
  }
}

export function rememberDefaultLoginSource() {
  if (!window.localStorage.getItem(loginSourceStorageKey)) {
    rememberLoginSource();
  }
}

export function rememberLoginSourceFromPage(searchParams?: URLSearchParams) {
  const explicitSource =
    searchParams?.get("source_url") ??
    searchParams?.get("return_url") ??
    searchParams?.get("origin_url");
  const stateSource = searchParams?.get("state");

  if (explicitSource) {
    rememberLoginSource(explicitSource);
    return;
  }

  if (stateSource && /^https?:\/\//i.test(stateSource)) {
    rememberLoginSource(stateSource);
    return;
  }

  if (document.referrer) {
    const referrerUrl = toSafeRedirectUrl(document.referrer);
    const referrerOrigin = referrerUrl ? new URL(referrerUrl).origin : "";

    if (referrerOrigin && referrerOrigin !== window.location.origin) {
      rememberLoginSource(referrerUrl);
    }
  }
}

export function getLogoutRedirectUrl() {
  const storedSource = toSafeRedirectUrl(window.localStorage.getItem(loginSourceStorageKey));
  return storedSource || toSafeRedirectUrl(defaultLogoutRedirectUrl) || "/";
}

export function clearLoginSource() {
  window.localStorage.removeItem(loginSourceStorageKey);
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = window.localStorage.getItem(authRefreshTokenStorageKey);
    if (!refreshToken) {
      throw new Error("refresh failed");
    }

    const res = await fetch(buildUrl("/api/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh_token: refreshToken,
        client: clientName,
      }),
    });

    if (!res.ok) {
      throw new Error("refresh failed");
    }

    const data = (await res.json()) as { token: string; refresh_token: string };
    window.localStorage.setItem(authTokenStorageKey, data.token);
    window.localStorage.setItem(authRefreshTokenStorageKey, data.refresh_token);

    return data.token;
  })();

  try {
    const newToken = await refreshPromise;
    return newToken;
  } finally {
    refreshPromise = null;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, query, headers, body, ...requestOptions } = options;
  const token = getAuthToken();
  const requestHeaders = new Headers(headers);

  if (body && !requestHeaders.has("Content-Type") && !(body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth && token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(buildUrl(path, query), {
    ...requestOptions,
    body,
    headers: requestHeaders,
  });

  if (response.status === 401 && auth && path !== "/api/auth/refresh") {
    try {
      const newToken = await refreshAccessToken();
      const retryHeaders = new Headers(headers);
      if (body && !retryHeaders.has("Content-Type") && !(body instanceof FormData)) {
        retryHeaders.set("Content-Type", "application/json");
      }
      retryHeaders.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(buildUrl(path, query), {
        ...requestOptions,
        body,
        headers: retryHeaders,
      });
    } catch {
      clearAuthSession();
    }
  } else if (response.status === 401) {
    clearAuthSession();
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      message = errorBody.message ?? errorBody.error ?? message;
    } catch {
      // Keep the status-based fallback when the backend returns non-JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/pdf")) {
    return (await response.blob()) as T;
  }

  return (await response.json()) as T;
}

export async function refreshStoredUser(token = getAuthToken()) {
  const response = await apiRequest<{ user: UserSession }>("/api/auth/me");

  if (token) {
    saveAuthSession(token, response.user);
  }

  return response.user;
}

export const api = {
  login: (payload: { email: string; password: string; client?: string }) =>
    apiRequest<AuthResponse>("/api/auth/login", {
      auth: false,
      method: "POST",
      body: JSON.stringify({ ...payload, client: payload.client ?? clientName }),
    }),
  register: (payload: RegisterPayload) =>
    apiRequest<{ message: string; user?: UserSession }>("/api/auth/register", {
      auth: false,
      method: "POST",
      body: JSON.stringify(payload),
    }),
  forgotPassword: (payload: { email: string }) =>
    apiRequest<{ message: string }>("/api/auth/forgot-password", {
      auth: false,
      method: "POST",
      body: JSON.stringify(payload),
    }),
  verifyResetToken: (payload: { email: string; token: string }) =>
    apiRequest<{ message: string }>("/api/auth/verify-reset-token", {
      auth: false,
      method: "POST",
      body: JSON.stringify(payload),
    }),
  resetPassword: (payload: { email: string; token: string; new_password: string }) =>
    apiRequest<{ message: string }>("/api/auth/reset-password", {
      auth: false,
      method: "POST",
      body: JSON.stringify(payload),
    }),
  applyAgent: (payload: ApplyAgentPayload) =>
    apiRequest<{ message: string }>("/api/auth/apply-agent", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  completeAgentVerification: (payload: AgentVerificationPayload) => {
    const formData = new FormData();
    formData.set("photo", payload.photo);
    formData.set("ktp_photo", payload.ktp_photo);
    formData.set("bank_name", payload.bank_name);
    formData.set("account_number", payload.account_number);
    formData.set("ttl", payload.ttl);
    formData.set("full_address", payload.full_address);
    if (payload.domicile) {
      formData.set("domicile", payload.domicile);
    }

    return apiRequest<{ message: string; user: UserSession }>("/api/auth/agent-verification", {
      method: "POST",
      body: formData,
    });
  },
  agentApplications: (status?: AgentApplicationStatus | "all") =>
    apiRequest<{ applications: AgentApplicationDto[] }>("/api/super-admin/agent-applications", {
      query: { status: status === "all" ? undefined : status },
    }),
  updateAgentApplicationStatus: (id: number, status: AgentApplicationStatus) =>
    apiRequest<{ message: string; user: AgentApplicationDto }>(`/api/super-admin/agent-applications/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  ssoExchange: (payload: { code: string; target_client?: string }) =>
    apiRequest<AuthResponse>("/api/auth/sso/exchange", {
      auth: false,
      method: "POST",
      body: JSON.stringify({ ...payload, target_client: payload.target_client ?? clientName }),
    }),
  ssoCode: (payload: { target_client: string; state?: string }) =>
    apiRequest<{ code: string; expires_at: string; redirect_url: string }>("/api/auth/sso/code", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  session: () => apiRequest<{ authenticated: boolean; user: UserSession }>("/api/auth/session"),
  me: () => apiRequest<{ user: UserSession }>("/api/auth/me"),
  logout: () => apiRequest<{ message: string }>("/api/auth/logout", { method: "POST" }),
  products: (search?: string) => apiRequest<{ products: ProductDto[] }>("/api/products", { auth: true, query: { search } }),
  productDetail: (id: number) => apiRequest<{ product: ProductDto }>(`/api/products/${id}`),
  createProduct: (payload: FormData | Record<string, unknown>) => {
    return apiRequest<{ message: string; product: ProductDto }>("/api/products", {
      method: "POST",
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    });
  },
  updateProduct: (id: number, payload: FormData | Record<string, unknown>) => {
    return apiRequest<{ message: string; product: ProductDto }>(`/api/products/${id}`, {
      method: "PUT",
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    });
  },
  deleteProduct: (id: number) => apiRequest<{ message: string }>(`/api/products/${id}`, { method: "DELETE" }),
  agentPreorders: (status?: PreorderStatus) =>
    apiRequest<{ preorders: PreorderDto[] }>("/api/agent/preorders", { query: { status } }),
  preorders: (query?: { search?: string; status?: PreorderStatus }) =>
    apiRequest<{ preorders: PreorderDto[] }>("/api/preorders", { query }),
  createPreorder: (payload: unknown) =>
    apiRequest<{ message: string; preorder: PreorderDto }>("/api/preorders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePreorder: (id: number, payload: unknown) =>
    apiRequest<{ message: string; preorder: PreorderDto }>(`/api/preorders/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deletePreorder: (id: number) => apiRequest<{ message: string }>(`/api/preorders/${id}`, { method: "DELETE" }),
  submitPreorder: (id: number) => apiRequest<{ message: string; preorder: PreorderDto }>(`/api/preorders/${id}/submit`, { method: "POST" }),
  uploadPreorderPaymentProof: (id: number, file: File) => {
    const formData = new FormData();
    formData.set("payment_proof", file);

    return apiRequest<{ message: string; preorder?: PreorderDto }>(`/api/preorders/${id}/payment-proof`, {
      method: "POST",
      body: formData,
    });
  },
  createPreorderPaymentLink: (id: number) =>
    apiRequest<PaymentLinkResponse>(`/api/preorders/${id}/payment-link`, { method: "POST" }),
  preorderPdf: (id: number) => apiRequest<Blob>(`/api/preorders/${id}/pdf`),
  confirmInvoiceReceived: (id: number) =>
    apiRequest<{ message: string; preorder: PreorderDto }>(`/api/preorders/${id}/confirm-invoice-received`, { method: "POST" }),
  salesUpdatePreorderStatus: (id: number, payload: { status: "approve" | "invalid" | "shipped" | "barang_sudah_terkirim"; invalid_reason?: string; payment_status?: PaymentStatus }) =>
    apiRequest<{ message: string; preorder: PreorderDto }>(`/api/sales/preorders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  salesSendPaymentQuotation: (id: number, stage: "full" | "dp" | "remaining") =>
    apiRequest<{ message: string; payment?: { payment_mode: string; stage: string; amount: number } }>(
      `/api/sales/preorders/${id}/payment-quotation`,
      {
        method: "POST",
        body: JSON.stringify({ stage }),
      }
    ),
  salesUploadPaymentProof: (id: number, stage: "full" | "dp" | "remaining", file: File) => {
    const formData = new FormData();
    formData.set("payment_proof", file);
    formData.set("stage", stage);

    return apiRequest<{ message: string }>(`/api/sales/preorders/${id}/payment-proof`, {
      method: "POST",
      body: formData,
    });
  },
  notifications: (status?: NotificationDto["status"]) =>
    apiRequest<{ notifications: NotificationDto[] | null }>("/api/notifications", { query: { status } }),
  notificationDetail: (id: number) => apiRequest<{ notification: NotificationDto }>(`/api/notifications/${id}`),
  markNotificationRead: (id: number) =>
    apiRequest<{ message: string; notification?: NotificationDto }>(`/api/notifications/${id}/read`, { method: "PUT" }),
  markAllNotificationsRead: () =>
    apiRequest<{ message: string }>("/api/notifications/read-all", { method: "PUT" }),
  agentWallet: () => apiRequest<{ wallet: WalletDto }>("/api/agent/wallet"),
  agentWithdraws: () => apiRequest<{ withdraws: WithdrawDto[] }>("/api/agent/withdraws"),
  createAgentWithdraw: (amount: number) =>
    apiRequest<{ message: string; withdraw: WithdrawDto }>("/api/agent/withdraws", {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
  superAdminDashboard: () => apiRequest<{ message: string }>("/api/super-admin/dashboard"),
  superAdminWithdraws: (status?: WithdrawStatus) =>
    apiRequest<{ withdraws: WithdrawDto[] }>("/api/super-admin/withdraws", { query: { status } }),
  approveWithdraw: (id: number, transferProof?: File) => {
    if (transferProof) {
      const formData = new FormData();
      formData.set("transfer_proof", transferProof);
      return apiRequest<{ message: string; withdraw: WithdrawDto }>(`/api/super-admin/withdraws/${id}/approve`, {
        method: "POST",
        body: formData,
      });
    }

    return apiRequest<{ message: string; withdraw: WithdrawDto }>(`/api/super-admin/withdraws/${id}/approve`, { method: "PUT" });
  },
  uploadWithdrawProof: (id: number, transferProof: File | string) => {
    const body = transferProof instanceof File
      ? (() => {
          const formData = new FormData();
          formData.set("transfer_proof", transferProof);
          return formData;
        })()
      : JSON.stringify({ transfer_proof: transferProof });

    return apiRequest<{ message: string; withdraw: WithdrawDto }>(`/api/super-admin/withdraws/${id}/proof`, {
      method: "POST",
      body,
    });
  },
  customerCareInvoices: () => apiRequest<{ data: CustomerCareInvoiceDto[] }>("/api/customer-care/invoices"),
  customerCareCategories: () => apiRequest<{ data: string[] }>("/api/customer-care/categories"),
  customerCareTickets: (query?: { status?: CustomerCareTicketStatus; type?: CustomerCareTicketType; category?: string }) =>
    apiRequest<{ data: CustomerCareTicketDto[] }>("/api/customer-care/tickets", { query }),
  customerCareTicketDetail: (id: number) =>
    apiRequest<{ data: CustomerCareTicketDto }>(`/api/customer-care/tickets/${id}`),
  createCustomerCareTicket: (payload: CustomerCareTicketPayload) =>
    apiRequest<{ message: string; data: CustomerCareTicketDto }>("/api/customer-care/tickets", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  uploadCustomerCareAttachments: (ticketId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files[]", file));

    return apiRequest<{ message: string; data: CustomerCareAttachmentDto[] }>(`/api/customer-care/tickets/${ticketId}/attachments`, {
      method: "POST",
      body: formData,
    });
  },
  customerCareMessages: (ticketId: number) =>
    apiRequest<{ data: CustomerCareMessageDto[] }>(`/api/customer-care/tickets/${ticketId}/messages`),
  sendCustomerCareMessage: (ticketId: number, message: string) =>
    apiRequest<{ message: string; data: CustomerCareMessageDto }>(`/api/customer-care/tickets/${ticketId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  rateCustomerCareTicket: (ticketId: number, payload: { rating: number; feedback?: string }) =>
    apiRequest<{ message: string }>(`/api/customer-care/tickets/${ticketId}/rating`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminCustomerCareTickets: (query?: { status?: CustomerCareTicketStatus; category?: string; type?: CustomerCareTicketType; pic_id?: number; overdue?: number }) =>
    apiRequest<{ data: CustomerCareTicketDto[] }>("/api/admin/customer-care/tickets", { query }),
  adminUpdateCustomerCareTicketStatus: (ticketId: number, payload: { status: CustomerCareTicketStatus; note?: string }) =>
    apiRequest<{ message: string }>(`/api/admin/customer-care/tickets/${ticketId}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  adminAssignCustomerCareTicket: (ticketId: number, picId: number) =>
    apiRequest<{ message: string }>(`/api/admin/customer-care/tickets/${ticketId}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ pic_id: picId }),
    }),
  adminCreateCustomerCareInternalNote: (ticketId: number, note: string) =>
    apiRequest<{ message: string; data: unknown }>(`/api/admin/customer-care/tickets/${ticketId}/internal-notes`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),  onboardingVideos: () => apiRequest<{ videos: OnboardingVideoDto[] }>("/api/agent/onboarding/videos"),
  onboardingProgress: () => apiRequest<OnboardingSummaryDto>("/api/agent/onboarding/progress"),
  saveOnboardingProgress: (payload: {
    video_id: number;
    watched_seconds: number;
    duration_seconds: number;
    status: OnboardingProgressStatus;
  }) =>
    apiRequest<OnboardingSummaryDto>("/api/agent/onboarding/progress", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  resetOnboardingProgress: () => apiRequest<{ message: string }>("/api/agent/onboarding/progress", { method: "DELETE" }),
  adminOnboardingVideos: () => apiRequest<{ videos: OnboardingVideoDto[] }>("/api/super-admin/onboarding/videos"),
  adminOnboardingVideoDetail: (id: number) => apiRequest<{ video: OnboardingVideoDto }>(`/api/super-admin/onboarding/videos/${id}`),
  adminCreateOnboardingVideo: (payload: OnboardingVideoPayload) =>
    apiRequest<{ message: string; video: OnboardingVideoDto }>("/api/super-admin/onboarding/videos", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminUpdateOnboardingVideo: (id: number, payload: OnboardingVideoPayload) =>
    apiRequest<{ message: string; video: OnboardingVideoDto }>(`/api/super-admin/onboarding/videos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  adminDeleteOnboardingVideo: (id: number) => apiRequest<{ message: string }>(`/api/super-admin/onboarding/videos/${id}`, { method: "DELETE" }),
  educations: (query?: { month?: string; type?: string; status?: string; page?: number; limit?: number }) =>
    apiRequest<EducationListResponse>("/api/educations", {
      auth: false,
      query,
    }),
  educationDetail: (id: string) => apiRequest<EducationDetailResponse>(`/api/educations/${id}`, { auth: false }),
  createEducation: (payload: EducationPayload) =>
    apiRequest<EducationDetailResponse>("/api/educations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateEducation: (id: string, payload: EducationPayload) =>
    apiRequest<EducationDetailResponse>(`/api/educations/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteEducation: (id: string) => apiRequest<{ success?: boolean; message?: string }>(`/api/educations/${id}`, { method: "DELETE" }),
  articles: (query?: { search?: string; status?: string; category?: string; page?: number; limit?: number }) =>
    apiRequest<{ articles: ArticleDto[]; meta: { total: number; page: number; limit: number; total_pages: number } }>("/api/articles", {
      auth: false,
      query,
    }),
  articleDetail: (id: string | number) => apiRequest<{ article: ArticleDto }>(`/api/articles/${id}`, { auth: false }),
  createArticle: (payload: ArticlePayload) =>
    apiRequest<{ message: string; article: ArticleDto }>("/api/articles", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateArticle: (id: string | number, payload: ArticlePayload) =>
    apiRequest<{ message: string; article: ArticleDto }>(`/api/articles/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteArticle: (id: string | number) => apiRequest<{ message: string }>(`/api/articles/${id}`, { method: "DELETE" }),
  importArticles: (payload: { articles: ArticlePayload[] }) =>
    apiRequest<{ message: string; created_count: number; skipped_count: number; created: ArticleDto[]; skipped_slugs: string[] }>("/api/articles/import", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  bookings: (type?: "demo" | "event" | string) =>
    apiRequest<BookingsListResponse>("/api/bookings", {
      auth: true,
      query: { type },
    }),
};




