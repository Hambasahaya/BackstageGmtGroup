import { readTickets, writeTickets } from "../../_customer-care-store.js";

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
    const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = requestUrl.pathname;
    const parts = pathname.split("/").filter(Boolean);

    // Endpoint: /api/customer-care/tickets/:id or /api/customer-care/tickets/:id/attachments
    const ticketId = Number(req.query?.id || parts[2] || 0);
    const isAttachment = parts.includes("attachments");

    const tickets = await readTickets();
    const ticket = tickets.find((t) => Number(t.id) === ticketId);

    if (!ticket) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ message: "Tiket tidak ditemukan" }));
      return;
    }

    if (isAttachment && req.method === "POST") {
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
      res.end(
        JSON.stringify({
          message: "Bukti berhasil diupload",
          data: [mockAttachment],
        })
      );
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
