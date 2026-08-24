import { readTickets, writeTickets } from "../../../_customer-care-store.js";

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
  res.setHeader("Access-Control-Allow-Methods", "GET,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = requestUrl.pathname;
    const parts = pathname.split("/").filter(Boolean);

    // Endpoint: /api/admin/customer-care/tickets/:id or /api/admin/customer-care/tickets/:id/status
    const ticketId = Number(req.query?.id || parts[3] || 0);
    const isStatusUpdate = parts.includes("status");

    const tickets = await readTickets();
    const ticketIndex = tickets.findIndex((t) => Number(t.id) === ticketId);

    if (ticketIndex === -1) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ message: "Tiket tidak ditemukan" }));
      return;
    }

    const ticket = tickets[ticketIndex];

    if (isStatusUpdate && (req.method === "PATCH" || req.method === "POST")) {
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

    if (req.method === "GET") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ data: ticket }));
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
