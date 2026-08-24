import { CUSTOMER_CARE_CATEGORIES, readTickets, writeTickets } from "./_customer-care-store.js";

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
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = requestUrl.pathname;
    const method = req.method;

    // 1. GET /api/customer-care/categories
    if (pathname.includes("/categories")) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ data: CUSTOMER_CARE_CATEGORIES }));
      return;
    }

    const tickets = await readTickets();

    // 2. Admin routes: /api/admin/customer-care/tickets...
    if (pathname.includes("/admin/customer-care")) {
      const parts = pathname.split("/").filter(Boolean);
      const ticketIdIndex = parts.indexOf("tickets") + 1;
      const ticketId = ticketIdIndex > 0 && parts[ticketIdIndex] ? Number(parts[ticketIdIndex]) : 0;
      const isStatusUpdate = parts.includes("status");

      if (ticketId) {
        const ticketIndex = tickets.findIndex((t) => Number(t.id) === ticketId);
        if (ticketIndex === -1) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ message: "Tiket tidak ditemukan" }));
          return;
        }

        const ticket = tickets[ticketIndex];

        if (isStatusUpdate && (method === "PATCH" || method === "POST" || method === "PUT")) {
          const body = await readBody(req);
          const { status, note } = body;

          if (!status) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ message: "Status tiket wajib diisi" }));
            return;
          }

          ticket.status = status;
          if (!ticket.logs) ticket.logs = [];
          ticket.logs.push({
            id: ticket.logs.length + 1,
            ticket_id: ticketId,
            actor_id: 1,
            action: `Status diubah ke ${status}`,
            note: note || `Status tiket diperbarui menjadi ${status}`,
            created_at: new Date().toISOString(),
          });

          tickets[ticketIndex] = ticket;
          await writeTickets(tickets);

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ message: "Status tiket berhasil diupdate" }));
          return;
        }

        // GET single admin ticket detail
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ data: ticket }));
        return;
      }

      // GET admin tickets list
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ data: tickets }));
      return;
    }

    // 3. User ticket routes: /api/customer-care/tickets...
    const parts = pathname.split("/").filter(Boolean);
    const ticketIdIndex = parts.indexOf("tickets") + 1;
    const ticketId = ticketIdIndex > 0 && parts[ticketIdIndex] ? Number(parts[ticketIdIndex]) : 0;
    const isAttachment = parts.includes("attachments");

    if (ticketId) {
      const ticket = tickets.find((t) => Number(t.id) === ticketId);
      if (!ticket) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ message: "Tiket tidak ditemukan" }));
        return;
      }

      if (isAttachment && method === "POST") {
        const mockAttachment = {
          id: (ticket.attachments?.length || 0) + 1,
          ticket_id: ticketId,
          file_url: `/uploads/customer_care/${ticketId}/${ticketId}_${Date.now()}.jpg`,
          file_type: "image",
          created_at: new Date().toISOString(),
        };

        if (!ticket.attachments) ticket.attachments = [];
        ticket.attachments.push(mockAttachment);
        await writeTickets(tickets);

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ message: "Bukti berhasil diupload", data: [mockAttachment] }));
        return;
      }

      // GET single ticket detail
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ data: ticket }));
      return;
    }

    // List / Create tickets: /api/customer-care/tickets
    if (method === "GET") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ data: tickets }));
      return;
    }

    if (method === "POST") {
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
