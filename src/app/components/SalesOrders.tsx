import { CheckCircle2, Eye, Search, ShoppingCart, Truck, X, XCircle, Upload, FileText, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { api, getStoredUser, resolveApiAssetUrl, type PaymentStatus, type PreorderDto, type PreorderItemDto } from "../services/api";
import { initClarity, setClarityTag, identifyClarityUser, pauseClarity } from "../services/clarity";
import Swal from "sweetalert2";

type PurchaseOrderStatus = "draft" | "in_review" | "approve" | "shipped" | "barang_sudah_terkirim" | "invalid";

type PurchaseOrderItem = {
  id: string;
  productId: number;
  productName: string;
  productUnit: string;
  qty: number;
  discountPercent: number;
};

type PurchaseOrder = {
  id: number;
  poNumber: string;
  status: PurchaseOrderStatus;
  agentName: string;
  agentEmail: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  notes: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  commissionTotal: number;
  paymentMode: "100%" | "50%";
  paymentStatus: PaymentStatus;
  paymentUrl?: string;
  paymentToken?: string;
  midtransOrderId?: string;
  paymentProof?: string;
  dpProof?: string;
  remainingProof?: string;
  lastPaymentStage?: string;
  createdAt: string;
  invalidReason?: string;
  invoiceReceived: boolean;
  invoiceReceivedAt?: string | null;
  trackingNumber?: string;
  estimatedArrival?: string;
};

type SalesActionLoading =
  | { type: "approve"; poId: number }
  | { type: "invalid"; poId: number }
  | { type: "shipped"; poId: number }
  | { type: "upload"; poId: number; stage: "full" | "dp" | "remaining" }
  | { type: "verify"; poId: number; stage: "full" | "dp" | "remaining" }
  | { type: "quotation"; poId: number }
  | null;

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const salesOrdersPollIntervalMs = 10000;

function getItemProductId(item: PreorderItemDto) {
  return item.id_product ?? item.product_id ?? item.product?.id ?? 0;
}

function getProductSnapshotValue(snapshot: string | undefined, keys: string[]) {
  if (!snapshot) return "";

  try {
    const parsed = JSON.parse(snapshot);
    if (!parsed || typeof parsed !== "object") return "";

    for (const key of keys) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  } catch {
    return snapshot.trim();
  }

  return "";
}

function getItemProductName(item: PreorderItemDto) {
  return (
    item.product?.namaproduct?.trim() ||
    item.product_name?.trim() ||
    item.namaproduct?.trim() ||
    getProductSnapshotValue(item.product_snapshot, ["namaproduct", "product_name", "name"]) ||
    (getItemProductId(item) ? `Produk #${getItemProductId(item)}` : "Produk tidak tersedia")
  );
}

function getItemProductUnit(item: PreorderItemDto) {
  return (
    item.product?.unit?.trim() ||
    getProductSnapshotValue(item.product_snapshot, ["unit", "satuan"]) ||
    "unit"
  );
}

function getPreorderAgent(preorder: PreorderDto) {
  const agentName =
    preorder.agent?.name?.trim() ||
    preorder.user?.name?.trim() ||
    preorder.agent_name?.trim() ||
    preorder.sales_agent_name?.trim() ||
    preorder.user_name?.trim() ||
    "Agent tidak tersedia";
  const agentEmail =
    preorder.agent?.email?.trim() ||
    preorder.user?.email?.trim() ||
    preorder.agent_email?.trim() ||
    preorder.sales_agent_email?.trim() ||
    preorder.user_email?.trim() ||
    "";

  return { agentName, agentEmail };
}

function mapPreorder(preorder: PreorderDto): PurchaseOrder {
  const rawItems = preorder.items ?? preorder.preorder_items ?? [];
  const agent = getPreorderAgent(preorder);

  return {
    id: preorder.id,
    poNumber: preorder.po_number ?? `PO-${preorder.id}`,
    status: preorder.status,
    agentName: agent.agentName,
    agentEmail: agent.agentEmail,
    customerName: preorder.nama_customer,
    customerCompany: preorder.nama_perusahaan ?? "",
    customerEmail: preorder.email,
    customerPhone: preorder.no_hp,
    customerAddress: preorder.alamat,
    notes: preorder.catatan ?? "",
    items: rawItems.map((item, index) => ({
      id: String(item.id ?? `${preorder.id}-${index}`),
      productId: getItemProductId(item),
      productName: getItemProductName(item),
      productUnit: getItemProductUnit(item),
      qty: item.qty,
      discountPercent: item.discount_percent,
    })),
    subtotal: preorder.subtotal,
    discountTotal: preorder.total_discount ?? preorder.total_diskon ?? 0,
    total: preorder.total,
    commissionTotal: preorder.total_komisi,
    paymentMode: (preorder.payment_mode === "split" || preorder.payment_mode === "50%" || preorder.payment_mode === "50") ? "50%" : "100%",
    paymentStatus: preorder.payment_status ?? "unpaid",
    paymentUrl: preorder.payment_url ?? undefined,
    paymentToken: preorder.payment_token ?? undefined,
    midtransOrderId: preorder.midtrans_order_id ?? undefined,
    paymentProof: preorder.payment_proof ?? undefined,
    dpProof: preorder.dp_proof ?? undefined,
    remainingProof: preorder.remaining_proof ?? undefined,
    lastPaymentStage: preorder.last_payment_stage ?? undefined,
    createdAt: preorder.created_at ?? new Date().toISOString(),
    invalidReason: preorder.invalid_reason ?? undefined,
    invoiceReceived: Boolean(preorder.invoice_received),
    invoiceReceivedAt: preorder.invoice_received_at ?? null,
    trackingNumber: preorder.tracking_number ?? undefined,
    estimatedArrival: preorder.estimated_arrival ?? undefined,
  };
}

function StatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const statusMap: Record<PurchaseOrderStatus, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-slate-100 text-slate-700 ring-slate-200" },
    in_review: { label: "In review", className: "bg-sky-50 text-sky-700 ring-sky-200" },
    approve: { label: "Approve", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    invalid: { label: "Invalid", className: "bg-rose-50 text-rose-700 ring-rose-200" },
    shipped: { label: "Terkirim", className: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
    barang_sudah_terkirim: { label: "Terkirim", className: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  };
  const statusMeta = statusMap[status] ?? { label: status ?? "Draft", className: "bg-slate-100 text-slate-700 ring-slate-200" };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusMeta.className} whitespace-nowrap`}>
      {statusMeta.label}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const statusMap: Record<PaymentStatus, { label: string; className: string }> = {
    unpaid: { label: "Unpaid", className: "bg-slate-100 text-slate-700 ring-slate-200" },
    pending: { label: "Pending", className: "bg-amber-50 text-amber-700 ring-amber-200" },
    paid: { label: "Paid", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    shipped: { label: "Shipped", className: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
    barang_sudah_terkirim: { label: "Shipped", className: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
    expired: { label: "Expired", className: "bg-slate-100 text-slate-600 ring-slate-200" },
    failed: { label: "Failed", className: "bg-rose-50 text-rose-700 ring-rose-200" },
    refund: { label: "Refund", className: "bg-violet-50 text-violet-700 ring-violet-200" },
  };
  const statusMeta = statusMap[status] || statusMap.unpaid;

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusMeta.className} whitespace-nowrap`}>
      {statusMeta.label}
    </span>
  );
}

function getCustomPaymentBadge(po: PurchaseOrder) {
  const isDpMode = po.paymentMode === "split" || po.paymentMode === "50%";
  if (isDpMode) {
    if (po.paymentStatus === "pending") {
      return (
        <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 bg-amber-50 text-amber-700 ring-amber-200 whitespace-nowrap">
          Menunggu Verifikasi Pembayaran
        </span>
      );
    }
    if (po.paymentStatus === "unpaid") {
      return (
        <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 bg-amber-50 text-amber-700 ring-amber-200 whitespace-nowrap">
          Bukti DP belum di-upload / Belum bayar DP
        </span>
      );
    }
    if (po.paymentStatus === "partial") {
      return (
        <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 bg-sky-50 text-sky-700 ring-sky-200 whitespace-nowrap">
          DP Masuk, Pelunasan belum selesai
        </span>
      );
    }
    if (po.paymentStatus === "paid") {
      return (
        <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 bg-emerald-50 text-emerald-700 ring-emerald-200 whitespace-nowrap">
          Lunas
        </span>
      );
    }
  }

  // Fallback / Full Payment mode
  if (po.paymentStatus === "paid") {
    return (
      <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 bg-emerald-50 text-emerald-700 ring-emerald-200 whitespace-nowrap">
        Lunas
      </span>
    );
  }
  if (po.paymentStatus === "pending") {
    return (
      <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 bg-amber-50 text-amber-700 ring-amber-200 whitespace-nowrap">
        Menunggu Verifikasi
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 bg-slate-100 text-slate-700 ring-slate-200 whitespace-nowrap">
      Belum bayar
    </span>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function openProcessingAlert(title: string, text: string) {
  void Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

export function SalesOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "all">("in_review");
  const [searchTerm, setSearchTerm] = useState("");
  const [previewPo, setPreviewPo] = useState<PurchaseOrder | null>(null);
  const [invalidPo, setInvalidPo] = useState<PurchaseOrder | null>(null);
  const [invalidReason, setInvalidReason] = useState("");
  const [formError, setFormError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<SalesActionLoading>(null);
  const [shippingPo, setShippingPo] = useState<PurchaseOrder | null>(null);
  const [shippingTrackingNumber, setShippingTrackingNumber] = useState("");
  const [shippingEstimatedArrival, setShippingEstimatedArrival] = useState("");
  const [shippingFormError, setShippingFormError] = useState("");

  const isActionLoading = (poId: number, type?: NonNullable<SalesActionLoading>["type"]) =>
    actionLoading?.poId === poId && (!type || actionLoading.type === type);

  const refreshPreviewPo = async (poId: number) => {
    const response = await api.preorders();
    const updatedPo = response.preorders.map(mapPreorder).find((item) => item.id === poId);

    if (updatedPo) {
      setPreviewPo(updatedPo);
    }
  };

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    setErrorMessage("");

    try {
      const response = await api.preorders({
        search: searchTerm,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setPurchaseOrders(response.preorders.map(mapPreorder));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat data PO sales.");
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    initClarity();
    setClarityTag("page", "sales_orders_po");
    const storedUser = getStoredUser();
    if (storedUser?.id) {
      identifyClarityUser(storedUser.id, storedUser.name || storedUser.email);
    }
    return () => {
      pauseClarity();
    };
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const handleSalesNotification = () => {
      void loadOrders(true);
    };

    window.addEventListener("sales-notification", handleSalesNotification);

    return () => {
      window.removeEventListener("sales-notification", handleSalesNotification);
    };
  }, [loadOrders]);

  useEffect(() => {
    const pollTimer = window.setInterval(() => {
      void loadOrders(true);
    }, salesOrdersPollIntervalMs);

    return () => {
      window.clearInterval(pollTimer);
    };
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();

    return purchaseOrders.filter((po) => {
      const matchesStatus = statusFilter === "all" || po.status === statusFilter;
      const matchesSearch = [po.poNumber, po.agentName, po.agentEmail, po.customerName, po.customerEmail, po.customerPhone]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [purchaseOrders, searchTerm, statusFilter]);

  const pendingCount = purchaseOrders.filter((po) => po.status === "in_review").length;
  const approvedCount = purchaseOrders.filter((po) => po.status === "approve").length;
  const invalidCount = purchaseOrders.filter((po) => po.status === "invalid").length;
  const shippedCount = purchaseOrders.filter((po) => po.status === "shipped" || po.status === "barang_sudah_terkirim").length;

  const approvePo = async (po: PurchaseOrder) => {
    if (po.status !== "in_review" || actionLoading) {
      return;
    }

    setActionLoading({ type: "approve", poId: po.id });
    openProcessingAlert("Memproses approve", "Mohon tunggu sampai status PO benar-benar tersimpan.");

    try {
      await api.salesUpdatePreorderStatus(po.id, { status: "approve" });
      await loadOrders(true);
      await refreshPreviewPo(po.id);
      await Swal.fire({
        title: "Approve selesai",
        text: "PO berhasil di-approve dan data sales sudah diperbarui.",
        icon: "success",
        confirmButtonColor: "#0F766E",
      });
    } catch (error) {
      Swal.close();
      setErrorMessage(error instanceof Error ? error.message : "Gagal approve PO.");
      await Swal.fire({
        title: "Gagal",
        text: error instanceof Error ? error.message : "Gagal approve PO.",
        icon: "error",
        confirmButtonColor: "#0F766E",
      });
    } finally {
      setActionLoading(null);
    }
  };


  const openShippingModal = (po: PurchaseOrder) => {
    if ((po.status !== "approve" && po.paymentStatus !== "paid") || actionLoading) {
      return;
    }
    setShippingPo(po);
    setShippingTrackingNumber("");
    setShippingEstimatedArrival("");
    setShippingFormError("");
  };

  const submitShipping = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!shippingPo || actionLoading) {
      return;
    }

    if (!shippingTrackingNumber.trim()) {
      setShippingFormError("Nomor resi wajib diisi.");
      return;
    }

    if (!shippingEstimatedArrival) {
      setShippingFormError("Estimasi tiba wajib diisi.");
      return;
    }

    setActionLoading({ type: "shipped", poId: shippingPo.id });
    openProcessingAlert("Menyimpan data pengiriman", "Mohon tunggu sampai status PO diperbarui.");

    try {
      await api.salesUpdateShippingStatus(shippingPo.id, {
        shipping_status: "shipped",
        tracking_number: shippingTrackingNumber.trim(),
        estimated_arrival: shippingEstimatedArrival,
      });
      await loadOrders(true);
      await refreshPreviewPo(shippingPo.id);
      setShippingPo(null);
      setShippingTrackingNumber("");
      setShippingEstimatedArrival("");
      setShippingFormError("");
      await Swal.fire({
        title: "Status diperbarui",
        text: "PO berhasil ditandai barang terkirim.",
        icon: "success",
        confirmButtonColor: "#0F766E",
      });
    } catch (error) {
      Swal.close();
      setShippingFormError(error instanceof Error ? error.message : "Gagal menandai barang terkirim.");
      await Swal.fire({
        title: "Gagal",
        text: error instanceof Error ? error.message : "Gagal menandai barang terkirim.",
        icon: "error",
        confirmButtonColor: "#0F766E",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const confirmInvoiceReceived = async (po: PurchaseOrder) => {
    const isShipped = po.status === "shipped" || po.status === "barang_sudah_terkirim";

    if (!isShipped || po.invoiceReceived || actionLoading) {
      return;
    }

    const result = await Swal.fire({
      title: "Konfirmasi invoice diterima?",
      text: `${po.poNumber} akan ditandai sudah diterima oleh customer.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0F766E",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, sudah diterima",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) {
      return;
    }

    setActionLoading({ type: "confirm-invoice", poId: po.id });
    openProcessingAlert("Menyimpan konfirmasi", "Mohon tunggu sampai status penerimaan invoice tersimpan.");

    try {
      await api.confirmInvoiceReceived(po.id);
      await loadOrders(true);
      await refreshPreviewPo(po.id);
      await Swal.fire({
        title: "Konfirmasi tersimpan",
        text: "Invoice/barang sudah ditandai diterima customer.",
        icon: "success",
        confirmButtonColor: "#0F766E",
      });
    } catch (error) {
      Swal.close();
      setErrorMessage(error instanceof Error ? error.message : "Gagal menyimpan konfirmasi invoice diterima.");
    } finally {
      setActionLoading(null);
    }
  };
  const handleVerifyPayment = async (po: PurchaseOrder, stage: "full" | "dp" | "remaining", status: "approve" | "reject") => {
    if (actionLoading) {
      return;
    }

    const actionText = status === "approve" ? "menyetujui" : "menolak";
    
    const result = await Swal.fire({
      title: `${status === "approve" ? "Setujui" : "Tolak"} Bukti Pembayaran?`,
      text: `Anda yakin ingin ${actionText} bukti pembayaran ini?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: status === "approve" ? "#0F766E" : "#E11D48",
      cancelButtonColor: "#64748B",
      confirmButtonText: `Ya, ${actionText}`,
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) {
      return;
    }

    setActionLoading({ type: "verify", poId: po.id, stage });
    openProcessingAlert("Memverifikasi pembayaran", "Mohon tunggu sampai status pembayaran diperbarui.");

    try {
      await api.salesVerifyPayment(po.id, { stage, status });
      await loadOrders(true);
      await refreshPreviewPo(po.id);
      await Swal.fire({
        title: "Berhasil",
        text: `Bukti pembayaran berhasil di${status === "approve" ? "setujui" : "tolak"}.`,
        icon: "success",
        confirmButtonColor: "#0F766E",
      });
    } catch (error) {
      Swal.close();
      await Swal.fire({
        title: "Gagal",
        text: error instanceof Error ? error.message : "Gagal memverifikasi bukti pembayaran.",
        icon: "error",
        confirmButtonColor: "#0F766E",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendRemainingQuotation = async (po: PurchaseOrder) => {
    const result = await Swal.fire({
      title: "Kirim Tagihan Pelunasan?",
      text: "Apakah Anda yakin ingin mengirimkan tagihan pelunasan (Quotation Pelunasan) ke customer?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Kirim",
      cancelButtonText: "Batal",
      confirmButtonColor: "#0F766E",
      cancelButtonColor: "#EF4444",
    });

    if (result.isConfirmed) {
      if (actionLoading) {
        return;
      }

      setActionLoading({ type: "quotation", poId: po.id });
      openProcessingAlert("Mengirim tagihan", "Mohon tunggu sampai tagihan pelunasan terkirim dan data PO diperbarui.");

      try {
        await api.salesSendPaymentQuotation(po.id, "remaining");
        await loadOrders(true);
        await refreshPreviewPo(po.id);
        await Swal.fire({
          title: "Terkirim",
          text: "Tagihan pelunasan berhasil dikirim ke customer dan data PO sudah diperbarui.",
          icon: "success",
          confirmButtonColor: "#0F766E",
        });
      } catch (error) {
        Swal.close();
        await Swal.fire({
          title: "Gagal",
          text: error instanceof Error ? error.message : "Gagal mengirim tagihan pelunasan.",
          icon: "error",
          confirmButtonColor: "#0F766E",
        });
      } finally {
        setActionLoading(null);
      }
    }
  };

  const submitInvalid = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!invalidPo || actionLoading) {
      return;
    }

    if (!invalidReason.trim()) {
      setFormError("Alasan invalid wajib diisi.");
      return;
    }

    setActionLoading({ type: "invalid", poId: invalidPo.id });
    openProcessingAlert("Menyimpan invalid", "Mohon tunggu sampai status PO benar-benar tersimpan.");

    try {
      await api.salesUpdatePreorderStatus(invalidPo.id, { status: "invalid", invalid_reason: invalidReason });
      await loadOrders(true);
      setPreviewPo((currentPo) =>
        currentPo?.id === invalidPo.id ? { ...currentPo, status: "invalid", invalidReason } : currentPo,
      );
      setInvalidPo(null);
      setInvalidReason("");
      setFormError("");
      await Swal.fire({
        title: "Invalid selesai",
        text: "PO berhasil ditandai invalid dan data sales sudah diperbarui.",
        icon: "success",
        confirmButtonColor: "#0F766E",
      });
    } catch (error) {
      Swal.close();
      setFormError(error instanceof Error ? error.message : "Gagal menyimpan status invalid.");
      await Swal.fire({
        title: "Gagal",
        text: error instanceof Error ? error.message : "Gagal menyimpan status invalid.",
        icon: "error",
        confirmButtonColor: "#0F766E",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const renderPaymentVerificationSection = (po: PurchaseOrder) => {
    const isDpMode = po.paymentMode === "split" || po.paymentMode === "50%";
    const isVerifyingDp = actionLoading?.type === "verify" && actionLoading.poId === po.id && actionLoading.stage === "dp";
    const isVerifyingRemaining =
      actionLoading?.type === "verify" && actionLoading.poId === po.id && actionLoading.stage === "remaining";
    const isVerifyingFull =
      actionLoading?.type === "verify" && actionLoading.poId === po.id && actionLoading.stage === "full";

    if (isDpMode) {
      if (po.paymentStatus !== "paid" && po.paymentStatus !== "partial") {
        if (po.dpProof) {
          return (
            <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 mt-5">
              <p className="text-sm font-semibold text-slate-700">Verifikasi Pembayaran DP</p>
              <p className="text-xs text-slate-500">
                Customer telah mengupload bukti DP. Silakan verifikasi untuk melanjutkan.
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => void handleVerifyPayment(po, "dp", "approve")}
                  disabled={Boolean(actionLoading)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isVerifyingDp ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Setujui
                </button>
                <button
                  onClick={() => void handleVerifyPayment(po, "dp", "reject")}
                  disabled={Boolean(actionLoading)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isVerifyingDp ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Tolak
                </button>
              </div>
            </div>
          );
        } else if (po.status === "approve") {
          return (
            <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 mt-5">
              <p className="text-sm font-semibold text-amber-600">
                * Menunggu customer mengupload bukti DP.
              </p>
            </div>
          );
        }
      }

      if (po.paymentStatus === "partial" || (po.remainingProof && po.paymentStatus !== "paid")) {
        if (po.remainingProof) {
          return (
            <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 mt-5">
              <p className="text-sm font-semibold text-slate-700">Verifikasi Pelunasan</p>
              <p className="text-xs text-slate-500">
                Customer telah mengupload bukti pelunasan. Silakan verifikasi untuk melanjutkan.
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => void handleVerifyPayment(po, "remaining", "approve")}
                  disabled={Boolean(actionLoading)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isVerifyingRemaining ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Setujui
                </button>
                <button
                  onClick={() => void handleVerifyPayment(po, "remaining", "reject")}
                  disabled={Boolean(actionLoading)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isVerifyingRemaining ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Tolak
                </button>
              </div>
            </div>
          );
        } else if (po.status === "approve") {
          return (
            <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 mt-5">
              <p className="text-sm font-semibold text-sky-600">
                * Menunggu customer mengupload bukti pelunasan.
              </p>
            </div>
          );
        }
      }
    } else {
      // Full Payment mode
      if (po.paymentStatus !== "paid") {
        if (po.paymentProof) {
          return (
            <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 mt-5">
              <p className="text-sm font-semibold text-slate-700">Verifikasi Bukti Pembayaran</p>
              <p className="text-xs text-slate-500">
                Customer telah mengupload bukti pembayaran penuh. Silakan verifikasi untuk menyelesaikan pesanan.
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => void handleVerifyPayment(po, "full", "approve")}
                  disabled={Boolean(actionLoading)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isVerifyingFull ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Setujui
                </button>
                <button
                  onClick={() => void handleVerifyPayment(po, "full", "reject")}
                  disabled={Boolean(actionLoading)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isVerifyingFull ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Tolak
                </button>
              </div>
            </div>
          );
        } else if (po.status === "approve") {
          return (
            <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 mt-5">
              <p className="text-sm font-semibold text-slate-600">
                * Menunggu customer mengupload bukti pembayaran.
              </p>
            </div>
          );
        }
      }
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">Sales</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Review Purchase Order</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Lihat PO yang dikirim agent, cek detail customer dan item, lalu update status menjadi approve atau invalid.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-semibold text-[#0F766E] ring-1 ring-teal-200">
          <ShoppingCart className="h-4 w-4" />
          Review order masuk
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total PO" value={String(purchaseOrders.length)} detail="Semua status" />
        <StatCard label="In review" value={String(pendingCount)} detail="Menunggu keputusan sales" />
        <StatCard label="Approved" value={String(approvedCount)} detail="Komisi agent masuk wallet" />
        <StatCard label="Invalid" value={String(invalidCount)} detail="Ditolak dengan alasan" />
        <StatCard label="Terkirim" value={String(shippedCount)} detail="Barang sudah terkirim" />
      </section>

      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">List order</h2>
            <p className="mt-1 text-sm text-slate-500">PO status in_review bisa di-approve atau dibuat invalid.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari PO, customer, phone..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 sm:w-72"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as PurchaseOrderStatus | "all")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
            >
              <option value="in_review">In review</option>
              <option value="approve">Approved</option>
              <option value="invalid">Invalid</option>
              <option value="shipped">Barang terkirim</option>
              <option value="draft">Draft</option>
              <option value="all">Semua status</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-600">
                <th className="px-4 py-3 font-semibold">PO</th>
                <th className="px-4 py-3 font-semibold">Agent</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Komisi</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Mode</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((po) => {
                const isApproving = isActionLoading(po.id, "approve");
                const isInvalidating = isActionLoading(po.id, "invalid");
                const isShipping = isActionLoading(po.id, "shipped");

                return (
                <tr key={po.id} className="border-b border-slate-100 text-sm last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-950">{po.poNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{po.agentName}</p>
                    {po.agentEmail && <p className="text-xs text-slate-500">{po.agentEmail}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{po.customerName}</p>
                    <p className="text-xs text-slate-500">{po.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{po.items.length} product</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{currencyFormatter.format(po.total)}</td>
                  <td className="px-4 py-3 font-semibold text-[#0F766E]">{currencyFormatter.format(po.commissionTotal)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={po.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                      (po.paymentMode === "split" || po.paymentMode === "50%")
                        ? "bg-teal-50 text-[#0F766E] ring-teal-200"
                        : "bg-slate-100 text-slate-700 ring-slate-200"
                    }`}>
                      {(po.paymentMode === "split" || po.paymentMode === "50%") ? "DP 50%" : "Full Payment"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getCustomPaymentBadge(po)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{dateFormatter.format(new Date(po.createdAt))}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setPreviewPo(po)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Detail
                      </button>
                      <button
                        onClick={() => approvePo(po)}
                        disabled={po.status !== "in_review" || Boolean(actionLoading)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      >
                        {isApproving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        {isApproving ? "Memproses..." : "Approve"}
                      </button>
                      <button
                        onClick={() => {
                          if (po.status === "in_review" && !actionLoading) {
                            setInvalidPo(po);
                          }
                        }}
                        disabled={po.status !== "in_review" || Boolean(actionLoading)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      >
                        {isInvalidating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                        {isInvalidating ? "Memproses..." : "Invalid"}
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          {isLoading && <div className="px-4 py-5 text-sm text-slate-500">Memuat order sales...</div>}
        </div>
      </section>

      {previewPo && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-4 w-full max-w-4xl rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-950">Detail {previewPo.poNumber}</h2>
                  <StatusBadge status={previewPo.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Dibuat {dateFormatter.format(new Date(previewPo.createdAt))}
                </p>
              </div>
              <button onClick={() => setPreviewPo(null)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agent</p>
                  <p className="mt-2 font-semibold text-slate-950">{previewPo.agentName}</p>
                  {previewPo.agentEmail && <p className="mt-1 text-sm text-slate-600">{previewPo.agentEmail}</p>}
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</p>
                  <p className="mt-2 font-semibold text-slate-950">{previewPo.customerName}</p>
                  {previewPo.customerCompany && (
                    <p className="mt-1 text-sm font-medium text-slate-700">{previewPo.customerCompany}</p>
                  )}
                  <p className="mt-1 text-xs font-medium text-slate-500">Jika perorangan, isi dengan nama customer.</p>
                  <p className="mt-1 text-sm text-slate-600">{previewPo.customerEmail}</p>
                  <p className="text-sm text-slate-600">{previewPo.customerPhone}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Alamat dan catatan</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Alamat dapat diisi atau ditentukan melalui pin Google Maps.</p>
                  <p className="mt-2 text-sm text-slate-700">{previewPo.customerAddress}</p>
                  <p className="mt-2 text-sm text-slate-500">{previewPo.notes || "Tidak ada catatan."}</p>
                  {previewPo.invoiceReceived && (
                    <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                      Invoice/barang diterima customer{previewPo.invoiceReceivedAt ? ` pada ${dateFormatter.format(new Date(previewPo.invoiceReceivedAt))}` : ""}.
                    </p>
                  )}
                  {previewPo.invalidReason && (
                    <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                      Alasan invalid: {previewPo.invalidReason}
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</p>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">Status:</span>
                    {getCustomPaymentBadge(previewPo)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">Skema:</span>
                    <span className="inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-[#0F766E] ring-1 ring-teal-200">
                      {(previewPo.paymentMode === "split" || previewPo.paymentMode === "50%" || previewPo.paymentMode === "50") ? "DP 50%" : "Full Payment"}
                    </span>
                  </div>
                  {previewPo.paymentUrl ? (
                    <a
                      href={previewPo.paymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-[#0F766E] hover:text-[#115E59]"
                    >
                      Buka Midtrans
                    </a>
                  ) : (
                    <span className="text-sm text-slate-600">Payment Link: belum dibuat</span>
                  )}
                </div>
                {previewPo.midtransOrderId && (
                  <p className="mt-2 text-xs text-slate-500">Midtrans Order ID: {previewPo.midtransOrderId}</p>
                )}
                {/* Proof of Payment Display */}
                {(previewPo.dpProof || previewPo.remainingProof || previewPo.paymentProof) && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Bukti Pembayaran / Transfer</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {(previewPo.paymentMode === "split" || previewPo.paymentMode === "50%") ? (
                        <>
                          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                            <p className="text-xs font-semibold text-slate-500 mb-2">Bukti Pembayaran DP (50%)</p>
                            {previewPo.dpProof ? (
                              <div>
                                {previewPo.dpProof.toLowerCase().includes(".pdf") ? (
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-8 w-8 text-rose-600 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-slate-700 truncate">{previewPo.dpProof.split("/").pop()}</p>
                                      <a
                                        href={resolveApiAssetUrl(previewPo.dpProof)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-semibold text-[#0F766E] hover:underline"
                                      >
                                        Buka PDF
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <a
                                      href={resolveApiAssetUrl(previewPo.dpProof)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block overflow-hidden rounded border border-slate-200 hover:opacity-90 max-h-32"
                                    >
                                      <img
                                        src={resolveApiAssetUrl(previewPo.dpProof)}
                                        alt="Bukti DP"
                                        className="h-32 w-full object-contain bg-slate-50"
                                      />
                                    </a>
                                    <a
                                      href={resolveApiAssetUrl(previewPo.dpProof)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-block text-xs font-semibold text-[#0F766E] hover:underline"
                                    >
                                      Lihat Detail Gambar
                                    </a>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs italic text-slate-400">Belum di-upload</p>
                            )}
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                            <p className="text-xs font-semibold text-slate-500 mb-2">Bukti Pembayaran Pelunasan</p>
                            {previewPo.remainingProof ? (
                              <div>
                                {previewPo.remainingProof.toLowerCase().includes(".pdf") ? (
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-8 w-8 text-rose-600 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-slate-700 truncate">{previewPo.remainingProof.split("/").pop()}</p>
                                      <a
                                        href={resolveApiAssetUrl(previewPo.remainingProof)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-semibold text-[#0F766E] hover:underline"
                                      >
                                        Buka PDF
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <a
                                      href={resolveApiAssetUrl(previewPo.remainingProof)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block overflow-hidden rounded border border-slate-200 hover:opacity-90 max-h-32"
                                    >
                                      <img
                                        src={resolveApiAssetUrl(previewPo.remainingProof)}
                                        alt="Bukti Pelunasan"
                                        className="h-32 w-full object-contain bg-slate-50"
                                      />
                                    </a>
                                    <a
                                      href={resolveApiAssetUrl(previewPo.remainingProof)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-block text-xs font-semibold text-[#0F766E] hover:underline"
                                    >
                                      Lihat Detail Gambar
                                    </a>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs italic text-slate-400">Belum di-upload</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:col-span-2">
                          <p className="text-xs font-semibold text-slate-500 mb-2">Bukti Pembayaran Penuh (100%)</p>
                          {previewPo.paymentProof ? (
                            <div>
                              {previewPo.paymentProof.toLowerCase().includes(".pdf") ? (
                                <div className="flex items-center gap-2">
                                  <FileText className="h-8 w-8 text-rose-600 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-700 truncate">{previewPo.paymentProof.split("/").pop()}</p>
                                    <a
                                      href={resolveApiAssetUrl(previewPo.paymentProof)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs font-semibold text-[#0F766E] hover:underline"
                                    >
                                      Buka PDF
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <a
                                    href={resolveApiAssetUrl(previewPo.paymentProof)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-block overflow-hidden rounded border border-slate-200 hover:opacity-90 max-h-32 animate-fade-in"
                                  >
                                    <img
                                      src={resolveApiAssetUrl(previewPo.paymentProof)}
                                      alt="Bukti Pembayaran Penuh"
                                      className="h-32 w-full object-contain bg-slate-50"
                                    />
                                  </a>
                                  <div>
                                    <a
                                      href={resolveApiAssetUrl(previewPo.paymentProof)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs font-semibold text-[#0F766E] hover:underline"
                                    >
                                      Lihat Detail Gambar
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs italic text-slate-400">Belum di-upload</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {renderPaymentVerificationSection(previewPo)}
              </section>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-600">
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold">Qty</th>
                      <th className="px-4 py-3 font-semibold">Diskon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewPo.items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 text-sm last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-950">{item.productName}</p>
                          <p className="text-xs text-slate-500">{item.productUnit}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{item.qty}</td>
                        <td className="px-4 py-3 text-slate-700">{item.discountPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <section className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subtotal</p>
                  <p className="mt-1 font-bold text-slate-950">{currencyFormatter.format(previewPo.subtotal)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total diskon</p>
                  <p className="mt-1 font-bold text-slate-950">{currencyFormatter.format(previewPo.discountTotal)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total price</p>
                  <p className="mt-1 font-bold text-slate-950">{currencyFormatter.format(previewPo.total)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#0F766E]">Total komisi</p>
                  <p className="mt-1 font-bold text-[#0F766E]">{currencyFormatter.format(previewPo.commissionTotal)}</p>
                </div>
              </section>

              {previewPo.status === "in_review" && (
                <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => setInvalidPo(previewPo)}
                    disabled={Boolean(actionLoading)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                  >
                    {isActionLoading(previewPo.id, "invalid") ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {isActionLoading(previewPo.id, "invalid") ? "Memproses..." : "Invalid"}
                  </button>
                  <button
                    onClick={() => approvePo(previewPo)}
                    disabled={Boolean(actionLoading)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isActionLoading(previewPo.id, "approve") ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {isActionLoading(previewPo.id, "approve") ? "Memproses..." : "Approve"}
                  </button>
                </div>
              )}

              {previewPo.status === "approve" && previewPo.paymentStatus === "paid" && (
                <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => openShippingModal(previewPo)}
                    disabled={Boolean(actionLoading)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Truck className="h-4 w-4" />
                    Tandai barang terkirim
                  </button>
                </div>
              )}

              {(previewPo.status === "shipped" || previewPo.status === "barang_sudah_terkirim") && previewPo.trackingNumber && (
                <div className="border-t border-slate-200 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Info Pengiriman</p>
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 space-y-1">
                    <p className="text-sm text-slate-700"><span className="font-semibold">No. Resi:</span> {previewPo.trackingNumber}</p>
                    {previewPo.estimatedArrival && (
                      <p className="text-sm text-slate-700"><span className="font-semibold">Estimasi Tiba:</span> {new Date(previewPo.estimatedArrival).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</p>
                    )}
                  </div>
                </div>
              )}

              {previewPo.status === "approve" && (previewPo.paymentMode === "split" || previewPo.paymentMode === "50%") && previewPo.paymentStatus === "partial" && (
                <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => handleSendRemainingQuotation(previewPo)}
                    disabled={Boolean(actionLoading)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isActionLoading(previewPo.id, "quotation") ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {isActionLoading(previewPo.id, "quotation") ? "Mengirim..." : "Kirim Tagihan Pelunasan"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {invalidPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Tandai PO invalid</h2>
                <p className="mt-1 text-sm text-slate-500">{invalidPo.poNumber} - {invalidPo.customerName}</p>
              </div>
              <button
                onClick={() => {
                  setInvalidPo(null);
                  setInvalidReason("");
                  setFormError("");
                }}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitInvalid} className="space-y-4 p-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Alasan invalid</span>
                <textarea
                  value={invalidReason}
                  onChange={(event) => setInvalidReason(event.target.value)}
                  className="min-h-28 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                  placeholder="Contoh: Data customer tidak valid"
                />
              </label>

              {formError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={Boolean(actionLoading)}
                  onClick={() => {
                    setInvalidPo(null);
                    setInvalidReason("");
                    setFormError("");
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={Boolean(actionLoading)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isActionLoading(invalidPo.id, "invalid") && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isActionLoading(invalidPo.id, "invalid") ? "Menyimpan..." : "Simpan invalid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {shippingPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Tandai Barang Terkirim</h2>
                <p className="mt-1 text-sm text-slate-500">{shippingPo.poNumber} - {shippingPo.customerName}</p>
              </div>
              <button
                onClick={() => {
                  setShippingPo(null);
                  setShippingTrackingNumber("");
                  setShippingEstimatedArrival("");
                  setShippingFormError("");
                }}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitShipping} className="space-y-4 p-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Nomor Resi / Tracking Number <span className="text-rose-500">*</span></span>
                <input
                  type="text"
                  value={shippingTrackingNumber}
                  onChange={(event) => setShippingTrackingNumber(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                  placeholder="Contoh: JNE123456789"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Estimasi Tiba <span className="text-rose-500">*</span></span>
                <input
                  type="date"
                  value={shippingEstimatedArrival}
                  onChange={(event) => setShippingEstimatedArrival(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                />
              </label>

              {shippingFormError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {shippingFormError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={Boolean(actionLoading)}
                  onClick={() => {
                    setShippingPo(null);
                    setShippingTrackingNumber("");
                    setShippingEstimatedArrival("");
                    setShippingFormError("");
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={Boolean(actionLoading)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isActionLoading(shippingPo.id, "shipped") && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isActionLoading(shippingPo.id, "shipped") ? "Menyimpan..." : "Simpan & Kirim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}








