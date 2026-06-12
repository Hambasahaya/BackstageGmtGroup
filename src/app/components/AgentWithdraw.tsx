import { Banknote, CheckCircle2, Clock3, Plus, Wallet, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, type WalletDto, type WithdrawDto } from "../services/api";

const defaultWallet: WalletDto = {
  total_commission: 12500000,
  available_balance: 8500000,
  pending_withdraw: 1500000,
  withdrawn_balance: 2500000,
};

const emptyWallet: WalletDto = {
  total_commission: 0,
  available_balance: 0,
  pending_withdraw: 0,
  withdrawn_balance: 0,
};

const defaultWithdraws: WithdrawDto[] = [
  {
    id: 1003,
    withdraw_number: "WD-1003",
    amount: 1500000,
    status: "on_progress",
    created_at: "2026-06-10T09:20:00.000Z",
  },
  {
    id: 1002,
    withdraw_number: "WD-1002",
    amount: 2500000,
    status: "approval",
    created_at: "2026-06-02T14:10:00.000Z",
  },
];

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

function StatusBadge({ status }: { status: WithdrawDto["status"] }) {
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

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

export function AgentWithdraw() {
  const [wallet, setWallet] = useState<WalletDto>(defaultWallet);
  const [withdraws, setWithdraws] = useState<WithdrawDto[]>(defaultWithdraws);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadWithdrawData = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [walletResponse, withdrawResponse] = await Promise.all([api.agentWallet(), api.agentWithdraws()]);
      setWallet(walletResponse.wallet ?? emptyWallet);
      setWithdraws(Array.isArray(withdrawResponse.withdraws) ? withdrawResponse.withdraws : []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat data withdraw agent.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadWithdrawData();
  }, []);

  const parsedAmount = useMemo(() => Number(amount), [amount]);

  const closeModal = () => {
    setIsModalOpen(false);
    setAmount("");
    setFormError("");
  };

  const submitWithdraw = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError("Nominal withdraw harus lebih dari 0.");
      return;
    }

    if (parsedAmount > wallet.available_balance) {
      setFormError("Nominal withdraw melebihi saldo tersedia.");
      return;
    }

    try {
      await api.createAgentWithdraw(parsedAmount);
      closeModal();
      await loadWithdrawData();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Gagal membuat pengajuan withdraw.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">Agent Withdraw</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Saldo dan pengajuan withdraw</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Pantau balance komisi agent dan buat pengajuan withdraw dari saldo yang tersedia.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59]"
        >
          <Plus className="h-4 w-4" />
          Buat pengajuan
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total komisi" value={currencyFormatter.format(wallet.total_commission)} detail="Akumulasi komisi approve" />
        <StatCard label="Available balance" value={currencyFormatter.format(wallet.available_balance)} detail="Saldo yang bisa di-withdraw" />
        <StatCard label="Pending withdraw" value={currencyFormatter.format(wallet.pending_withdraw)} detail="Menunggu proses admin" />
        <StatCard label="Withdrawn balance" value={currencyFormatter.format(wallet.withdrawn_balance)} detail="Sudah disetujui admin" />
      </section>

      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">List pengajuan withdraw</h2>
            <p className="mt-1 text-sm text-slate-500">Riwayat pengajuan withdraw agent yang sedang diproses atau sudah approval.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-semibold text-[#0F766E] ring-1 ring-teal-200">
            <Wallet className="h-4 w-4" />
            {isLoading ? "Memuat" : `${withdraws.length} pengajuan`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-600">
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Nominal</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {withdraws.map((withdraw) => (
                <tr key={withdraw.id} className="border-b border-slate-100 text-sm last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-950">{withdraw.withdraw_number ?? `WD-${withdraw.id}`}</td>
                  <td className="px-4 py-3 text-slate-600">{dateFormatter.format(new Date(withdraw.created_at))}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{currencyFormatter.format(withdraw.amount)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={withdraw.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Buat pengajuan withdraw</h2>
                <p className="mt-1 text-sm text-slate-500">Saldo tersedia: {currencyFormatter.format(wallet.available_balance)}</p>
              </div>
              <button onClick={closeModal} className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitWithdraw} className="space-y-4 p-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Nominal withdraw</span>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    type="number"
                    min="1"
                    max={wallet.available_balance}
                    placeholder="Contoh: 500000"
                    className="w-full rounded-lg border border-slate-300 py-3 pl-9 pr-3 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                    required
                  />
                </div>
              </label>

              {formError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59]"
                >
                  Ajukan withdraw
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
