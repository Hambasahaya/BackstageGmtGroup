import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const BOOKINGS_STORE_PATH =
  process.env.BOOKINGS_STORE_PATH ||
  path.join(os.tmpdir(), "gmtgroupbe-bookings.json");

const defaultBookings = [
  {
    id: "DEMO-1785213729",
    type: "demo",
    name: "John Doe",
    email: "john@example.com",
    position: "Event Director",
    referralSource: "Instagram",
    category: "Corporate",
    preferredDate: "2026-07-28 10:00 AM",
    usedGmtProduct: "Yes",
    interestedProduct: "Moxlite",
    created_at: "2026-07-28T10:00:00+07:00",
    updated_at: "2026-07-28T10:00:00+07:00",
  },
  {
    id: "EVENT-8912304912",
    type: "event",
    name: "Jane Smith",
    email: "jane@example.com",
    position: "Marketing Manager",
    referralSource: "LinkedIn",
    category: "Enterprise",
    preferredDate: "2026-08-05 02:00 PM",
    usedGmtProduct: "No",
    interestedProduct: "GMT Suite Pro",
    capacity: 250,
    deck: "https://is3.cloudhost.id/gmtsuites/documents/gmt-suite-pro-event-deck.pdf",
    description: "Peluncuran produk skala enterprise dengan target 250 peserta dari sektor teknologi dan finansial.",
    created_at: "2026-07-28T11:30:00+07:00",
    updated_at: "2026-07-28T11:30:00+07:00",
  },
];

export async function readBookings() {
  try {
    const raw = await fs.readFile(BOOKINGS_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultBookings;
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeBookings(defaultBookings);
      return defaultBookings;
    }
    return defaultBookings;
  }
}

export async function writeBookings(bookings) {
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  await fs.mkdir(path.dirname(BOOKINGS_STORE_PATH), { recursive: true });
  await fs.writeFile(BOOKINGS_STORE_PATH, JSON.stringify(safeBookings, null, 2), "utf8");
}
export async function updateBookingStatus(id, status) {
  const normalizedId = String(id || "").trim();
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (!normalizedId) {
    const error = new Error("Booking id is required");
    error.statusCode = 400;
    throw error;
  }

  if (!normalizedStatus) {
    const error = new Error("Booking status is required");
    error.statusCode = 400;
    throw error;
  }

  const bookings = await readBookings();
  const bookingIndex = bookings.findIndex((booking) => String(booking.id) === normalizedId);

  if (bookingIndex === -1) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  const updatedBooking = {
    ...bookings[bookingIndex],
    status: normalizedStatus,
    updated_at: new Date().toISOString(),
  };

  const updatedBookings = [...bookings];
  updatedBookings[bookingIndex] = updatedBooking;

  await writeBookings(updatedBookings);
  return updatedBooking;
}
