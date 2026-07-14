import { useEffect, useState, useMemo } from "react";
import {
  Trophy,
  Award,
  TrendingUp,
  Target,
  CheckCircle,
  Calendar,
  Lock,
  Gift,
  AlertCircle,
  ChevronRight,
  Flame,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { api, type PreorderDto, connectAgentPreorderStream } from "../services/api";

type AchievementTier = {
  name: string;
  target: number; // in IDR
  reward: string;
  commissionBonus: string;
  color: string; // Tailwind border/text color class
  bgColor: string; // Tailwind background color class
  accentColor: string; // HEX color for visual charts
  description: string;
};

const ACHIEVEMENT_TIERS: AchievementTier[] = [
  {
    name: "Bronze Agent",
    target: 100000000, // 100 Juta
    reward: "Extra Komisi 1.0%",
    commissionBonus: "+1% Rate",
    color: "text-amber-700 border-amber-200 bg-amber-50",
    bgColor: "bg-amber-100",
    accentColor: "#B45309",
    description: "Langkah awal pembuktian diri sebagai Agent GMT Group resmi.",
  },
  {
    name: "Silver Agent",
    target: 300000000, // 300 Juta
    reward: "Extra Komisi 1.5% + Prioritas Support",
    commissionBonus: "+1.5% Rate",
    color: "text-slate-500 border-slate-200 bg-slate-50",
    bgColor: "bg-slate-100",
    accentColor: "#64748B",
    description: "Konsistensi penjualan mulai terbentuk dengan support jalur cepat.",
  },
  {
    name: "Gold Agent",
    target: 600000000, // 600 Juta
    reward: "Extra Komisi 2.0% + Undangan Product Launching",
    commissionBonus: "+2% Rate",
    color: "text-yellow-600 border-yellow-200 bg-yellow-50",
    bgColor: "bg-yellow-100",
    accentColor: "#CA8A04",
    description: "Agent andalan dengan akses eksklusif perilisan produk baru GMT.",
  },
  {
    name: "Platinum Agent",
    target: 900000000, // 900 Juta
    reward: "Extra Komisi 2.5% + Voucher Training Tahunan",
    commissionBonus: "+2.5% Rate",
    color: "text-teal-600 border-teal-200 bg-teal-50",
    bgColor: "bg-teal-100",
    accentColor: "#0D9488",
    description: "Leader komunitas Agent dengan beasiswa program training GMT.",
  },
  {
    name: "Elite Diamond Agent",
    target: 1200000000, //
    reward: "Extra Komisi 3.0% + Trip Liburan Tahunan ke Bali (Full Akomodasi)",
    commissionBonus: "+3% Rate",
    color: "text-blue-600 border-blue-200 bg-blue-50",
    bgColor: "bg-blue-100",
    accentColor: "#2563EB",
    description: "Puncak prestasi tertinggi dengan trip apresiasi eksklusif ke Bali.",
  },
];

const ANNUAL_TARGET = 1200000000; // 1.2 Miliar
const MONTHLY_TARGET = ANNUAL_TARGET / 12; // 100 Juta per bulan

const formatCurrency = (value: number) => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2).replace(/\.00$/, "")} Miliar`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)} Juta`;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCurrencyFull = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
};

export function AgentAchievement() {
  const [preorders, setPreorders] = useState<PreorderDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadPreorders = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      // Ambil seluruh PO yang dilakukan agent
      const response = await api.agentPreorders();
      setPreorders(Array.isArray(response.preorders) ? response.preorders : []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat histori penjualan agent.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPreorders();
  }, []);

  // Listen to realtime preorder updates via SSE
  useEffect(() => {
    const disconnect = connectAgentPreorderStream({
      onPreorderUpdated: (updatedPO) => {
        setPreorders((prevPreorders) => {
          const exists = prevPreorders.some((po) => po.id === updatedPO.id);
          if (exists) {
            // Update existing PO in state
            return prevPreorders.map((po) =>
              po.id === updatedPO.id ? { ...po, ...updatedPO } : po
            );
          }
          // If the PO doesn't exist in our state yet, reload everything to get the full detail
          void loadPreorders();
          return prevPreorders;
        });
      },
      onError: (err) => {
        console.error("Agent preorder SSE error:", err);
      },
    });

    return () => {
      disconnect();
    };
  }, []);

  // Filter PO yang disetujui / paid
  const approvedPreorders = useMemo(() => {
    return preorders.filter(
      (po) => po.status === "approve" || po.payment_status === "paid"
    );
  }, [preorders]);

  // Total Real Penjualan Agent
  const realSalesTotal = useMemo(() => {
    return approvedPreorders.reduce((total, po) => total + (po.total || 0), 0);
  }, [approvedPreorders]);

  // Penjualan Aktif yang Digunakan (Real)
  const currentSales = useMemo(() => {
    return realSalesTotal;
  }, [realSalesTotal]);

  // Persentase pencapaian dari Target Tahunan (1.2 Miliar)
  const totalPercentage = useMemo(() => {
    return Math.min(100, Math.max(0, (currentSales / ANNUAL_TARGET) * 100));
  }, [currentSales]);

  // Cari Tier Aktif Saat Ini
  const currentTier = useMemo(() => {
    const sortedTiers = [...ACHIEVEMENT_TIERS].reverse();
    const achieved = sortedTiers.find((tier) => currentSales >= tier.target);
    return achieved || null;
  }, [currentSales]);

  // Cari Tier Berikutnya
  const nextTier = useMemo(() => {
    return ACHIEVEMENT_TIERS.find((tier) => currentSales < tier.target) || null;
  }, [currentSales]);

  // Hitung sisa untuk mencapai target berikutnya atau target utama
  const remainingToNextTier = useMemo(() => {
    if (nextTier) {
      return nextTier.target - currentSales;
    }
    return 0;
  }, [currentSales, nextTier]);

  // Kelompokkan data bulanan untuk grafik
  const monthlyChartData = useMemo(() => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];

    // Inisialisasi actual value per bulan
    const monthlyValues = new Array(12).fill(0);

    approvedPreorders.forEach((po) => {
      if (po.created_at) {
        const date = new Date(po.created_at);
        const monthIndex = date.getMonth();
        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyValues[monthIndex] += po.total || 0;
        }
      }
    });

    return months.map((month, index) => {
      const actual = monthlyValues[index];
      return {
        name: month,
        "Target Sales": MONTHLY_TARGET,
        "Realisasi Penjualan": actual,
        // Status apakah mencapai target bulanan
        isTargetMet: actual >= MONTHLY_TARGET,
      };
    });
  }, [approvedPreorders]);

  // Hitung jumlah bulan yang memenuhi target bulanan (100 Juta)
  const targetMetMonthsCount = useMemo(() => {
    return monthlyChartData.filter(d => d["Realisasi Penjualan"] >= MONTHLY_TARGET).length;
  }, [monthlyChartData]);


  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">GMT Achievement Program</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Pencapaian Agent Tahunan</h1>

        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {errorMessage}
        </div>
      )}

      {/* QUICK STATS CARD GRID */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-medium text-slate-500 line-clamp-1 mr-2">Total Penjualan Anda</p>
            <div className="rounded-lg bg-teal-50 p-1.5 sm:p-2 text-[#0F766E] shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <p className="mt-2 text-base sm:text-2xl font-bold text-slate-950 truncate">{formatCurrencyFull(currentSales)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs">
            <span className="rounded bg-teal-50 px-1.5 sm:px-2 py-0.5 font-semibold text-teal-700">Real Data PO</span>
            <span className="text-slate-500 hidden sm:inline">Tahun berjalan</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-medium text-slate-500 line-clamp-1 mr-2">Target Tahunan Agent</p>
            <div className="rounded-lg bg-blue-50 p-1.5 sm:p-2 text-blue-600 shrink-0">
              <Target className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <p className="mt-2 text-base sm:text-2xl font-bold text-slate-950 truncate">{formatCurrencyFull(ANNUAL_TARGET)}</p>
          <div className="mt-3 text-[10px] sm:text-xs text-slate-500 line-clamp-2">
            Ditargetkan selesai dalam 12 bulan
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-medium text-slate-500 line-clamp-1 mr-2">Persentase Pencapaian</p>
            <div className="rounded-lg bg-yellow-50 p-1.5 sm:p-2 text-yellow-600 shrink-0">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <p className="mt-2 text-base sm:text-2xl font-bold text-slate-950">{totalPercentage.toFixed(1)}%</p>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
            <div className="h-1.5 w-full sm:w-24 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-yellow-500" style={{ width: `${totalPercentage}%` }} />
            </div>
            <span className="text-slate-500 font-semibold">{totalPercentage >= 10 ? "Hebat!" : "Ayo kejar!"}</span>
          </div>
        </div>
      </div>

      {/* DETAILED PROGRESS & BADGES SECTION */}
      <section className="grid grid-cols-1 gap-6">
        {/* PROGRESS BAR & GOAL CARD */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Progres Milestone Penjualan</h2>
                <p className="mt-1 text-sm text-slate-500">Visualisasi bar progres menuju target 1.2 Miliar tahun ini.</p>
              </div>
              {currentSales >= 120000000 && (
                <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200 animate-pulse">
                  <Flame className="h-4 w-4 animate-bounce" />
                  On Fire
                </div>
              )}
            </div>

            {/* DYNAMIC PROGRESS BAR CHART */}
            <div className="mt-8 space-y-6">
              <div className="relative">
                {/* Milestone Tick Marks */}
                <div className="absolute -top-7 left-0 w-full flex justify-between text-[9px] sm:text-[10px] font-bold text-slate-400">
                  <span className="opacity-0 sm:opacity-100">0</span>
                  <span className="absolute" style={{ left: "8.3%" }}>100<span className="hidden sm:inline">JT</span></span>
                  <span className="absolute hidden sm:block" style={{ left: "25%" }}>300JT</span>
                  <span className="absolute" style={{ left: "50%" }}>600<span className="hidden sm:inline">JT</span></span>
                  <span className="absolute hidden sm:block" style={{ left: "75%" }}>900JT</span>
                  <span className="absolute right-0">1.2M<span className="hidden md:inline"> (GOLDEN TARGET)</span></span>
                </div>

                {/* Main Progress Bar Wrapper */}
                <div className="h-8 w-full rounded-2xl bg-slate-100 p-1.5 shadow-inner border border-slate-200 relative overflow-hidden">
                  {/* Glowing active bar */}
                  <div
                    className="h-full rounded-xl bg-gradient-to-r from-teal-500 via-[#0F766E] to-blue-600 shadow-md transition-all duration-500 ease-out flex items-center justify-end pr-3 min-w-[24px]"
                    style={{ width: `${totalPercentage}%` }}
                  >
                    {totalPercentage > 5 && (
                      <span className="text-[10px] font-extrabold text-white text-shadow-sm select-none">
                        {totalPercentage.toFixed(0)}%
                      </span>
                    )}
                  </div>

                  {/* Marker Lines */}
                  <div className="absolute inset-y-0 left-[8.3%] w-[2px] bg-slate-300 pointer-events-none" />
                  <div className="absolute inset-y-0 left-[25%] w-[2px] bg-slate-300 pointer-events-none" />
                  <div className="absolute inset-y-0 left-[50%] w-[2px] bg-slate-300 pointer-events-none" />
                  <div className="absolute inset-y-0 left-[75%] w-[2px] bg-slate-300 pointer-events-none" />
                </div>

                {/* Milestones Label bottom */}
                <div className="mt-2 w-full flex justify-between text-[8px] sm:text-[9px] text-slate-400 select-none">
                  <span className="opacity-0 sm:opacity-100">Start</span>
                  <span className="absolute" style={{ left: "7%" }}>Bronze<span className="hidden sm:inline"> Tier</span></span>
                  <span className="absolute hidden sm:block" style={{ left: "23.5%" }}>Silver Tier</span>
                  <span className="absolute" style={{ left: "48.5%" }}>Gold<span className="hidden sm:inline"> Tier</span></span>
                  <span className="absolute hidden sm:block" style={{ left: "73.5%" }}>Platinum Tier</span>
                  <span className="font-semibold text-[#0F766E]">Trip Bali</span>
                </div>
              </div>
            </div>

            {/* Next Tier Message Box */}
            <div className="mt-8 rounded-xl border border-teal-100 bg-teal-50/50 p-4">
              <div className="flex gap-3">
                <div className="rounded-lg bg-teal-50 p-2 text-[#0F766E] shrink-0 self-start">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {nextTier ? `Sisa target Anda ke ${nextTier.name}:` : "Luar Biasa! Target Terpenuhi!"}
                  </h4>
                  <p className="mt-1 text-lg font-bold text-[#0F766E]">
                    {nextTier ? formatCurrencyFull(remainingToNextTier) : "Anda telah menaklukkan target tertinggi Agent!"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {nextTier
                      ? `Raih tier ini untuk membuka reward: ${nextTier.reward}`
                      : "Semua reward bonus dan trip liburan Bali eksklusif telah berhasil Anda kunci!"
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-5 gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="h-4 w-4" />
              <span>Periode program: 1 Jan 2026 - 31 Des 2026</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F766E]">
              <span>Lihat Syarat & Ketentuan Agent</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* MONTHLY PROJECTION GRAPH (BAR CHART) */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Grafik Penjualan Bulanan</h2>
            <p className="mt-1 text-sm text-slate-500">
              Grafik batang perbandingan penjualan bulanan Anda terhadap rata-rata target bulanan ({formatCurrency(MONTHLY_TARGET)} / bulan).
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-slate-200 border border-slate-300" />
              <span className="text-slate-600">Target Bulanan (100JT)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-[#0F766E]" />
              <span className="text-slate-600">Realisasi Penjualan Anda</span>
            </div>
          </div>
        </div>

        {/* RECHARTS BAR CHART */}
        <div className="h-80 w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "#64748B", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={75}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                contentStyle={{ borderRadius: 10, borderColor: "#E2E8F0" }}
                formatter={(value: any, name: string) => [
                  formatCurrencyFull(Number(value)),
                  name,
                ]}
              />
              <Bar dataKey="Target Sales" fill="#E2E8F0" radius={[4, 4, 0, 0]} opacity={0.6} />
              <Bar dataKey="Realisasi Penjualan" fill="#0F766E" radius={[4, 4, 0, 0]}>
                {monthlyChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry["Realisasi Penjualan"] >= MONTHLY_TARGET ? "#0F766E" : "#0EA5E9"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>Target Bulanan konsisten membantu pencapaian akhir tahun.</span>
          <span className="font-semibold text-slate-700">
            Jumlah bulan lolos target: {targetMetMonthsCount} dari 12 bulan
          </span>
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Histori Penjualan Berkontribusi</h2>
        <p className="mt-1 text-sm text-slate-500">Daftar Preorder Anda yang disetujui dan terhitung dalam persentase progres di atas.</p>

        {isLoading ? (
          <div className="mt-4 p-8 text-center text-sm text-slate-500">Memuat histori PO...</div>
        ) : approvedPreorders.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4">PO Number</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Tanggal Approve</th>
                  <th className="pb-3 pr-4 text-right">Nilai Transaksi</th>
                  <th className="pb-3 pr-4 text-right">Komisi Didapat</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {approvedPreorders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50">
                    <td className="py-3 pr-4 font-semibold text-slate-900">{po.po_number || `PO-${po.id}`}</td>
                    <td className="py-3 pr-4">{po.nama_customer}</td>
                    <td className="py-3 pr-4">
                      {po.created_at ? new Date(po.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }) : "-"}
                    </td>
                    <td className="py-3 pr-4 text-right font-semibold text-slate-950">
                      {formatCurrencyFull(po.total || 0)}
                    </td>
                    <td className="py-3 pr-4 text-right text-emerald-600 font-semibold">
                      {formatCurrencyFull(po.total_komisi || 0)}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        {po.payment_status === "paid" ? "Paid" : "Approved"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 border border-dashed border-slate-300 rounded-lg p-8 bg-slate-50 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-900">Belum Ada Penjualan Real yang Disetujui</p>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              Penjualan real Anda dari menu **Purchase Order** akan terhitung otomatis di halaman ini setelah disetujui oleh pihak GMT Suites.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
