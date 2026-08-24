import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const CUSTOMER_CARE_STORE_PATH =
  process.env.CUSTOMER_CARE_STORE_PATH ||
  path.join(os.tmpdir(), "gmtgroupbe-customer-care.json");

export const CUSTOMER_CARE_CATEGORIES = [
  {
    key: "produk_rusak",
    name: "Produk Rusak",
    description: "Keluhan produk rusak, cacat, atau tidak berfungsi saat diterima.",
  },
  {
    key: "barang_kurang_salah",
    name: "Barang Kurang/Salah",
    description: "Produk yang diterima kurang jumlahnya atau berbeda dari pesanan.",
  },
  {
    key: "keterlambatan_pengiriman",
    name: "Keterlambatan Pengiriman",
    description: "Kendala pengiriman barang melebihi estimasi kedatangan.",
  },
  {
    key: "pembayaran",
    name: "Pembayaran & Tagihan",
    description: "Kendala verifikasi pembayaran, faktur, atau refund.",
  },
  {
    key: "garansi",
    name: "Klaim Garansi",
    description: "Permohonan perbaikan atau klaim garansi resmi produk.",
  },
  {
    key: "lainnya",
    name: "Pertanyaan Lainnya",
    description: "Informasi umum, permohonan demo, atau pertanyaan produk.",
  },
];

const defaultTickets = [
  {
    id: 1,
    ticket_number: "CC-20260824-0001",
    type: "complaint",
    user_id: 5,
    reporter_name: "Budi",
    reporter_phone: "081234567890",
    invoice_id: 12,
    invoice_number: "INV/GMT/2026/08/0012",
    product_id: 3,
    product_name: "Produk A",
    category: "produk_rusak",
    serial_number: "SN-ABC-12345",
    subject: "Produk tidak menyala",
    description: "Produk diterima dalam kondisi mati total.",
    status: "diterima",
    pic_id: null,
    pic_name: "",
    contact_channel: "whatsapp",
    attachments: [
      {
        id: 1,
        ticket_id: 1,
        file_url: "https://is3.cloudhost.id/gmtsuites/documents/bukti-rusak.jpg",
        file_type: "image",
        created_at: "2026-08-24T10:00:00+07:00",
      },
    ],
    messages: [],
    logs: [
      {
        id: 1,
        ticket_id: 1,
        actor_id: 5,
        action: "Tiket Dibuat",
        note: "Tiket baru diajukan oleh Budi via WhatsApp",
        created_at: "2026-08-24T10:00:00+07:00",
      },
    ],
    rating: null,
    feedback: null,
    response_due_at: "2026-08-24T14:00:00+07:00",
    resolve_due_at: "2026-08-26T10:00:00+07:00",
    created_at: "2026-08-24T10:00:00+07:00",
  },
];

export async function readTickets() {
  try {
    const raw = await fs.readFile(CUSTOMER_CARE_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultTickets;
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeTickets(defaultTickets);
      return defaultTickets;
    }
    return defaultTickets;
  }
}

export async function writeTickets(tickets) {
  const safeTickets = Array.isArray(tickets) ? tickets : [];
  await fs.mkdir(path.dirname(CUSTOMER_CARE_STORE_PATH), { recursive: true });
  await fs.writeFile(CUSTOMER_CARE_STORE_PATH, JSON.stringify(safeTickets, null, 2), "utf8");
}
