import {
  ArrowLeft,
  Eye,
  FileDown,
  FileText,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, resolveApiAssetUrl, type PaymentStatus, type PreorderDto, type PreorderItemDto, type ProductDto } from "../services/api";

type Product = {
  id: number;
  name: string;
  description: string;
  unit: string;
  price: number;
  photo: string;
  commissionTiers?: Record<string, number>;
};

type PurchaseOrderItem = {
  id: string;
  productId: number;
  qty: number;
  discountPercent: number;
  itemStatus: "ready" | "po";
  selected?: boolean;
};

type PurchaseOrder = {
  id: number;
  poNumber: string;
  status: "draft" | "in_review" | "approve" | "invalid";
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
};

const commissionPercent = 10;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const discountOptions = [0, 5, 10, 15, 20, 25, 28];

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

const defaultProducts: Product[] = [
  {
    id: 1,
    name: "GMT Lighting Package",
    description: "Paket lighting event indoor dengan fixture, controller, dan setup operator standar.",
    unit: "paket",
    price: 20000000,
    photo: "/img/LogoGm.png",
  },
  {
    id: 2,
    name: "GMT Truss System",
    description: "Unit truss aluminium untuk kebutuhan panggung, booth, dan rigging event.",
    unit: "unit",
    price: 35000000,
    photo: "/img/LogoGm.png",
  },
  {
    id: 3,
    name: "GMT Training Seat",
    description: "Kursi training bersertifikat untuk program basic lighting, rigging, dan event operation.",
    unit: "seat",
    price: 5000000,
    photo: "/img/LogoGm.png",
  },
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
      { id: "item-1", productId: 1, qty: 1, discountPercent: 5, itemStatus: "ready" },
      { id: "item-2", productId: 2, qty: 1, discountPercent: 10, itemStatus: "po" },
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
    items: [{ id: "item-1", productId: 3, qty: 4, discountPercent: 5, itemStatus: "ready" }],
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

export function renderFormattedDescription(text: string | null | undefined) {
  if (!text) return <p className="text-slate-400 italic">Tidak ada deskripsi.</p>;

  const lines = text.split("\n");
  const parsedElements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let keyCounter = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      parsedElements.push(
        <ul key={`list-${keyCounter++}`} className="list-disc pl-5 my-1.5 space-y-1 text-slate-700">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if line starts with a list bullet
    const isBullet = trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("•");
    const numberedMatch = trimmed.match(/^(\d+)\.\s(.*)/);

    if (isBullet) {
      const content = trimmed.substring(1).trim();
      currentList.push(
        <li key={`li-${keyCounter++}`} className="text-inherit leading-relaxed text-xs">
          {content}
        </li>
      );
    } else if (numberedMatch) {
      flushList();
      const content = numberedMatch[2].trim();
      parsedElements.push(
        <div key={`ol-${keyCounter++}`} className="pl-5 my-1 flex items-start gap-1 text-slate-700 leading-relaxed text-xs">
          <span className="font-semibold shrink-0">{numberedMatch[1]}.</span>
          <span>{content}</span>
        </div>
      );
    } else if (trimmed === "") {
      flushList();
      if (parsedElements.length > 0 && parsedElements[parsedElements.length - 1] !== null) {
        parsedElements.push(<div key={`space-${keyCounter++}`} className="h-1.5" />);
      }
    } else {
      flushList();
      parsedElements.push(
        <p key={`p-${keyCounter++}`} className="leading-relaxed mb-0.5 last:mb-0 text-slate-700 text-xs">
          {line}
        </p>
      );
    }
  }

  flushList();

  return <div className="space-y-0.5">{parsedElements}</div>;
}

const newItem = (): PurchaseOrderItem => ({
  id: `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  productId: defaultProducts[0].id,
  qty: 1,
  discountPercent: 0,
  itemStatus: "ready",
  selected: false,
});

function mapProduct(product: ProductDto): Product {
  return {
    id: product.id,
    name: product.namaproduct,
    description: product.deskripsi ?? "-",
    unit: product.unit ?? "unit",
    price: product.price,
    photo: resolveApiAssetUrl(product.foto) || "/img/LogoGm.png",
    commissionTiers: product.commission_tiers,
  };
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
      itemStatus: "ready",
      selected: true,
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
  };
}

function toPreorderPayload(
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  customerAddress: string,
  notes: string,
  paymentMode: "100%" | "50%",
  items: PurchaseOrderItem[],
) {
  const normalizedEmail = normalizeEmail(customerEmail);

  return {
    nama_customer: customerName.trim(),
    email: normalizedEmail,
    alamat: customerAddress.trim(),
    no_hp: customerPhone.trim(),
    catatan: notes.trim(),
    payment_mode: paymentMode,
    items: items.map((item) => ({
      id_product: item.productId,
      qty: item.qty,
      discount_percent: item.discountPercent,
    })),
  };
}

function getProduct(productList: Product[], productId: number) {
  return productList.find((product) => product.id === productId) ?? productList[0] ?? defaultProducts[0];
}

function calculateItem(productList: Product[], item: PurchaseOrderItem) {
  const product = getProduct(productList, item.productId);
  const subtotal = product.price * item.qty;
  const discountTotal = subtotal * (item.discountPercent / 100);
  const total = subtotal - discountTotal;

  let commission = total * (commissionPercent / 100);
  if (product.commissionTiers) {
    const tierKey = `${item.discountPercent}%`;
    if (product.commissionTiers[tierKey] !== undefined) {
      commission = product.commissionTiers[tierKey] * item.qty;
    }
  }

  return { product, subtotal, discountTotal, total, commission };
}

function calculateOrder(productList: Product[], items: PurchaseOrderItem[]) {
  return items.reduce(
    (summary, item) => {
      const calculated = calculateItem(productList, item);

      return {
        subtotal: summary.subtotal + calculated.subtotal,
        discountTotal: summary.discountTotal + calculated.discountTotal,
        total: summary.total + calculated.total,
        commissionTotal: summary.commissionTotal + calculated.commission,
      };
    },
    { subtotal: 0, discountTotal: 0, total: 0, commissionTotal: 0 },
  );
}

function StatusBadge({ status }: { status: PurchaseOrder["status"] }) {
  const statusMap: Record<PurchaseOrder["status"], { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-slate-100 text-slate-700 ring-slate-200" },
    in_review: { label: "Sent PO", className: "bg-sky-50 text-sky-700 ring-sky-200" },
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

function ItemStatusBadge({ status }: { status: PurchaseOrderItem["itemStatus"] }) {
  const statusMeta = {
    ready: { label: "Ready", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    po: { label: "PO", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  }[status];

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusMeta.className}`}>
      {statusMeta.label}
    </span>
  );
}

export function AgentPurchaseOrder() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(defaultPurchaseOrders);
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseOrderItem[]>([newItem()]);
  const [formError, setFormError] = useState("");
  const [pdfMessage, setPdfMessage] = useState("");
  const [quotationMessage, setQuotationMessage] = useState("");
  const [downloadingQuotationId, setDownloadingQuotationId] = useState<number | null>(null);
  const [editingPoId, setEditingPoId] = useState<number | null>(null);
  const [previewPo, setPreviewPo] = useState<PurchaseOrder | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPersistingPo, setIsPersistingPo] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"100%" | "50%">("100%");
  const [mobilePoStep, setMobilePoStep] = useState<"cart" | "details">("cart");

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [productResponse, preorderResponse] = await Promise.all([api.products(), api.agentPreorders()]);
      const mappedProducts = productResponse.products.map(mapProduct);
      setProducts(mappedProducts.length ? mappedProducts : defaultProducts);
      setPurchaseOrders(preorderResponse.preorders.map(mapPreorder));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat data PO agent.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const orderSummary = useMemo(() => calculateOrder(products, items), [items, products]);

  useEffect(() => {
    if (orderSummary.total <= 100000000 && paymentMode === "50%") {
      setPaymentMode("100%");
    }
  }, [orderSummary.total, paymentMode]);

  const submittedCount = purchaseOrders.filter((po) => po.status === "in_review").length;
  const draftCount = purchaseOrders.filter((po) => po.status === "draft").length;

  const resetForm = () => {
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCustomerAddress("");
    setNotes("");
    setItems([newItem()]);
    setFormError("");
    setPdfMessage("");
    setEditingPoId(null);
    setPaymentMode("100%");
    setMobilePoStep("cart");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const updateItem = (itemId: string, changes: Partial<PurchaseOrderItem>) => {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        let newDiscountPercent = changes.discountPercent !== undefined ? changes.discountPercent : item.discountPercent;

        if (changes.productId !== undefined && changes.productId !== item.productId) {
          const newProduct = getProduct(products, changes.productId);
          if (newProduct.commissionTiers) {
            const tiers = Object.keys(newProduct.commissionTiers).map((k) => parseInt(k.replace("%", ""), 10));
            if (!tiers.includes(newDiscountPercent)) {
              newDiscountPercent = tiers.includes(0) ? 0 : (tiers[0] ?? 0);
            }
          } else {
            if (!discountOptions.includes(newDiscountPercent)) {
              newDiscountPercent = 0;
            }
          }
        }

        return {
          ...item,
          ...changes,
          discountPercent: Math.max(0, newDiscountPercent),
          qty: Math.max(1, changes.qty ?? item.qty),
        };
      }),
    );
  };

  const removeItem = (itemId: string) => {
    setItems((currentItems) =>
      currentItems.length === 1 ? currentItems : currentItems.filter((item) => item.id !== itemId),
    );
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (po: PurchaseOrder) => {
    if (po.status !== "draft") {
      return;
    }

    setEditingPoId(po.id);
    setCustomerName(po.customerName);
    setCustomerEmail(po.customerEmail);
    setCustomerPhone(po.customerPhone);
    setCustomerAddress(po.customerAddress);
    setNotes(po.notes);
    setItems(po.items);
    setFormError("");
    setPdfMessage("");
    setPaymentMode(po.paymentMode || "100%");
    setIsModalOpen(true);
  };

  const deletePurchaseOrder = (po: PurchaseOrder) => {
    if (po.status !== "draft") {
      return;
    }

    void api
      .deletePreorder(po.id)
      .then(loadData)
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "Gagal menghapus PO."));
  };

  const validateForm = () => {
    const normalizedEmail = normalizeEmail(customerEmail);

    if (!customerName.trim() || !normalizedEmail || !customerPhone.trim() || !customerAddress.trim()) {
      setFormError("Lengkapi data customer sebelum menyimpan PO.");
      return false;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setFormError("Format email customer tidak valid.");
      return false;
    }

    const phone = customerPhone.trim();
    if (!phone.startsWith("+62") && !phone.startsWith("08")) {
      setFormError("Nomor HP customer harus diawali dengan +62 atau 08.");
      return false;
    }

    if (!items.length) {
      setFormError("Minimal harus ada satu product dalam PO.");
      return false;
    }

    setFormError("");
    return true;
  };

  const persistPurchaseOrder = async (status: PurchaseOrder["status"]) => {
    if (isPersistingPo) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    const normalizedEmail = normalizeEmail(customerEmail);
    setCustomerEmail(normalizedEmail);

    const payload = toPreorderPayload(customerName, normalizedEmail, customerPhone, customerAddress, notes, paymentMode, items);

    setIsPersistingPo(true);
    try {
      const response = editingPoId ? await api.updatePreorder(editingPoId, payload) : await api.createPreorder(payload);
      if (status === "in_review") {
        await api.submitPreorder(response.preorder.id);
      }
      closeModal();
      await loadData();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Gagal menyimpan PO.");
    } finally {
      setIsPersistingPo(false);
    }
  };

  const handlePrintPdf = async () => {
    if (!editingPoId) {
      setPdfMessage("Simpan PO terlebih dahulu sebelum mencetak PDF.");
      return;
    }

    try {
      const pdf = await api.preorderPdf(editingPoId);
      const pdfUrl = URL.createObjectURL(pdf);
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
      setPdfMessage("");
    } catch (error) {
      setPdfMessage(error instanceof Error ? error.message : "Gagal mencetak PDF PO.");
    }
  };

  const downloadQuotationPdf = async (po: PurchaseOrder) => {
    setDownloadingQuotationId(po.id);
    setQuotationMessage("");

    try {
      const pdf = await api.preorderPdf(po.id);
      const pdfUrl = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `${po.poNumber || `PO-${po.id}`}-quotation.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(pdfUrl);
      setQuotationMessage("Quotation berhasil didownload.");
    } catch (error) {
      setQuotationMessage(error instanceof Error ? error.message : "Gagal mendownload quotation.");
    } finally {
      setDownloadingQuotationId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">Agent Purchase Order</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Purchase Order agent</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Buat PO multi-product, atur diskon, hitung total price, dan pantau total komisi agent.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59]"
        >
          <Plus className="h-4 w-4" />
          Buat Purchase Order
        </button>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <p className="text-xs sm:text-sm text-slate-500 line-clamp-1">Total PO</p>
          <p className="mt-2 text-base sm:text-2xl font-bold text-slate-950 truncate">{purchaseOrders.length}</p>
          <p className="mt-2 text-[10px] sm:text-sm text-slate-500 line-clamp-2 sm:line-clamp-1">Draft dan sent PO</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <p className="text-xs sm:text-sm text-slate-500 line-clamp-1">Sent PO</p>
          <p className="mt-2 text-base sm:text-2xl font-bold text-slate-950 truncate">{submittedCount}</p>
          <p className="mt-2 text-[10px] sm:text-sm text-slate-500 line-clamp-2 sm:line-clamp-1">Menunggu review sales</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <p className="text-xs sm:text-sm text-slate-500 line-clamp-1">Draft</p>
          <p className="mt-2 text-base sm:text-2xl font-bold text-slate-950 truncate">{draftCount}</p>
          <p className="mt-2 text-[10px] sm:text-sm text-slate-500 line-clamp-2 sm:line-clamp-1">Belum dikirim ke sales</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <p className="text-xs sm:text-sm font-bold text-slate-700 line-clamp-1">Estimasi komisi</p>
          <p className="mt-2 text-base sm:text-2xl font-bold text-slate-950 truncate">
            {currencyFormatter.format(purchaseOrders.reduce((sum, po) => sum + po.commissionTotal, 0))}
          </p>
          <p className="mt-2 text-[10px] sm:text-sm text-slate-500 line-clamp-2 sm:line-clamp-1">{commissionPercent}% dari total PO</p>
        </div>
      </section>

      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">List Purchase Order</h2>
            <p className="mt-1 text-sm text-slate-500">Daftar PO yang dibuat agent dan status pengirimannya.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-semibold text-[#0F766E] ring-1 ring-teal-200">
            <ShoppingCart className="h-4 w-4" />
            {isLoading ? "Memuat" : `${purchaseOrders.length} PO`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-600">
                <th className="px-4 py-3 font-semibold">PO</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-bold">Komisi</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => (
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
                        onClick={() => {
                          setQuotationMessage("");
                          setPreviewPo(po);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </button>
                      <button
                        onClick={() => openEditModal(po)}
                        disabled={po.status !== "draft"}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => deletePurchaseOrder(po)}
                        disabled={po.status !== "draft"}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-50 md:flex md:items-start md:justify-center md:bg-slate-950/50 md:p-4">
          <div className="min-h-screen w-full bg-slate-50 md:my-4 md:min-h-0 md:max-w-[96vw] md:rounded-lg md:bg-white md:shadow-xl">
            <div className="sticky top-0 z-20 grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-200 bg-white px-3 py-3 md:static md:flex md:items-start md:justify-between md:gap-4 md:p-5">
              <button
                onClick={() => {
                  if (mobilePoStep === "details") {
                    setMobilePoStep("cart");
                    return;
                  }
                  closeModal();
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 md:hidden"
                aria-label="Kembali"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 text-center md:text-left">
                <h2 className="truncate text-base font-semibold text-slate-950 md:text-lg">
                  {editingPoId ? "Edit Purchase Order" : "Buat Purchase Order"}
                </h2>
                <p className="mt-1 hidden text-sm text-slate-500 md:block">Tambahkan satu atau beberapa product dalam satu PO.</p>
              </div>
              <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 md:hidden" aria-label="Menu">
                <MoreHorizontal className="h-5 w-5" />
              </button>
              <button onClick={closeModal} className="hidden rounded-md p-1 text-slate-500 hover:bg-slate-100 md:block">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-4 pb-36 md:space-y-5 md:bg-white md:p-5">
              <div className={`${mobilePoStep === "details" ? "grid" : "hidden"} grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid md:border-0 md:p-0 md:shadow-none lg:grid-cols-2`}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Nama customer</span>
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                    placeholder="Nama customer"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Email customer</span>
                  <input
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    type="email"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                    placeholder="customer@email.com"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">No HP</span>
                  <input
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                    placeholder="081234567890"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Alamat</span>
                  <input
                    value={customerAddress}
                    onChange={(event) => setCustomerAddress(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                    placeholder="Alamat customer"
                  />
                </label>
              </div>

              <div className={`${mobilePoStep === "cart" ? "space-y-4" : "hidden"} md:hidden`}>
                {items.map((item, index) => {
                  const calculated = calculateItem(products, item);

                  return (
                    <div
                      key={item.id}
                      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm ${item.selected ? "ring-1 ring-inset ring-teal-100 border-teal-200" : ""}`}
                    >
                      <div className="mb-2 grid grid-cols-[1fr_auto] items-center gap-2">
                        <select
                          value={item.productId}
                          onChange={(event) => updateItem(item.id, { productId: Number(event.target.value) })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                          aria-label={`Pilih product ${index + 1}`}
                        >
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                        <label className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={Boolean(item.selected)}
                            onChange={(event) => updateItem(item.id, { selected: event.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 accent-[#0F766E]"
                            aria-label={`Masukkan ${calculated.product.name} ke list`}
                          />
                          Pilih
                        </label>
                      </div>

                      <div className="grid grid-cols-[100px_1fr] gap-3">
                        <div className="relative flex h-28 w-full items-center justify-center bg-slate-50 p-2 rounded-md">
                          <img
                            src={calculated.product.photo}
                            alt={calculated.product.name}
                            className="max-h-full max-w-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setPreviewProduct(calculated.product)}
                            className="absolute right-1 bottom-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
                            aria-label={`Lihat detail ${calculated.product.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="min-w-0 py-1 pr-1 flex flex-col justify-between">
                          <div className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-semibold leading-tight text-slate-950">{calculated.product.name}</p>
                            </div>
                            <button
                              type="button"
                              title="Hapus item"
                              onClick={() => removeItem(item.id)}
                              disabled={items.length === 1}
                              className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-slate-400 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-200"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <ItemStatusBadge status="ready" />
                            </div>

                            <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-white">
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, { qty: item.qty - 1 })}
                                disabled={item.qty <= 1}
                                className="inline-flex h-8 w-8 items-center justify-center bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Kurangi qty"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center text-xs font-semibold text-slate-950">{item.qty}</span>
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, { qty: item.qty + 1 })}
                                className="inline-flex h-8 w-8 items-center justify-center bg-slate-50 text-slate-700 hover:bg-slate-100"
                                aria-label="Tambah qty"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                            <select
                              value={item.discountPercent}
                              onChange={(event) => updateItem(item.id, { discountPercent: Number(event.target.value) })}
                              className="w-[90px] rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                            >
                              {(calculated.product.commissionTiers
                                ? Object.keys(calculated.product.commissionTiers)
                                    .map((k) => parseInt(k.replace("%", ""), 10))
                                    .sort((a, b) => a - b)
                                : discountOptions
                              ).map((discount) => (
                                <option key={discount} value={discount}>
                                  Disc {discount}%
                                </option>
                              ))}
                            </select>

                            <div className="min-w-0 text-right">
                              <span className="text-sm font-bold text-slate-950 whitespace-nowrap">
                                {currencyFormatter.format(calculated.total)}
                              </span>
                              {item.discountPercent > 0 && (
                                <p className="text-xs text-slate-400 line-through whitespace-nowrap">
                                  {currencyFormatter.format(calculated.subtotal)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {item.selected && (
                        <div className="mt-3 pt-2 border-t border-slate-200 -mx-3 px-3 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">Komisi</span>
                          <span className="font-bold text-[#0F766E]">
                            {currencyFormatter.format(calculated.commission)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-hidden rounded-lg border border-slate-300 bg-white md:block">
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[4%]" />
                    <col className="w-[17%]" />
                    <col className="w-[20%]" />
                    <col className="w-[8%]" />
                    <col className="w-[7%]" />
                    <col className="w-[8%]" />
                    <col className="w-[10%]" />
                    <col className="w-[8%]" />
                    <col className="w-[9%]" />
                    <col className="w-[9%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                      <th className="border border-slate-200 px-2 py-3 font-semibold">No</th>
                      <th className="border border-slate-200 px-2 py-3 font-semibold">Item</th>
                      <th className="border border-slate-200 px-2 py-3 font-semibold">Description</th>
                      <th className="border border-slate-200 px-2 py-3 font-semibold">Foto</th>
                      <th className="border border-slate-200 px-2 py-3 font-semibold">Qty</th>
                      <th className="border border-slate-200 px-2 py-3 font-semibold">Status</th>
                      <th className="border border-slate-200 px-2 py-3 font-semibold">Unit Price</th>
                      <th className="border border-slate-200 px-2 py-3 font-semibold">Disc</th>
                      <th className="border border-slate-200 px-2 py-3 font-semibold">Total Price</th>
                      <th className="border border-slate-200 px-2 py-3 font-bold">Komisi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const calculated = calculateItem(products, item);

                      return (
                        <tr key={item.id} className="align-top text-xs text-slate-700 sm:text-sm">
                          <td className="border border-slate-200 px-2 py-3 font-semibold text-slate-700">{index + 1}</td>
                          <td className="border border-slate-200 px-2 py-3">
                            <select
                              value={item.productId}
                              onChange={(event) => updateItem(item.id, { productId: Number(event.target.value) })}
                              className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-medium text-slate-900 outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 sm:text-sm"
                            >
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                            </select>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <p className="min-w-0 truncate text-xs text-slate-500">{calculated.product.unit}</p>
                              <button
                                type="button"
                                title="Hapus item"
                                onClick={() => removeItem(item.id)}
                                disabled={items.length === 1}
                                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="border border-slate-200 px-2 py-3">
                            <div className="min-h-20 max-h-32 w-full overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-600">
                              {renderFormattedDescription(calculated.product.description)}
                            </div>
                          </td>
                          <td className="border border-slate-200 px-2 py-3">
                            <div className="mx-auto flex aspect-square w-full max-w-16 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-1.5">
                              <img
                                src={calculated.product.photo}
                                alt={calculated.product.name}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                          </td>
                          <td className="border border-slate-200 px-2 py-3">
                            <input
                              value={item.qty}
                              type="number"
                              min="1"
                              onChange={(event) => updateItem(item.id, { qty: Number(event.target.value) })}
                              className="w-full min-w-0 rounded-lg border border-slate-300 px-2 py-2 text-xs outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 sm:text-sm"
                            />
                          </td>
                          <td className="border border-slate-200 px-2 py-3">
                            <ItemStatusBadge status="ready" />
                          </td>
                          <td className="break-words border border-slate-200 px-2 py-3 font-semibold text-slate-900">
                            {currencyFormatter.format(calculated.product.price)}
                          </td>
                          <td className="border border-slate-200 px-2 py-3">
                            <select
                              value={item.discountPercent}
                              onChange={(event) => updateItem(item.id, { discountPercent: Number(event.target.value) })}
                              className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 sm:text-sm"
                            >
                              {(calculated.product.commissionTiers
                                ? Object.keys(calculated.product.commissionTiers)
                                    .map((k) => parseInt(k.replace("%", ""), 10))
                                    .sort((a, b) => a - b)
                                : discountOptions
                              ).map((discount) => (
                                <option key={discount} value={discount}>
                                  {discount}%
                                </option>
                              ))}
                            </select>
                            <p className="mt-2 text-xs font-medium text-slate-500">
                              {currencyFormatter.format(calculated.discountTotal)}
                            </p>
                          </td>
                          <td className="break-words border border-slate-200 px-2 py-3 font-bold text-slate-950">
                            {currencyFormatter.format(calculated.total)}
                          </td>
                          <td className="break-words border border-slate-200 px-2 py-3 font-bold text-[#0F766E]">
                            {currencyFormatter.format(calculated.commission)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={() => setItems((currentItems) => [...currentItems, newItem()])}
                className={`${mobilePoStep === "cart" ? "inline-flex" : "hidden"} items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 md:inline-flex`}
              >
                <Plus className="h-4 w-4" />
                Tambah product
              </button>

              <label className={`${mobilePoStep === "details" ? "block" : "hidden"} md:block`}>
                <span className="mb-2 block text-sm font-medium text-slate-700">Skema Pembayaran</span>
                <select
                  value={paymentMode}
                  onChange={(event) => setPaymentMode(event.target.value as "100%" | "50%")}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                >
                  <option value="100%">Bayar Full di Awal (100% upfront)</option>
                  <option value="50%" disabled={orderSummary.total <= 100000000}>
                    DP 50% di Awal (Pembayaran 50%)
                  </option>
                </select>
                {orderSummary.total <= 100000000 && (
                  <p className="mt-1.5 text-xs font-medium text-amber-600">
                    * Opsi DP 50% hanya tersedia jika Total Price melebihi Rp 100.000.000
                  </p>
                )}
              </label>

              <label className={`${mobilePoStep === "details" ? "block" : "hidden"} md:block`}>
                <span className="mb-2 block text-sm font-medium text-slate-700">Catatan</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="min-h-20 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                  placeholder="Catatan tambahan untuk PO"
                />
              </label>

              <div className={`${mobilePoStep === "details" ? "grid" : "hidden"} grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid md:grid-cols-4 md:bg-slate-50 md:shadow-none`}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subtotal</p>
                  <p className="mt-1 text-base font-bold text-slate-950">{currencyFormatter.format(orderSummary.subtotal)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total diskon</p>
                  <p className="mt-1 text-base font-bold text-slate-950">{currencyFormatter.format(orderSummary.discountTotal)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total price</p>
                  <p className="mt-1 text-base font-bold text-slate-950">{currencyFormatter.format(orderSummary.total)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#0F766E]">Total komisi</p>
                  <p className="mt-1 text-base font-bold text-[#0F766E]">{currencyFormatter.format(orderSummary.commissionTotal)}</p>
                </div>
              </div>

              {formError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {formError}
                </div>
              )}
              {pdfMessage && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                  {pdfMessage}
                </div>
              )}

              <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-[1fr_auto_auto] items-center gap-2 border-t border-slate-200 bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:static md:flex md:flex-row md:justify-end md:border-t md:p-0 md:pt-5 md:shadow-none">
                {mobilePoStep === "cart" ? (
                  <button
                    type="button"
                    onClick={() => setMobilePoStep("details")}
                    className="col-span-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#115E59] md:hidden"
                  >
                    Lanjut
                  </button>
                ) : (
                  <>
                    <div className="min-w-0 md:hidden">
                      <p className="text-xs font-medium text-slate-500">Total price</p>
                      <p className="whitespace-nowrap text-base font-bold text-[#0F766E]">{currencyFormatter.format(orderSummary.total)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => persistPurchaseOrder("draft")}
                      disabled={isPersistingPo}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 md:hidden"
                    >
                      <FileText className="h-4 w-4" />
                      {isPersistingPo ? "Menyimpan..." : editingPoId ? "Update draft" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => persistPurchaseOrder("in_review")}
                      disabled={isPersistingPo}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-3 py-2 text-sm font-semibold text-white hover:bg-[#115E59] md:hidden"
                    >
                      <Send className="h-4 w-4" />
                      {isPersistingPo ? "Mengirim..." : "Send PO"}
                    </button>
                  </>
                )}
                <div className="hidden md:contents">
                  <button
                    type="button"
                    onClick={() => persistPurchaseOrder("draft")}
                    disabled={isPersistingPo}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <FileText className="h-4 w-4" />
                    {isPersistingPo ? "Menyimpan..." : editingPoId ? "Update draft" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => persistPurchaseOrder("in_review")}
                    disabled={isPersistingPo}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59]"
                  >
                    <Send className="h-4 w-4" />
                    {isPersistingPo ? "Mengirim..." : "Send PO"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="hidden items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 md:inline-flex"
                >
                  <FileDown className="h-4 w-4" />
                  Cetak PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <span className="text-sm font-bold text-slate-900">Detail Produk</span>
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                aria-label="Tutup detail product"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-[1fr_100px] gap-4 p-4 sm:grid-cols-[1fr_200px]">
              <div className="flex flex-col justify-center">
                <h3 className="text-base font-bold text-slate-950 leading-tight sm:text-lg">{previewProduct.name}</h3>
                <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {previewProduct.unit}
                </p>
              </div>
              <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-slate-50 p-2 sm:p-4 border border-slate-100">
                <img
                  src={previewProduct.photo}
                  alt={previewProduct.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="col-span-2 border-t border-slate-100 -mx-4 px-4 pt-4 mt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Deskripsi Produk</p>
                <div className="mt-2 text-sm leading-relaxed text-slate-700">
                  {renderFormattedDescription(previewProduct.description)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewPo && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-4 w-full max-w-4xl rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-950">Preview {previewPo.poNumber}</h2>
                  <StatusBadge status={previewPo.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Dibuat {dateFormatter.format(new Date(previewPo.createdAt))}
                </p>
              </div>
              <button
                onClick={() => {
                  setQuotationMessage("");
                  setPreviewPo(null);
                }}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Skema Pembayaran</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {(previewPo.paymentMode === "split" || previewPo.paymentMode === "50%" || previewPo.paymentMode === "50") ? "DP 50% di Awal" : "Full Payment (100%)"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Status Pembayaran: <span className="font-semibold text-slate-700">{previewPo.paymentStatus}</span>
                  </p>
                </div>
              </section>

              {/* Proof of Payment Display */}
              {(previewPo.dpProof || previewPo.remainingProof || previewPo.paymentProof) && (
                <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
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
                                  className="inline-block overflow-hidden rounded border border-slate-200 hover:opacity-90 max-h-32"
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
                </section>
              )}

              <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quotation</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Download ulang dokumen quotation untuk PO ini.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => downloadQuotationPdf(previewPo)}
                      disabled={downloadingQuotationId === previewPo.id}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:cursor-wait disabled:bg-[#0F766E]/60"
                    >
                      <FileDown className="h-4 w-4" />
                      {downloadingQuotationId === previewPo.id ? "Mendownload..." : "Download Ulang Quotation"}
                    </button>
                  </div>
                </div>
                {quotationMessage && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                    {quotationMessage}
                  </div>
                )}
              </section>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-600">
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold">Qty</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Diskon</th>
                      <th className="px-4 py-3 font-semibold">Total</th>
                      <th className="px-4 py-3 font-semibold">Komisi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewPo.items.map((item) => {
                      const calculated = calculateItem(products, item);

                      return (
                        <tr key={item.id} className="border-b border-slate-100 text-sm last:border-0">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-950">{calculated.product.name}</p>
                            <p className="text-xs text-slate-500">{calculated.product.unit}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{item.qty}</td>
                          <td className="px-4 py-3">
                            <ItemStatusBadge status={item.itemStatus} />
                          </td>
                          <td className="px-4 py-3 text-slate-700">{item.discountPercent}%</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{currencyFormatter.format(calculated.total)}</td>
                          <td className="px-4 py-3 font-semibold text-[#0F766E]">{currencyFormatter.format(calculated.commission)}</td>
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
                  <p className="text-xs font-bold uppercase tracking-wide text-[#0F766E]">Total komisi</p>
                  <p className="mt-1 font-bold text-[#0F766E]">{currencyFormatter.format(previewPo.commissionTotal)}</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
