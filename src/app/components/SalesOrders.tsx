import { CheckCircle2, Eye, Search, ShoppingCart, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type PaymentStatus, type PreorderDto, type PreorderItemDto } from "../services/api";

type PurchaseOrderStatus = "draft" | "in_review" | "approve" | "invalid";

type PurchaseOrderItem = {
  id: string;
  productId: number;
  qty: number;
  discountPercent: number;
};

type PurchaseOrder = {
  id: number;
  poNumber: string;
  status: PurchaseOrderStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  notes: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  commissionTotal: number;
  paymentStatus: PaymentStatus;
  paymentUrl?: string;
  paymentToken?: string;
  midtransOrderId?: string;
  createdAt: string;
  invalidReason?: string;
};

type Product = {
  id: number;
  name: string;
  unit: string;
};

const products: Product[] = [
  { id: 1, name: "GMT Lighting Package", unit: "paket" },
  { id: 2, name: "GMT Truss System", unit: "unit" },
  { id: 3, name: "GMT Training Seat", unit: "seat" },
];

const defaultPurchaseOrders: PurchaseOrder[] = [
  {
    id: 1008,
    poNumber: "PO-1008",
    status: "in_review",
    customerName: "PT Cahaya Eventindo",
    customerEmail: "procurement@cahayaevent.id",
    customerPhone: "081234567890",
    customerAddress: "Jl. Gatot Subroto No. 12, Jakarta",
    notes: "Butuh instalasi sebelum akhir bulan.",
    items: [
      { id: "item-1", productId: 1, qty: 1, discountPercent: 5 },
      { id: "item-2", productId: 2, qty: 1, discountPercent: 7 },
    ],
    subtotal: 55000000,
    discountTotal: 3450000,
    total: 51550000,
    commissionTotal: 5155000,
    paymentStatus: "unpaid",
    createdAt: "2026-06-11T09:15:00.000Z",
  },
  {
    id: 1007,
    poNumber: "PO-1007",
    status: "draft",
    customerName: "Bina Kreatif Production",
    customerEmail: "admin@binakreatif.id",
    customerPhone: "082112345678",
    customerAddress: "Jl. Diponegoro No. 8, Bandung",
    notes: "Masih menunggu konfirmasi qty tambahan.",
    items: [{ id: "item-1", productId: 3, qty: 4, discountPercent: 5 }],
    subtotal: 20000000,
    discountTotal: 1000000,
    total: 19000000,
    commissionTotal: 1900000,
    paymentStatus: "unpaid",
    createdAt: "2026-06-09T13:40:00.000Z",
  },
];

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

function getProduct(productId: number) {
  return products.find((product) => product.id === productId) ?? products[0];
}

function getItemProductId(item: PreorderItemDto) {
  return item.id_product ?? item.product_id ?? item.product?.id ?? 0;
}

function mapPreorder(preorder: PreorderDto): PurchaseOrder {
  const rawItems = preorder.items ?? preorder.preorder_items ?? [];

  return {
    id: preorder.id,
    poNumber: preorder.po_number ?? `PO-${preorder.id}`,
    status: preorder.status,
    customerName: preorder.nama_customer,
    customerEmail: preorder.email,
    customerPhone: preorder.no_hp,
    customerAddress: preorder.alamat,
    notes: preorder.catatan ?? "",
    items: rawItems.map((item, index) => ({
      id: String(item.id ?? `${preorder.id}-${index}`),
      productId: getItemProductId(item),
      qty: item.qty,
      discountPercent: item.discount_percent,
    })),
    subtotal: preorder.subtotal,
    discountTotal: preorder.total_discount ?? preorder.total_diskon ?? 0,
    total: preorder.total,
    commissionTotal: preorder.total_komisi,
    paymentStatus: preorder.payment_status ?? "unpaid",
    paymentUrl: preorder.payment_url ?? undefined,
    paymentToken: preorder.payment_token ?? undefined,
    midtransOrderId: preorder.midtrans_order_id ?? undefined,
    createdAt: preorder.created_at ?? new Date().toISOString(),
    invalidReason: preorder.invalid_reason ?? undefined,
  };
}

function StatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const statusMap: Record<PurchaseOrderStatus, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-slate-100 text-slate-700 ring-slate-200" },
    in_review: { label: "In review", className: "bg-sky-50 text-sky-700 ring-sky-200" },
    approve: { label: "Approve", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    invalid: { label: "Invalid", className: "bg-rose-50 text-rose-700 ring-rose-200" },
  };
  const statusMeta = statusMap[status];

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusMeta.className}`}>
      {statusMeta.label}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const statusMap: Record<PaymentStatus, { label: string; className: string }> = {
    unpaid: { label: "Unpaid", className: "bg-slate-100 text-slate-700 ring-slate-200" },
    pending: { label: "Pending", className: "bg-amber-50 text-amber-700 ring-amber-200" },
    paid: { label: "Paid", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    expired: { label: "Expired", className: "bg-slate-100 text-slate-600 ring-slate-200" },
    failed: { label: "Failed", className: "bg-rose-50 text-rose-700 ring-rose-200" },
    refund: { label: "Refund", className: "bg-violet-50 text-violet-700 ring-violet-200" },
  };
  const statusMeta = statusMap[status];

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusMeta.className}`}>
      {statusMeta.label}
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

export function SalesOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(defaultPurchaseOrders);
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "all">("in_review");
  const [searchTerm, setSearchTerm] = useState("");
  const [previewPo, setPreviewPo] = useState<PurchaseOrder | null>(null);
  const [invalidPo, setInvalidPo] = useState<PurchaseOrder | null>(null);
  const [invalidReason, setInvalidReason] = useState("");
  const [formError, setFormError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const handleSalesNotification = () => {
      void loadOrders();
    };

    window.addEventListener("sales-notification", handleSalesNotification);

    return () => {
      window.removeEventListener("sales-notification", handleSalesNotification);
    };
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();

    return purchaseOrders.filter((po) => {
      const matchesStatus = statusFilter === "all" || po.status === statusFilter;
      const matchesSearch = [po.poNumber, po.customerName, po.customerEmail, po.customerPhone]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [purchaseOrders, searchTerm, statusFilter]);

  const pendingCount = purchaseOrders.filter((po) => po.status === "in_review").length;
  const approvedCount = purchaseOrders.filter((po) => po.status === "approve").length;
  const invalidCount = purchaseOrders.filter((po) => po.status === "invalid").length;

  const approvePo = async (po: PurchaseOrder) => {
    if (po.status !== "in_review") {
      return;
    }

    try {
      await api.salesUpdatePreorderStatus(po.id, { status: "approve" });
      await loadOrders();
      setPreviewPo((currentPo) => (currentPo?.id === po.id ? { ...currentPo, status: "approve" } : currentPo));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal approve PO.");
    }
  };

  const submitInvalid = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!invalidPo) {
      return;
    }

    if (!invalidReason.trim()) {
      setFormError("Alasan invalid wajib diisi.");
      return;
    }

    try {
      await api.salesUpdatePreorderStatus(invalidPo.id, { status: "invalid", invalid_reason: invalidReason });
      await loadOrders();
      setPreviewPo((currentPo) =>
        currentPo?.id === invalidPo.id ? { ...currentPo, status: "invalid", invalidReason } : currentPo,
      );
      setInvalidPo(null);
      setInvalidReason("");
      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Gagal menyimpan status invalid.");
    }
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
              <option value="draft">Draft</option>
              <option value="all">Semua status</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-600">
                <th className="px-4 py-3 font-semibold">PO</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Komisi</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((po) => (
                <tr key={po.id} className="border-b border-slate-100 text-sm last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-950">{po.poNumber}</td>
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
                    <PaymentStatusBadge status={po.paymentStatus} />
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
                        disabled={po.status !== "in_review"}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          if (po.status === "in_review") {
                            setInvalidPo(po);
                          }
                        }}
                        disabled={po.status !== "in_review"}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Invalid
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
              <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</p>
                  <p className="mt-2 font-semibold text-slate-950">{previewPo.customerName}</p>
                  <p className="mt-1 text-sm text-slate-600">{previewPo.customerEmail}</p>
                  <p className="text-sm text-slate-600">{previewPo.customerPhone}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Alamat dan catatan</p>
                  <p className="mt-2 text-sm text-slate-700">{previewPo.customerAddress}</p>
                  <p className="mt-2 text-sm text-slate-500">{previewPo.notes || "Tidak ada catatan."}</p>
                  {previewPo.invalidReason && (
                    <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                      Alasan invalid: {previewPo.invalidReason}
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <PaymentStatusBadge status={previewPo.paymentStatus} />
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
                    {previewPo.items.map((item) => {
                      const product = getProduct(item.productId);

                      return (
                        <tr key={item.id} className="border-b border-slate-100 text-sm last:border-0">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-950">{product.name}</p>
                            <p className="text-xs text-slate-500">{product.unit}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{item.qty}</td>
                          <td className="px-4 py-3 text-slate-700">{item.discountPercent}%</td>
                        </tr>
                      );
                    })}
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
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Invalid
                  </button>
                  <button
                    onClick={() => approvePo(previewPo)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
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
                  onClick={() => {
                    setInvalidPo(null);
                    setInvalidReason("");
                    setFormError("");
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Simpan invalid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
