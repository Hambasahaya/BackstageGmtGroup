import { CalendarDays, Edit3, Eye, Plus, RefreshCw, Search, Trash2, Users, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type EducationDto, type EducationParticipantDto, type EducationPayload } from "../services/api";
import Swal from "sweetalert2";

const currentMonth = new Date().toISOString().slice(0, 7);

const emptyForm: EducationPayload = {
  title: "",
  description: "",
  full_description: "",
  date: new Date().toISOString().slice(0, 10),
  time: "09:00",
  type: "Offline",
  status: "Available",
  max_attendees: 50,
  current_attendees: 0,
  location: "",
  venue: "",
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const className = normalized.includes("available")
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : normalized.includes("full") || normalized.includes("closed")
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : normalized.includes("cancel")
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}>{status || "-"}</span>;
}

function getParticipants(event: EducationDto | null) {
  return event?.participants ?? event?.registrations ?? [];
}

function getParticipantName(participant: EducationParticipantDto) {
  return [participant.salutation, participant.first_name, participant.surname].filter(Boolean).join(" ") || participant.name || "-";
}

function compactPayload(form: EducationPayload): EducationPayload {
  return {
    ...form,
    max_attendees: Number(form.max_attendees || 0),
    current_attendees: Number(form.current_attendees || 0),
  };
}

function EventFormModal({
  event,
  onClose,
  onSubmit,
  isSaving,
}: {
  event: EducationDto | null;
  onClose: () => void;
  onSubmit: (payload: EducationPayload) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<EducationPayload>(() => ({
    ...emptyForm,
    ...(event
      ? {
          title: event.title ?? "",
          description: event.description ?? "",
          full_description: event.full_description ?? "",
          date: event.date ?? emptyForm.date,
          time: event.time ?? "09:00",
          type: event.type ?? "Offline",
          status: event.status ?? "Available",
          max_attendees: event.max_attendees ?? 0,
          current_attendees: event.current_attendees ?? 0,
          location: (event.location as string | undefined) ?? "",
          venue: (event.venue as string | undefined) ?? "",
        }
      : {}),
  }));

  const update = (key: keyof EducationPayload, value: string | number) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4">
      <form
        onSubmit={(submitEvent) => {
          submitEvent.preventDefault();
          onSubmit(compactPayload(form));
        }}
        className="my-4 w-full max-w-3xl rounded-lg bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{event ? "Edit education event" : "Tambah education event"}</h2>
            <p className="mt-1 text-sm text-slate-500">Data akan disimpan ke endpoint super admin `/api/educations`.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Judul</span>
            <input required value={form.title} onChange={(changeEvent) => update("title", changeEvent.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" />
          </label>
          <label>
            <span className="text-sm font-medium text-slate-700">Tanggal</span>
            <input type="date" required value={form.date} onChange={(changeEvent) => update("date", changeEvent.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" />
          </label>
          <label>
            <span className="text-sm font-medium text-slate-700">Waktu</span>
            <input type="time" value={form.time} onChange={(changeEvent) => update("time", changeEvent.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" />
          </label>
          <label>
            <span className="text-sm font-medium text-slate-700">Tipe</span>
            <select value={form.type} onChange={(changeEvent) => update("type", changeEvent.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100">
              <option value="Offline">Offline</option>
              <option value="Online">Online</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </label>
          <label>
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select value={form.status} onChange={(changeEvent) => update("status", changeEvent.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100">
              <option value="Available">Available</option>
              <option value="Full">Full</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>
          <label>
            <span className="text-sm font-medium text-slate-700">Kapasitas</span>
            <input type="number" min={0} value={form.max_attendees ?? 0} onChange={(changeEvent) => update("max_attendees", Number(changeEvent.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" />
          </label>
          <label>
            <span className="text-sm font-medium text-slate-700">Peserta saat ini</span>
            <input type="number" min={0} value={form.current_attendees ?? 0} onChange={(changeEvent) => update("current_attendees", Number(changeEvent.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" />
          </label>
          <label>
            <span className="text-sm font-medium text-slate-700">Lokasi</span>
            <input value={form.location ?? ""} onChange={(changeEvent) => update("location", changeEvent.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" />
          </label>
          <label>
            <span className="text-sm font-medium text-slate-700">Venue</span>
            <input value={form.venue ?? ""} onChange={(changeEvent) => update("venue", changeEvent.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" />
          </label>
          <label className="md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Deskripsi singkat</span>
            <textarea value={form.description ?? ""} onChange={(changeEvent) => update("description", changeEvent.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" />
          </label>
          <label className="md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Deskripsi lengkap</span>
            <textarea value={form.full_description ?? ""} onChange={(changeEvent) => update("full_description", changeEvent.target.value)} rows={5} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 p-5">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Batal</button>
          <button disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-400">
            <Plus className="h-4 w-4" />
            {isSaving ? "Menyimpan..." : "Simpan event"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function EducationEvents() {
  const [events, setEvents] = useState<EducationDto[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EducationDto | null>(null);
  const [editingEvent, setEditingEvent] = useState<EducationDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [month, setMonth] = useState(currentMonth);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, total_pages: 1 });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await api.educations({
        month,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: meta.limit,
      });
      setEvents(response.data ?? []);
      setMeta(response.meta ?? { total: response.data?.length ?? 0, page, limit: meta.limit, total_pages: 1 });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat education event.");
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [meta.limit, month, page, statusFilter, typeFilter]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();
    return events.filter((event) =>
      [event.title, event.description, event.type, event.status, event.location, event.venue]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [events, searchTerm]);

  const stats = useMemo(() => {
    const available = events.filter((event) => event.status?.toLowerCase() === "available").length;
    const attendees = events.reduce((total, event) => total + Number(event.current_attendees ?? 0), 0);
    const capacity = events.reduce((total, event) => total + Number(event.max_attendees ?? 0), 0);
    return { available, attendees, capacity };
  }, [events]);

  const openDetail = async (event: EducationDto) => {
    setErrorMessage("");
    setSelectedEvent(event);
    try {
      const response = await api.educationDetail(event.id);
      setSelectedEvent(response.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat detail event.");
    }
  };

  const submitForm = async (payload: EducationPayload) => {
    setIsSaving(true);
    setErrorMessage("");
    try {
      if (editingEvent) {
        await api.updateEducation(editingEvent.id, payload);
      } else {
        await api.createEducation(payload);
      }
      setIsFormOpen(false);
      setEditingEvent(null);
      await Swal.fire({
        icon: "success",
        title: editingEvent ? "Event Diperbarui" : "Event Ditambahkan",
        text: "Data education event berhasil disimpan.",
        confirmButtonColor: "#0F766E",
      });
      await loadEvents();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal menyimpan event.";
      setErrorMessage(msg);
      void Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: msg,
        confirmButtonColor: "#0F766E",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEvent = async (event: EducationDto) => {
    const result = await Swal.fire({
      title: "Hapus Event?",
      text: `Apakah Anda yakin ingin menghapus event "${event.title}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#D33",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;

    setErrorMessage("");
    try {
      await api.deleteEducation(event.id);
      await loadEvents();
      setSelectedEvent((current) => (current?.id === event.id ? null : current));
      void Swal.fire({
        icon: "success",
        title: "Event Dihapus",
        text: "Education event berhasil dihapus.",
        confirmButtonColor: "#0F766E",
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal menghapus event.";
      setErrorMessage(msg);
      void Swal.fire({
        icon: "error",
        title: "Gagal Menghapus",
        text: msg,
        confirmButtonColor: "#0F766E",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">Super Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Education Events</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">Kelola acara education, pantau kapasitas, dan lihat peserta yang sudah register.</p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59]"
        >
          <Plus className="h-4 w-4" />
          Tambah event
        </button>
      </div>

      {errorMessage && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{errorMessage}</div>}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total event" value={String(meta.total || events.length)} detail="Sesuai filter aktif" />
        <StatCard label="Available" value={String(stats.available)} detail="Masih bisa didaftari" />
        <StatCard label="Peserta" value={String(stats.attendees)} detail="Akumulasi current attendees" />
        <StatCard label="Kapasitas" value={String(stats.capacity)} detail="Total slot dari event loaded" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Daftar education event</h2>
            <p className="mt-1 text-sm text-slate-500">Kelola Events</p>
          </div>
          <div className="flex flex-col gap-2 lg:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={searchTerm} onChange={(changeEvent) => setSearchTerm(changeEvent.target.value)} placeholder="Cari event..." className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 lg:w-56" />
            </div>
            <input type="month" value={month} onChange={(changeEvent) => { setMonth(changeEvent.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" />
            <select value={typeFilter} onChange={(changeEvent) => { setTypeFilter(changeEvent.target.value); setPage(1); }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100">
              <option value="">Semua tipe</option>
              <option value="Offline">Offline</option>
              <option value="Online">Online</option>
              <option value="Hybrid">Hybrid</option>
            </select>
            <select value={statusFilter} onChange={(changeEvent) => { setStatusFilter(changeEvent.target.value); setPage(1); }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100">
              <option value="">Semua status</option>
              <option value="Available">Available</option>
              <option value="Full">Full</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button onClick={() => void loadEvents()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-600">
                <th className="px-4 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 font-semibold">Jadwal</th>
                <th className="px-4 py-3 font-semibold">Tipe</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Peserta</th>
                <th className="px-4 py-3 font-semibold">Lokasi</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">Memuat education event...</td></tr>
              ) : filteredEvents.length ? (
                filteredEvents.map((event) => (
                  <tr key={event.id} className="border-b border-slate-100 text-sm last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">{event.title}</p>
                      <p className="mt-1 line-clamp-1 max-w-[340px] text-xs text-slate-500">{event.description || event.id}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                        {event.date ? dateFormatter.format(new Date(event.date)) : "-"} {event.time || ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{event.type}</td>
                    <td className="px-4 py-3"><StatusBadge status={event.status} /></td>
                    <td className="px-4 py-3 text-slate-700">{Number(event.current_attendees ?? 0)} / {Number(event.max_attendees ?? 0)}</td>
                    <td className="px-4 py-3 text-slate-700">{event.venue || event.location || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => void openDetail(event)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" />Detail</button>
                        <button onClick={() => { setEditingEvent(event); setIsFormOpen(true); }} className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-50"><Edit3 className="h-3.5 w-3.5" />Edit</button>
                        <button onClick={() => void deleteEvent(event)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" />Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">Belum ada event pada filter ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Halaman {meta.page || page} dari {meta.total_pages || 1}, total {meta.total || filteredEvents.length} event</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Sebelumnya</button>
            <button disabled={page >= (meta.total_pages || 1)} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Berikutnya</button>
          </div>
        </div>
      </section>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-4 w-full max-w-5xl rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-950">{selectedEvent.title}</h2>
                  <StatusBadge status={selectedEvent.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">{selectedEvent.date} {selectedEvent.time || ""} - {selectedEvent.type}</p>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kapasitas</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{Number(selectedEvent.current_attendees ?? 0)} / {Number(selectedEvent.max_attendees ?? 0)} peserta</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lokasi</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{selectedEvent.venue || selectedEvent.location || "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Peserta loaded</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{getParticipants(selectedEvent).length} registrasi</p>
              </div>
              <div className="lg:col-span-3">
                <p className="text-sm leading-6 text-slate-600">{selectedEvent.full_description || selectedEvent.description || "Tidak ada deskripsi."}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0F766E]" />
                <h3 className="font-semibold text-slate-950">Peserta event</h3>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-600">
                      <th className="px-4 py-3 font-semibold">Nama</th>
                      <th className="px-4 py-3 font-semibold">Kontak</th>
                      <th className="px-4 py-3 font-semibold">Company</th>
                      <th className="px-4 py-3 font-semibold">Meal</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getParticipants(selectedEvent).length ? (
                      getParticipants(selectedEvent).map((participant, index) => (
                        <tr key={String(participant.registration_id ?? participant.id ?? index)} className="border-b border-slate-100 text-sm last:border-0">
                          <td className="px-4 py-3 font-semibold text-slate-950">{getParticipantName(participant)}</td>
                          <td className="px-4 py-3 text-slate-700"><p>{participant.email || "-"}</p><p className="text-xs text-slate-500">{participant.phone_mobile || participant.phone_landline || "-"}</p></td>
                          <td className="px-4 py-3 text-slate-700"><p>{participant.company || "-"}</p><p className="text-xs text-slate-500">{participant.position || "-"}</p></td>
                          <td className="px-4 py-3 text-slate-700">{participant.meal_preference || "-"}</td>
                          <td className="px-4 py-3"><StatusBadge status={participant.status || "Registered"} /></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">Detail event belum mengirim data participants/registrations.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && <EventFormModal event={editingEvent} onClose={() => { setIsFormOpen(false); setEditingEvent(null); }} onSubmit={submitForm} isSaving={isSaving} />}
    </div>
  );
}
