import { readTickets, writeTickets } from "../_customer-care-store.js";

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (_e) {
    return {};
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const tickets = await readTickets();

    if (req.method === "GET") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ data: tickets }));
      return;
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const {
        type = "complaint",
        invoice_id,
        product_id,
        category,
        serial_number,
        subject,
        description,
        contact_channel = "whatsapp",
      } = body;

      // Validate serial_number for category == "produk_rusak"
      if (category === "produk_rusak" && (!serial_number || !String(serial_number).trim())) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ message: "Nomor serial wajib diisi untuk kategori Produk Rusak" }));
        return;
      }

      if (!category || !subject) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ message: "Kategori dan subjek tiket wajib diisi" }));
        return;
      }

      const nextId = tickets.length > 0 ? Math.max(...tickets.map((t) => t.id || 0)) + 1 : 1;
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const ticket_number = `CC-${dateStr}-${String(nextId).padStart(4, "0")}`;

      const newTicket = {
        id: nextId,
        ticket_number,
        type,
        user_id: 5,
        reporter_name: "Budi",
        reporter_phone: "081234567890",
        invoice_id: invoice_id ? Number(invoice_id) : undefined,
        invoice_number: invoice_id ? `INV/GMT/2026/08/${String(invoice_id).padStart(4, "0")}` : undefined,
        product_id: product_id ? Number(product_id) : undefined,
        product_name: product_id ? `Produk #${product_id}` : undefined,
        category,
        serial_number: serial_number ? String(serial_number).trim() : "",
        subject: String(subject).trim(),
        description: description ? String(description).trim() : "",
        status: "diterima",
        pic_id: null,
        pic_name: "",
        contact_channel,
        attachments: [],
        messages: [],
        logs: [
          {
            id: 1,
            ticket_id: nextId,
            actor_id: 5,
            action: "Tiket Dibuat",
            note: "Tiket berhasil didaftarkan ke sistem",
            created_at: new Date().toISOString(),
          },
        ],
        rating: null,
        feedback: null,
        response_due_at: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        resolve_due_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      tickets.unshift(newTicket);
      await writeTickets(tickets);

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          message: "Tiket berhasil dibuat",
          data: {
            id: newTicket.id,
            ticket_number: newTicket.ticket_number,
            status: newTicket.status,
          },
        })
      );
      return;
    }

    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Method not allowed" }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: err.message || "Internal server error" }));
  }
}
