import { BookOpen, CheckCircle2, ClipboardCheck, HelpCircle, Mail, Star, Timer, Upload, UserRound, MessageCircle, PlayCircle, ShieldCheck, Wrench, FileText, AlertCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { api, type CustomerCareInvoiceDto, type CustomerCareTicketDto, type CustomerCareTicketType, type CustomerCareCategoryItemDto } from "../services/api";

const supportChannels = [
  { label: "WhatsApp Customer Care", value: "+62 812-0000-0000", href: "https://wa.me/6281200000000", icon: MessageCircle },
  { label: "Email Support", value: "customercare@gmtsuite.co.id", href: "mailto:customercare@gmtsuite.co.id", icon: Mail },
];

const fallbackCategories: CustomerCareCategoryItemDto[] = [
  { key: "produk_rusak", name: "Produk Rusak", description: "Keluhan produk rusak, cacat, atau tidak berfungsi saat diterima." },
  { key: "barang_kurang_salah", name: "Barang Kurang/Salah", description: "Produk yang diterima kurang jumlahnya atau berbeda dari pesanan." },
  { key: "keterlambatan_pengiriman", name: "Keterlambatan Pengiriman", description: "Kendala pengiriman barang melebihi estimasi kedatangan." },
  { key: "pembayaran", name: "Pembayaran & Tagihan", description: "Kendala verifikasi pembayaran, faktur, atau refund." },
  { key: "garansi", name: "Klaim Garansi", description: "Permohonan perbaikan atau klaim garansi resmi produk." },
  { key: "lainnya", name: "Pertanyaan Lainnya", description: "Informasi umum, permohonan demo, atau pertanyaan produk." },
];

const ticketStatuses = ["Diterima", "Diproses", "Menunggu Customer", "Selesai"];
const faqItems = [
  { question: "Bagaimana cara request demo produk?", answer: "Pilih tipe Request Demo, isi kebutuhan customer, lalu tim Customer Care akan menghubungi agent." },
  { question: "Apa saja data untuk klaim garansi?", answer: "Siapkan nomor invoice, detail produk, foto/video kendala, nomor seri jika tersedia, dan kronologi singkat." },
  { question: "Berapa lama tiket diproses?", answer: "Tiket ditinjau sesuai kategori dan SLA yang tercatat pada tiket." },
];

const ticketTypeOptions: { value: CustomerCareTicketType; label: string }[] = [
  { value: "complaint", label: "Komplain" },
  { value: "demo_request", label: "Request demo" },
  { value: "warranty_claim", label: "Klaim garansi" },
  { value: "general_support", label: "General support" },
];

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ActionCard({ icon: Icon, title, description, action }: { icon: typeof PlayCircle; title: string; description: string; action: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-[#0F766E]"><Icon className="h-5 w-5" /></div>
      <h2 className="mt-4 text-base font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      <button className="mt-4 inline-flex rounded-lg border border-teal-200 px-3 py-2 text-sm font-semibold text-[#0F766E] hover:bg-teal-50">{action}</button>
    </div>
  );
}

export function AgentCustomerCareHub() {
  const [invoices, setInvoices] = useState<CustomerCareInvoiceDto[]>([]);
  const [categories, setCategories] = useState<CustomerCareCategoryItemDto[]>(fallbackCategories);
  const [tickets, setTickets] = useState<CustomerCareTicketDto[]>([]);
  const [ticketType, setTicketType] = useState<CustomerCareTicketType>("complaint");
  const [invoiceId, setInvoiceId] = useState("");
  const [productId, setProductId] = useState("");
  const [category, setCategory] = useState("produk_rusak");
  const [serialNumber, setSerialNumber] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [contactChannel, setContactChannel] = useState("whatsapp");
  const [files, setFiles] = useState<File[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<CustomerCareTicketDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedInvoice = useMemo(() => invoices.find((invoice) => String(invoice.invoice_id) === invoiceId), [invoiceId, invoices]);
  const availableProducts = selectedInvoice?.products ?? [];

  const loadCustomerCare = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const [invoiceResponse, categoryResponse, ticketResponse] = await Promise.all([
        api.customerCareInvoices(),
        api.customerCareCategories(),
        api.customerCareTickets(),
      ]);
      setInvoices(Array.isArray(invoiceResponse.data) ? invoiceResponse.data : []);
      if (Array.isArray(categoryResponse.data) && categoryResponse.data.length > 0) {
        // Support either object format or string format
        const formattedCats: CustomerCareCategoryItemDto[] = categoryResponse.data.map((item: unknown) => {
          if (typeof item === "string") {
            return { key: item, name: formatLabel(item), description: "" };
          }
          return item as CustomerCareCategoryItemDto;
        });
        setCategories(formattedCats);
        setCategory(formattedCats[0].key);
      } else {
        setCategories(fallbackCategories);
        setCategory(fallbackCategories[0].key);
      }
      setTickets(Array.isArray(ticketResponse.data) ? ticketResponse.data : []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat Customer Care Hub.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadCustomerCare(); }, []);
  useEffect(() => { setProductId(availableProducts[0] ? String(availableProducts[0].product_id) : ""); }, [invoiceId]);

  const submitTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!category || !subject.trim()) {
      setErrorMessage("Kategori dan subjek tiket wajib diisi.");
      return;
    }

    // Validation note: serial_number wajib jika category = produk_rusak
    if (category === "produk_rusak" && !serialNumber.trim()) {
      const errMsg = "Nomor serial wajib diisi untuk kategori Produk Rusak";
      setErrorMessage(errMsg);
      void Swal.fire({ icon: "error", title: "Gagal", text: errMsg, confirmButtonColor: "#0F766E" });
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const response = await api.createCustomerCareTicket({
        type: ticketType,
        invoice_id: invoiceId ? Number(invoiceId) : undefined,
        product_id: productId ? Number(productId) : undefined,
        category,
        serial_number: serialNumber.trim() || undefined,
        subject: subject.trim(),
        description: description.trim(),
        contact_channel: contactChannel,
      });

      if (files.length && response.data?.id) {
        await api.uploadCustomerCareAttachments(response.data.id, files);
      }

      setSubject("");
      setDescription("");
      setSerialNumber("");
      setFiles([]);
      await loadCustomerCare();
      await Swal.fire({ icon: "success", title: "Tiket berhasil dibuat", text: `Nomor tiket: ${response.data.ticket_number}`, confirmButtonColor: "#0F766E" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal membuat tiket Customer Care.";
      setErrorMessage(message);
      void Swal.fire({ icon: "error", title: "Gagal", text: message, confirmButtonColor: "#0F766E" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const rateTicket = async (ticket: CustomerCareTicketDto, rating: number) => {
    try {
      await api.rateCustomerCareTicket(ticket.id, { rating });
      await loadCustomerCare();
      await Swal.fire({ icon: "success", title: "Rating tersimpan", confirmButtonColor: "#0F766E" });
    } catch (error) {
      void Swal.fire({ icon: "error", title: "Gagal", text: error instanceof Error ? error.message : "Gagal menyimpan rating.", confirmButtonColor: "#0F766E" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">Customer Care Hub</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Pusat bantuan agent dan customer</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">Akses panduan produk, request demo, komplain, klaim garansi, FAQ, riwayat tiket, dan kontak Customer Care.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-semibold text-[#0F766E] ring-1 ring-teal-200"><ShieldCheck className="h-4 w-4" />Pusat Bantuan & Support</div>
      </div>

      {errorMessage && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{errorMessage}</div>}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ActionCard icon={PlayCircle} title="Video tutorial" description="Tonton panduan penggunaan produk, demo fitur, dan materi edukasi singkat untuk customer." action="Lihat tutorial" />
        <ActionCard icon={ClipboardCheck} title="Request demo produk" description="Ajukan permintaan demo produk untuk kebutuhan customer atau event yang sedang diprospek." action="Ajukan demo" />
        <ActionCard icon={HelpCircle} title="Komplain" description="Laporkan kendala layanan, kendala produk, atau kebutuhan follow-up dari customer." action="Buat komplain" />
        <ActionCard icon={Wrench} title="Klaim garansi" description="Ajukan klaim garansi dengan informasi invoice, produk, dokumentasi kendala, dan kronologi." action="Ajukan klaim" />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={submitTicket} className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5"><h2 className="text-lg font-semibold text-slate-950">Ajukan tiket Customer Care</h2><p className="mt-1 text-sm text-slate-500">Tiket otomatis dikaitkan dengan invoice, produk, bukti pendukung, PIC, dan SLA dari backend.</p></div>
          <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
            <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Tipe tiket</span><select value={ticketType} onChange={(e) => setTicketType(e.target.value as CustomerCareTicketType)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100">{ticketTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Nomor invoice</span><select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"><option value="">Tanpa invoice</option>{invoices.map((invoice) => <option key={invoice.invoice_id} value={invoice.invoice_id}>{invoice.invoice_number}</option>)}</select></label>
            <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Detail produk</span><select value={productId} onChange={(e) => setProductId(e.target.value)} disabled={!availableProducts.length} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50"><option value="">Tanpa produk</option>{availableProducts.map((product) => <option key={product.product_id} value={product.product_id}>{product.product_name} - Qty {product.qty}</option>)}</select></label>
            <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Kategori</span><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100">{categories.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}</select></label>
            
            {/* Field Nomor Serial (SN) */}
            <label className="block lg:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Nomor Serial (SN) {category === "produk_rusak" ? <span className="text-rose-600 font-bold">* (Wajib)</span> : <span className="text-slate-400 font-normal">(Opsional)</span>}
                </span>
                {category === "produk_rusak" && (
                  <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Wajib untuk Produk Rusak
                  </span>
                )}
              </div>
              <input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                maxLength={100}
                className={`w-full rounded-lg border px-3 py-3 text-sm outline-none transition focus:ring-2 ${
                  category === "produk_rusak" && !serialNumber.trim()
                    ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-100"
                    : "border-slate-300 focus:border-[#0F766E] focus:ring-teal-100"
                }`}
                placeholder="Contoh: SN-ABC-12345"
              />
            </label>

            <label className="block lg:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">Subjek</span><input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={255} className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" placeholder="Contoh: Produk tidak menyala saat diterima" /></label>
            <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Channel update</span><select value={contactChannel} onChange={(e) => setContactChannel(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="app">Aplikasi</option></select></label>
            <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Bukti foto/video</span><div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600"><Upload className="mr-2 inline h-4 w-4 text-[#0F766E]" /><input type="file" multiple accept="image/*,video/*" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} className="text-sm" /><p className="mt-1 text-xs text-slate-500">{files.length ? `${files.length} file dipilih` : "Maksimal 10 MB per file."}</p></div></label>
            <label className="block lg:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">Kronologi</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-28 w-full resize-y rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" placeholder="Jelaskan kendala, waktu kejadian, dan kondisi produk." /></label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 lg:col-span-2"><div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3"><div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-[#0F766E]" />Nomor tiket otomatis</div><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-[#0F766E]" />PIC ditentukan sistem</div><div className="flex items-center gap-2"><Timer className="h-4 w-4 text-[#0F766E]" />Eskalasi mengikuti SLA</div></div></div>
            <div className="flex justify-end lg:col-span-2"><button disabled={isSubmitting} className="inline-flex rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:bg-slate-300">{isSubmitting ? "Mengirim..." : "Kirim tiket"}</button></div>
          </div>
        </form>

        <div className="space-y-4"><section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-950">Status tiket</h2><div className="mt-4 grid grid-cols-2 gap-2">{ticketStatuses.map((status) => <div key={status} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">{status}</div>)}</div><p className="mt-4 text-sm leading-6 text-slate-500">Update progres dikirim melalui aplikasi, WhatsApp, atau email.</p></section><section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-950">Rating setelah selesai</h2><p className="mt-1 text-sm leading-6 text-slate-500">Tiket selesai bisa diberi rating dan feedback.</p><div className="mt-4 flex gap-1 text-amber-400">{[1, 2, 3, 4, 5].map((item) => <Star key={item} className="h-5 w-5 fill-current" />)}</div></section></div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]"><div className="rounded-lg border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><h2 className="text-lg font-semibold text-slate-950">Status dan riwayat tiket</h2><p className="mt-1 text-sm text-slate-500">Data dari endpoint /api/customer-care/tickets.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px]"><thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-600"><th className="px-4 py-3 font-semibold">ID Tiket</th><th className="px-4 py-3 font-semibold">Kategori / SN</th><th className="px-4 py-3 font-semibold">Invoice / Produk</th><th className="px-4 py-3 font-semibold">Subjek</th><th className="px-4 py-3 font-semibold">PIC / SLA</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Rating</th></tr></thead><tbody>{tickets.map((ticket) => <tr key={ticket.id} className="border-b border-slate-100 text-sm last:border-0"><td className="px-4 py-3 font-semibold text-slate-950">{ticket.ticket_number}</td><td className="px-4 py-3 text-slate-600"><p className="font-medium text-slate-900">{formatLabel(ticket.category)}</p>{ticket.serial_number && <p className="font-mono text-xs text-slate-500">SN: {ticket.serial_number}</p>}</td><td className="px-4 py-3 text-slate-600"><p className="font-semibold text-slate-950">{ticket.invoice_number ?? "-"}</p><p className="text-xs text-slate-500">{ticket.product_name ?? "-"}</p></td><td className="px-4 py-3 text-slate-600"><p>{ticket.subject}</p><p className="mt-1 text-xs text-slate-500">Update: {ticket.contact_channel ?? "app"}</p></td><td className="px-4 py-3 text-slate-600"><p className="font-semibold text-slate-950">{ticket.pic_name || "Belum ditentukan"}</p><p className="text-xs text-slate-500">{ticket.response_due_at ? `Respons: ${new Date(ticket.response_due_at).toLocaleString("id-ID")}` : "SLA menunggu"}</p></td><td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-[#0F766E] ring-1 ring-teal-200"><CheckCircle2 className="h-3.5 w-3.5" />{formatLabel(ticket.status)}</span></td><td className="px-4 py-3 text-slate-600">{ticket.rating ? <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500"><Star className="h-4 w-4 fill-current" />{ticket.rating}/5</span> : ticket.status === "selesai" ? <button onClick={() => void rateTicket(ticket, 5)} className="text-xs font-semibold text-[#0F766E] hover:underline">Beri 5 bintang</button> : <span className="text-xs text-slate-400">Belum ada</span>}</td></tr>)}</tbody></table>{isLoading && <div className="px-4 py-5 text-sm text-slate-500">Memuat Customer Care...</div>}</div></div><div className="space-y-4"><section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-[#0F766E]" /><h2 className="text-lg font-semibold text-slate-950">FAQ</h2></div><div className="mt-4 space-y-4">{faqItems.map((item) => <div key={item.question} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"><p className="text-sm font-semibold text-slate-950">{item.question}</p><p className="mt-1 text-sm leading-6 text-slate-500">{item.answer}</p></div>)}</div></section><section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-950">Hubungi Customer Care</h2><div className="mt-4 space-y-3">{supportChannels.map((channel) => { const Icon = channel.icon; return <a key={channel.label} href={channel.href} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 hover:bg-slate-50"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-[#0F766E]"><Icon className="h-4 w-4" /></div><div><p className="text-sm font-semibold text-slate-950">{channel.label}</p><p className="text-xs text-slate-500">{channel.value}</p></div></a>; })}</div></section></div></section>
    </div>
  );
}
