import { CheckCircle2, Eye, Search, ShieldCheck, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, resolveApiAssetUrl, type AgentApplicationDto, type AgentApplicationStatus } from "../services/api";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function StatusBadge({ status }: { status: AgentApplicationStatus }) {
  const statusMap: Record<AgentApplicationStatus, { label: string; className: string }> = {
    not_verif: { label: "Not verif", className: "bg-amber-50 text-amber-700 ring-amber-200" },
    verif: { label: "Verif", className: "bg-sky-50 text-sky-700 ring-sky-200" },
    official_agent: { label: "Official agent", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    stopped_agent: { label: "Stopped agent", className: "bg-rose-50 text-rose-700 ring-rose-200" },
  };
  const statusMeta = statusMap[status];

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusMeta.className}`}>{statusMeta.label}</span>;
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

function getStatus(application: AgentApplicationDto): AgentApplicationStatus {
  return application.detail_user?.status ?? "not_verif";
}

function DocumentPreview({ label, value }: { label: string; value?: string | null }) {
  const url = resolveApiAssetUrl(value);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-md border border-slate-200 bg-white">
          <img src={url} alt={label} className="h-44 w-full object-contain" />
        </a>
      ) : (
        <p className="mt-2 text-sm text-slate-800">-</p>
      )}
    </div>
  );
}

export function AgentApplications() {
  const [applications, setApplications] = useState<AgentApplicationDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<AgentApplicationStatus | "all">("not_verif");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<AgentApplicationDto | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadApplications = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await api.agentApplications(statusFilter);
      setApplications(response.applications);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat pengajuan agent.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadApplications();
  }, [statusFilter]);

  const filteredApplications = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();
    return applications.filter((application) =>
      [
        application.name,
        application.email,
        application.phone_number,
        application.domicile,
        application.detail_user?.job,
        application.detail_user?.instagram,
        application.detail_user?.target_product,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [applications, searchTerm]);

  const statusCounts = applications.reduce(
    (counts, application) => {
      counts[getStatus(application)] += 1;
      return counts;
    },
    { not_verif: 0, verif: 0, official_agent: 0, stopped_agent: 0 } as Record<AgentApplicationStatus, number>,
  );

  const updateStatus = async (applicationId: number, status: AgentApplicationStatus) => {
    try {
      const response = await api.updateAgentApplicationStatus(applicationId, status);
      setApplications((current) => current.map((item) => (item.id === applicationId ? response.user : item)));
      setSelectedApplication((current) => (current?.id === applicationId ? response.user : current));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal mengubah status agent.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">Super Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Pengajuan agent</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Review data apply-agent, verifikasi pengajuan, lalu aktifkan sebagai official agent jika sudah siap.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-semibold text-[#0F766E] ring-1 ring-teal-200">
          <ShieldCheck className="h-4 w-4" />
          Review dan aktivasi agent
        </div>
      </div>

      {errorMessage && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{errorMessage}</div>}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total loaded" value={String(applications.length)} detail="Sesuai filter aktif" />
        <StatCard label="Not verif" value={String(statusCounts.not_verif)} detail="Pengajuan baru masuk" />
        <StatCard label="Verif" value={String(statusCounts.verif)} detail="Boleh onboarding dan lengkapi data" />
        <StatCard label="Official agent" value={String(statusCounts.official_agent)} detail="Fitur agent penuh aktif" />
        <StatCard label="Stopped agent" value={String(statusCounts.stopped_agent)} detail="Agent diberhentikan" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">List applicant</h2>
            <p className="mt-1 text-sm text-slate-500">Data diambil dari endpoint backend super admin.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cari nama, email, produk..." className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 sm:w-72" />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AgentApplicationStatus | "all")} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100">
              <option value="not_verif">Not verif</option>
              <option value="verif">Verif</option>
              <option value="official_agent">Official agent</option>
              <option value="stopped_agent">Stopped agent</option>
              <option value="all">Semua status</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-600">
                <th className="px-4 py-3 font-semibold">Applicant</th>
                <th className="px-4 py-3 font-semibold">Kontak</th>
                <th className="px-4 py-3 font-semibold">Pekerjaan</th>
                <th className="px-4 py-3 font-semibold">Program</th>
                <th className="px-4 py-3 font-semibold">Target produk</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">Memuat pengajuan...</td></tr>
              ) : filteredApplications.map((application) => {
                const detail = application.detail_user;
                const status = getStatus(application);
                return (
                  <tr key={application.id} className="border-b border-slate-100 text-sm last:border-0">
                    <td className="px-4 py-3"><p className="font-semibold text-slate-950">{application.name}</p><p className="text-xs text-slate-500">{application.email}</p></td>
                    <td className="px-4 py-3"><p className="text-slate-700">{application.phone_number || "-"}</p><p className="text-xs text-slate-500">{application.domicile || "-"}</p></td>
                    <td className="px-4 py-3 text-slate-700">{detail?.job || "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{detail?.agent_program_type || "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{detail?.target_product || "-"}</td>
                    <td className="px-4 py-3"><StatusBadge status={status} /></td>
                    <td className="px-4 py-3 text-slate-600">{detail?.updated_at ? dateFormatter.format(new Date(detail.updated_at)) : "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setSelectedApplication(application)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" />Detail</button>
                        {status === "not_verif" && <button onClick={() => updateStatus(application.id, "verif")} className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-50"><CheckCircle2 className="h-3.5 w-3.5" />Verifikasi</button>}
                        {status === "verif" && <button onClick={() => updateStatus(application.id, "official_agent")} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"><UserPlus className="h-3.5 w-3.5" />Official</button>}
                        {status === "official_agent" && <button onClick={() => updateStatus(application.id, "stopped_agent")} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"><X className="h-3.5 w-3.5" />Stop</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-4 w-full max-w-4xl rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold text-slate-950">{selectedApplication.name}</h2><StatusBadge status={getStatus(selectedApplication)} /></div>
                <p className="mt-1 text-sm text-slate-500">{selectedApplication.email}</p>
              </div>
              <button onClick={() => setSelectedApplication(null)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
              <DocumentPreview label="Foto" value={selectedApplication.detail_user?.photo} />
              <DocumentPreview label="KTP" value={selectedApplication.detail_user?.ktp_photo} />
              {Object.entries({
                Pekerjaan: selectedApplication.detail_user?.job,
                Instagram: selectedApplication.detail_user?.instagram,
                TikTok: selectedApplication.detail_user?.tiktok,
                Facebook: selectedApplication.detail_user?.facebook,
                "Jenis program": selectedApplication.detail_user?.agent_program_type,
                "Alasan": selectedApplication.detail_user?.agent_motivation,
                "Sumber info": selectedApplication.detail_user?.referral_source,
                "Nama referral": selectedApplication.detail_user?.referral_name,
                "Sumber lainnya": selectedApplication.detail_user?.referral_other,
                "Target produk": selectedApplication.detail_user?.target_product,
                Bank: selectedApplication.detail_user?.bank_name,
                Rekening: selectedApplication.detail_user?.account_number,
                TTL: selectedApplication.ttl,
                Alamat: selectedApplication.detail_user?.full_address,
              }).map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-2 text-sm text-slate-800">{value || "-"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
