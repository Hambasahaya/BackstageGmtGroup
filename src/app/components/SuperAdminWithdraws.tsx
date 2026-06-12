import { CheckCircle2, Clock3, Search, ShieldCheck, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, type WithdrawDto, type WithdrawStatus } from "../services/api";

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

function StatusBadge({ status }: { status: WithdrawStatus }) {
  if (status === "approval") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Approval
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
      <Clock3 className="h-3.5 w-3.5" />
      On progress
    </span>
  );
}

export function SuperAdminWithdraws() {
  const [withdraws, setWithdraws] = useState<WithdrawDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<WithdrawStatus | "all">("on_progress");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadWithdraws = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await api.superAdminWithdraws(statusFilter === "all" ? undefined : statusFilter);
      setWithdraws(response.withdraws);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat withdraw super admin.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadWithdraws();
  }, [statusFilter]);

  const filteredWithdraws = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();
    return withdraws.filter((withdraw) =>
      [withdraw.withdraw_number ?? `WD-${withdraw.id}`, withdraw.status, withdraw.amount]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [searchTerm, withdraws]);

  const approveWithdraw = async (withdraw: WithdrawDto) => {
    if (withdraw.status !== "on_progress") {
      return;
    }

    try {
      await api.approveWithdraw(withdraw.id);
      await loadWithdraws();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal approve withdraw.");
    }
  };

  const pendingCount = withdraws.filter((withdraw) => withdraw.status === "on_progress").length;
  const approvalCount = withdraws.filter((withdraw) => withdraw.status === "approval").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">Super Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Approval withdraw agent</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Review semua pengajuan withdraw dan ubah status on_progress menjadi approval.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-semibold text-[#0F766E] ring-1 ring-teal-200">
          <ShieldCheck className="h-4 w-4" />
          Super admin
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total withdraw</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{withdraws.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">On progress</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{pendingCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Approval</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{approvalCount}</p>
        </div>
      </section>

      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">List withdraw</h2>
            <p className="mt-1 text-sm text-slate-500">Data dari endpoint /api/super-admin/withdraws.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari withdraw..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 sm:w-72"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as WithdrawStatus | "all")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
            >
              <option value="on_progress">On progress</option>
              <option value="approval">Approval</option>
              <option value="all">Semua status</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-600">
                <th className="px-4 py-3 font-semibold">Withdraw</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Nominal</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdraws.map((withdraw) => (
                <tr key={withdraw.id} className="border-b border-slate-100 text-sm last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-950">{withdraw.withdraw_number ?? `WD-${withdraw.id}`}</td>
                  <td className="px-4 py-3 text-slate-600">{dateFormatter.format(new Date(withdraw.created_at))}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{currencyFormatter.format(withdraw.amount)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={withdraw.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void approveWithdraw(withdraw)}
                      disabled={withdraw.status !== "on_progress"}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading && <div className="px-4 py-5 text-sm text-slate-500">Memuat withdraw...</div>}
        </div>
      </section>
    </div>
  );
}
