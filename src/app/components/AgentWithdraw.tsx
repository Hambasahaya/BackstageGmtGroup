import { ArrowDownLeft, ArrowUpRight, Banknote, CheckCircle2, Clock3, FileText, Plus, Search, Wallet, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  api,
  getStoredUser,
  type AgentCommissionDto,
  type WalletDto,
  type WithdrawDto,
} from "../services/api";

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

const dayDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});

function getWithdrawProofUrl(withdraw: WithdrawDto) {
  return withdraw.transfer_proof ?? withdraw.payment_proof ?? withdraw.proof_of_transfer ?? withdraw.bukti_transfer ?? "";
}

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

function StatCard({
  label,
  value,
  detail,
  featuredMobile = false,
}: {
  label: string;
  value: string;
  detail: string;
  featuredMobile?: boolean;
}) {
  if (featuredMobile) {
    return (
      <div className="col-span-2 rounded-lg border border-transparent bg-slate-50 px-4 py-8 text-center shadow-none sm:col-span-1 sm:border-slate-200 sm:bg-white sm:p-5 sm:text-left sm:shadow-sm">
        <p className="text-base font-medium text-slate-400 sm:text-sm sm:text-slate-500">{label}</p>
        <p className="mt-3 truncate text-3xl font-bold leading-none text-slate-950 sm:mt-2 sm:text-2xl">
          {value}
        </p>
        <p className="mt-2 text-xs text-slate-500 sm:text-sm sm:line-clamp-1">{detail}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
      <p className="text-xs sm:text-sm text-slate-500 line-clamp-1">{label}</p>
      <p className="mt-2 text-base sm:text-2xl font-bold text-slate-950 truncate">{value}</p>
      <p className="mt-2 text-[10px] sm:text-sm text-slate-500 line-clamp-2 sm:line-clamp-1">{detail}</p>
    </div>
  );
}

type MobileTransaction = {
  id: string;
  type: "in" | "out";
  title: string;
  subtitle: string;
  amount: number;
  status: "Success" | "On progress";
  poNumber?: string;
  createdAt?: string;
  proofUrl?: string;
};

function MobileTransactionItem({
  transaction,
  isExpanded,
  onToggle,
}: {
  transaction: MobileTransaction;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isIncoming = transaction.type === "in";
  const Icon = isIncoming ? ArrowDownLeft : ArrowUpRight;
  const hasDetails = (isIncoming && !!transaction.poNumber && !!transaction.createdAt) || (!isIncoming && !!transaction.proofUrl);

  return (
    <div className="border-b border-slate-100 py-4 last:border-0">
      <button
        type="button"
        onClick={hasDetails ? onToggle : undefined}
        className="flex w-full items-center gap-3 text-left"
      >
        <div
          className={[
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            isIncoming ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-700",
          ].join(" ")}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-slate-950">{transaction.title}</p>
          <p className="mt-1 truncate text-sm text-slate-400">{transaction.subtitle}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={["text-lg font-bold", isIncoming ? "text-emerald-600" : "text-slate-950"].join(" ")}>
            {isIncoming ? "+" : "-"}
            {currencyFormatter.format(transaction.amount)}
          </p>
          <p className={["mt-1 text-sm font-semibold", transaction.status === "Success" ? "text-emerald-500" : "text-amber-500"].join(" ")}>
            {transaction.status}
          </p>
        </div>
      </button>

      {isExpanded && hasDetails && (
        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3">
          {isIncoming ? (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">{transaction.poNumber}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{dayDateFormatter.format(new Date(transaction.createdAt!))}</p>
                <p className="mt-0.5 text-xs text-slate-400">Jam {timeFormatter.format(new Date(transaction.createdAt!))}</p>
              </div>
              <p className="shrink-0 text-sm font-bold text-emerald-600">+{currencyFormatter.format(transaction.amount)}</p>
            </div>
          ) : (
            <a href={transaction.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F766E] hover:underline">
              <FileText className="h-4 w-4" />
              Lihat bukti transfer
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function AgentWithdraw() {
  const storedUser = getStoredUser();
  const recipientName = storedUser?.name ?? "-";
  const bankName = storedUser?.detail_user?.bank_name ?? "-";
  const accountNumber = storedUser?.detail_user?.account_number ?? "-";
  const [rawWallet, setRawWallet] = useState<WalletDto>(defaultWallet);
  const [withdraws, setWithdraws] = useState<WithdrawDto[]>(defaultWithdraws);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [transferRecipientName, setTransferRecipientName] = useState(recipientName === "-" ? "" : recipientName);
  const [transferBankName, setTransferBankName] = useState(bankName === "-" ? "" : bankName);
  const [transferAccountNumber, setTransferAccountNumber] = useState(accountNumber === "-" ? "" : accountNumber);
  const [commissions, setCommissions] = useState<AgentCommissionDto[]>([]);
  const [allCommissions, setAllCommissions] = useState<AgentCommissionDto[]>([]);
  const [commissionTotalAmount, setCommissionTotalAmount] = useState<number | null>(null);
  const [commissionTotalCount, setCommissionTotalCount] = useState<number | null>(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"" | "partial" | "paid">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedMobileTransactionId, setExpandedMobileTransactionId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCommissionLoading, setIsCommissionLoading] = useState(false);

  const wallet = useMemo<WalletDto>(() => {
    const sumFromAllCommissions = allCommissions.reduce(
      (acc, c) => acc + (c.commission_amount ?? c.total_komisi ?? 0),
      0,
    );
    const sumFromFilteredCommissions = commissions.reduce(
      (acc, c) => acc + (c.commission_amount ?? c.total_komisi ?? 0),
      0,
    );
    const effectiveTotalCommission = Math.max(
      rawWallet.total_commission || 0,
      sumFromAllCommissions,
      sumFromFilteredCommissions,
      commissionTotalAmount || 0,
    );

    const withdrawn = rawWallet.withdrawn_balance || 0;
    const pending = rawWallet.pending_withdraw || 0;
    const computedAvailable = Math.max(0, effectiveTotalCommission - withdrawn - pending);

    return {
      total_commission: effectiveTotalCommission,
      available_balance: Math.max(rawWallet.available_balance || 0, computedAvailable),
      pending_withdraw: pending,
      withdrawn_balance: withdrawn,
    };
  }, [rawWallet, allCommissions, commissions, commissionTotalAmount]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadWithdrawData = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [walletResponse, withdrawResponse] = await Promise.all([
        api.agentWallet(),
        api.agentWithdraws(),
      ]);
      setRawWallet(walletResponse.wallet ?? emptyWallet);
      setWithdraws(Array.isArray(withdrawResponse.withdraws) ? withdrawResponse.withdraws : []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat data withdraw agent.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCommissionsData = async (statusFilter?: string, search?: string) => {
    setIsCommissionLoading(true);
    try {
      let fullList = allCommissions;
      if (allCommissions.length === 0 || (!statusFilter && !search)) {
        const fullResponse = await api.agentCommissions();
        fullList = Array.isArray(fullResponse?.commissions) ? fullResponse.commissions : [];
        setAllCommissions(fullList);
      }

      if (!statusFilter && !search) {
        setCommissions(fullList);
        const fullSum = fullList.reduce((acc, c) => acc + (c.commission_amount ?? c.total_komisi ?? 0), 0);
        setCommissionTotalAmount(fullSum);
        setCommissionTotalCount(fullList.length);
      } else {
        const response = await api.agentCommissions({
          payment_status: statusFilter || undefined,
          search: search || undefined,
        });
        const list = Array.isArray(response?.commissions) ? response.commissions : [];
        setCommissions(list);
        setCommissionTotalAmount(typeof response?.total_commission === "number" ? response.total_commission : null);
        setCommissionTotalCount(typeof response?.total_count === "number" ? response.total_count : null);
      }
    } catch (error) {
      console.error("Failed to load agent commissions:", error);
      setCommissions([]);
    } finally {
      setIsCommissionLoading(false);
    }
  };

  useEffect(() => {
    void loadWithdrawData();
  }, []);

  useEffect(() => {
    void loadCommissionsData(paymentStatusFilter, debouncedSearch);
  }, [paymentStatusFilter, debouncedSearch]);

  const parsedAmount = useMemo(() => Number(amount), [amount]);
  const formattedAmount = amount ? currencyFormatter.format(parsedAmount) : "";
  const mobileTransactions = useMemo<MobileTransaction[]>(() => {
    const transactions: MobileTransaction[] = commissions.map((comm) => ({
      id: `commission-${comm.id}`,
      type: "in",
      title: "Komisi masuk",
      subtitle: comm.po_number ?? (comm.nama_customer ? `PO ${comm.nama_customer}` : `PO-#${comm.id}`),
      amount: comm.commission_amount ?? comm.total_komisi ?? 0,
      status: "Success",
      poNumber: comm.po_number ?? `PO-#${comm.id}`,
      createdAt: comm.created_at ?? new Date().toISOString(),
    }));

    withdraws.forEach((withdraw) => {
      transactions.push({
        id: `withdraw-${withdraw.id}`,
        type: "out",
        title: "Withdraw",
        subtitle: `${withdraw.withdraw_number ?? `WD-${withdraw.id}`} - ${dateFormatter.format(new Date(withdraw.created_at))}`,
        amount: withdraw.amount,
        status: withdraw.status === "approval" ? "Success" : "On progress",
        proofUrl: getWithdrawProofUrl(withdraw),
      });
    });

    return transactions.sort((first, second) => {
      const firstDate = first.createdAt ?? withdraws.find((withdraw) => `withdraw-${withdraw.id}` === first.id)?.created_at ?? "";
      const secondDate = second.createdAt ?? withdraws.find((withdraw) => `withdraw-${withdraw.id}` === second.id)?.created_at ?? "";

      return new Date(secondDate).getTime() - new Date(firstDate).getTime();
    });
  }, [commissions, withdraws]);

  const openWithdrawModal = () => {
    setAmount(wallet.available_balance > 0 ? String(wallet.available_balance) : "");
    setTransferRecipientName(recipientName === "-" ? "" : recipientName);
    setTransferBankName(bankName === "-" ? "" : bankName);
    setTransferAccountNumber(accountNumber === "-" ? "" : accountNumber);
    setFormError("");
    setIsModalOpen(true);
  };

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

    const finalRecipientName = transferRecipientName.trim();
    const finalBankName = transferBankName.trim();
    const finalAccountNumber = transferAccountNumber.trim();

    if (!finalRecipientName || !finalBankName || !finalAccountNumber) {
      setFormError("Lengkapi nama penerima, bank, dan nomor rekening tujuan transfer.");
      return;
    }

    if (/\D/.test(finalAccountNumber)) {
      setFormError("Nomor rekening hanya boleh berisi angka.");
      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: "Konfirmasi rekening penerima",
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.6">
          <p>Pastikan data rekening tujuan withdraw sudah benar sebelum pengajuan dikirim.</p>
          <div style="margin-top:12px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
            <div style="display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-bottom:1px solid #e2e8f0">
              <span style="color:#64748b">Nama penerima</span><strong>${finalRecipientName}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-bottom:1px solid #e2e8f0">
              <span style="color:#64748b">Bank</span><strong>${finalBankName}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-bottom:1px solid #e2e8f0">
              <span style="color:#64748b">Nomor rekening</span><strong>${finalAccountNumber}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;gap:12px;padding:10px 12px">
              <span style="color:#64748b">Nominal withdraw</span><strong>${currencyFormatter.format(parsedAmount)}</strong>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Kirim pengajuan",
      cancelButtonText: "Periksa lagi",
      confirmButtonColor: "#0F766E",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      await api.createAgentWithdraw({
        amount: parsedAmount,
        recipient_name: finalRecipientName,
        bank_name: finalBankName,
        account_number: finalAccountNumber,
      });
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
          onClick={openWithdrawModal}
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59]"
        >
          <Plus className="h-4 w-4" />
          Buat pengajuan
        </button>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label="Total komisi"
          value={currencyFormatter.format(wallet.total_commission)}
          detail="Akumulasi komisi approve"
          featuredMobile
        />
        <StatCard
          label="Sudah ditarik"
          value={currencyFormatter.format(wallet.withdrawn_balance)}
          detail="Total withdraw yang sudah approval"
        />
        <StatCard
          label="Sisa komisi"
          value={currencyFormatter.format(wallet.available_balance)}
          detail="Saldo komisi yang tersedia"
        />
      </section>

      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      )}

      <section className="rounded-lg bg-white px-4 py-3 sm:border sm:border-slate-200 sm:p-0 sm:shadow-sm">
        <div className="flex items-center justify-between gap-3 py-2 sm:hidden">
          <h2 className="text-xl font-bold text-slate-950">Recent Transaction</h2>
          <button type="button" className="text-base font-bold text-blue-500">
            See all
          </button>
        </div>

        <div className="mt-2 overflow-hidden rounded-lg bg-white sm:hidden">
          {mobileTransactions.length > 0 ? (
            mobileTransactions.map((transaction) => (
              <MobileTransactionItem
                key={transaction.id}
                transaction={transaction}
                isExpanded={expandedMobileTransactionId === transaction.id}
                onToggle={() => setExpandedMobileTransactionId((current) => current === transaction.id ? null : transaction.id)}
              />
            ))
          ) : (
            <div className="py-6 text-sm font-medium text-slate-500">Belum ada transaksi.</div>
          )}
        </div>

        <div className="hidden flex-col gap-2 border-b border-slate-200 p-5 sm:flex sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">List pengajuan withdraw</h2>
            <p className="mt-1 text-sm text-slate-500">Riwayat pengajuan withdraw agent yang sedang diproses atau sudah approval.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-semibold text-[#0F766E] ring-1 ring-teal-200">
            <Wallet className="h-4 w-4" />
            {isLoading ? "Memuat" : `${withdraws.length} pengajuan`}
          </div>
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-600">
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Nominal</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Bukti transfer</th>
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
                  <td className="px-4 py-3">
                    {getWithdrawProofUrl(withdraw) ? (
                      <a href={getWithdrawProofUrl(withdraw)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:underline">
                        <FileText className="h-3.5 w-3.5" />
                        Lihat bukti
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Belum ada</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:block">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-950">Komisi masuk</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <ArrowDownLeft className="h-3.5 w-3.5" />
                {isCommissionLoading ? "Memuat..." : `${commissionTotalCount ?? commissions.length} komisi`}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Riwayat komisi dari PO yang sudah cair (Lunas / DP 50%).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setPaymentStatusFilter("")}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  paymentStatusFilter === "" ? "bg-white text-slate-950 shadow-xs" : "hover:text-slate-900"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatusFilter("partial")}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  paymentStatusFilter === "partial" ? "bg-white text-emerald-700 shadow-xs" : "hover:text-slate-900"
                }`}
              >
                DP 50%
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatusFilter("paid")}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  paymentStatusFilter === "paid" ? "bg-white text-emerald-700 shadow-xs" : "hover:text-slate-900"
                }`}
              >
                Lunas
              </button>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari No PO / Customer..."
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-teal-200"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600">
                <th className="px-4 py-3">No. PO / Produk</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status Pembayaran</th>
                <th className="px-4 py-3 text-right">Total PO</th>
                <th className="px-4 py-3 text-right">Komisi Cair</th>
                <th className="px-4 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isCommissionLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-medium">
                    Memuat data komisi...
                  </td>
                </tr>
              ) : commissions.length > 0 ? (
                commissions.map((comm) => {
                  const komisiAmt = comm.commission_amount ?? comm.total_komisi ?? 0;
                  const isDp = comm.payment_status === "partial" || comm.payment_stage?.toLowerCase().includes("dp");
                  const stageText = comm.payment_stage || (isDp ? "DP 50%" : "Lunas");

                  return (
                    <tr key={comm.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-950">{comm.po_number || `PO-#${comm.id}`}</p>
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{comm.product_name || "Preorder Produk"}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-900">{comm.nama_customer || "-"}</p>
                        {comm.nama_perusahaan && (
                          <p className="mt-0.5 text-xs text-slate-500">{comm.nama_perusahaan}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isDp
                              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                              : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          }`}
                        >
                          {stageText}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-slate-700">
                        {comm.total ? currencyFormatter.format(comm.total) : "-"}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                        +{currencyFormatter.format(komisiAmt)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {comm.created_at ? dateFormatter.format(new Date(comm.created_at)) : "-"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-medium">
                    Belum ada riwayat komisi masuk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {commissionTotalAmount !== null && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium text-slate-600">
            <span>Total Komisi Riwayat</span>
            <span className="text-sm font-bold text-emerald-600">
              {currencyFormatter.format(commissionTotalAmount)}
            </span>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
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
              <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium leading-6 text-[#0F766E]">
                Pencairan komisi akan diproses oleh tim Finance dan masuk ke rekening maksimal 1x24 jam setelah pengajuan withdraw dikonfirmasi.
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-slate-950">Rekening tujuan transfer</p>
                  <p className="mt-1 text-xs text-slate-500">Data diambil dari profil agent. Ubah jika pencairan ingin dikirim ke rekening lain.</p>
                </div>
                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">Nama penerima</span>
                    <input
                      value={transferRecipientName}
                      onChange={(event) => setTransferRecipientName(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                      placeholder="Nama penerima"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">Bank</span>
                    <input
                      value={transferBankName}
                      onChange={(event) => setTransferBankName(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                      placeholder="Nama bank"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">Nomor rekening</span>
                    <input
                      value={transferAccountNumber}
                      onChange={(event) => setTransferAccountNumber(event.target.value)}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 ${/\D/.test(transferAccountNumber) ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100" : "border-slate-300 focus:border-[#0F766E] focus:ring-teal-100"}`}
                      placeholder="Nomor rekening"
                      required
                    />
                    {/\D/.test(transferAccountNumber) && <p className="mt-1.5 text-xs font-medium text-rose-600">Nomor rekening hanya boleh berisi angka.</p>}
                  </label>
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Nominal withdraw</span>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={formattedAmount}
                    readOnly
                    type="text"
                    placeholder={currencyFormatter.format(0)}
                    className="w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-50 py-3 pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none"
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
                  disabled={!transferRecipientName.trim() || !transferBankName.trim() || !transferAccountNumber.trim() || /\D/.test(transferAccountNumber)}
                  className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-400"
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





