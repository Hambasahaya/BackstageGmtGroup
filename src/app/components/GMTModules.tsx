import {
  BarChart3,
  Bot,
  Brain,
  CalendarCheck,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Globe2,
  GitCompare,
  Image,
  Instagram,
  Link2,
  Mail,
  Megaphone,
  PenLine,
  Plus,
  Plug,
  QrCode,
  Route,
  Search,
  Sparkles,
  Smartphone,
  Target,
  TrendingUp,
  Upload,
  Users,
  CheckCheck,
  CheckCircle,
  X,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState, type ElementType, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchInstagramInsights,
  fetchCompetitorBenchmark,
  fetchMetaAccounts,
  fetchMetaAuthUrl,
  generateReferenceBrief,
  autoPostInstagramContent,
  fetchContentBriefCache,
  saveContentBriefCache,
  deleteContentBriefCache,
  generateContentFromBrief,
  type CompetitorBenchmark,
  type InstagramInsights,
  type MetaAccountHealth,
} from "../services/metaIntegrations";
import { apiRequest } from "../services/api";
import { fetchKeywordResearch, type KeywordResearchResponse } from "../services/seoIntegrations";
import { fetchWebsiteAnalytics, type WebsiteAnalyticsResponse } from "../services/websiteAnalytics";
import { KeywordRankCompetitorCard } from "./KeywordRankCompetitorCard";
import {
  isSocialAgentConfigured,
  syncAndFetchSocialAgent,
  type SocialAgentBundle,
} from "../services/socialMediaAgent";

type StatusTone = "green" | "yellow" | "red" | "blue" | "slate" | "teal";

const toneClasses: Record<StatusTone, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  yellow: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
};

function LoadingVideoOverlay({ visible, text }: { visible: boolean; text: string }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="flex w-full max-w-[280px] flex-col items-center gap-4 rounded-xl border border-white/30 bg-white/95 p-5 text-center shadow-2xl">
        <video
          src="/imgloading/4067125821-preview.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="h-28 w-28 rounded-lg object-cover"
        />
        <p className="text-sm font-semibold text-slate-900">{text}</p>
      </div>
    </div>
  );
}

function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: string;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">GMT Group Central Dashboard</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p>
      </div>
      {action && (
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59]">
          <Plus className="h-4 w-4" />
          {action}
        </button>
      )}
    </div>
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

function StatusBadge({ children, tone = "slate" }: { children: string; tone?: StatusTone }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

function ModuleShell({
  title,
  description,
  action,
  stats,
  toolbar,
  children,
}: {
  title: string;
  description: string;
  action?: string;
  stats: Array<{ label: string; value: string; detail: string }>;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} action={action} />
      {toolbar}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      {children}
    </div>
  );
}

function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<ReactNode>>;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-600">
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-slate-100 text-sm last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 align-middle text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeatureGrid({ features }: { features: Array<{ icon: ElementType; title: string; text: string }> }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {features.map((feature) => {
        const Icon = feature.icon;

        return (
          <div key={feature.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-[#0F766E]">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-950">{feature.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{feature.text}</p>
          </div>
        );
      })}
    </div>
  );
}

export function ModelKnowledgeBaseManagement() {
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [selectedModel, setSelectedModel] = useState("growthStrategist");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiRequest<{ data?: Record<string, string>; success?: boolean }>("/api/super-admin/knowledge-base", {
          method: "GET",
        });
        if (response?.data && typeof response.data === "object") {
          setEntries(response.data as Record<string, string>);
        }
      } catch {
        // Fallback: try loading from localStorage if backend is unreachable.
        const stored = localStorage.getItem("modelKnowledgeBase");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === "object") {
              setEntries(parsed);
            }
          } catch {
            setEntries({});
          }
        }
      }
    };

    void load();
  }, []);

  const models = [
    { value: "growthStrategist", label: "Growth Strategist" },
    { value: "marketingSpecialist", label: "Marketing Specialist" },
    { value: "conversionCommunityLead", label: "Conversion & Community Lead" },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await apiRequest<{ data?: Record<string, string>; success?: boolean }>("/api/super-admin/knowledge-base", {
        method: "POST",
        body: JSON.stringify(entries),
      });
      localStorage.setItem("modelKnowledgeBase", JSON.stringify(entries));
      setMessage(response?.success ? "Knowledge base berhasil disimpan ke database dan siap dipakai oleh prompt content brief." : "Gagal menyimpan ke database. Data tersimpan sementara di browser.");
    } catch {
      localStorage.setItem("modelKnowledgeBase", JSON.stringify(entries));
      setMessage("Gagal menyimpan ke server. Data tersimpan sementara di browser saja.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (modelKey: string, value: string) => {
    setEntries((prev) => ({ ...prev, [modelKey]: value }));
  };

  return (
    <ModuleShell
      title="Model Knowledge Base"
      description="Atur pengetahuan khusus per model agar AI content brief lebih konsisten dan strategis."
      stats={[
        { label: "Model Tersedia", value: String(models.length), detail: "Growth, Marketing, Community" },
        { label: "Entry Tersimpan", value: String(Object.keys(entries).length), detail: "Di browser lokal" },
        { label: "Status", value: isSaving ? "Menyimpan" : "Siap", detail: "Pembaruan langsung" },
      ]}
      toolbar={
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <label className="text-sm font-semibold text-slate-700">Pilih model</label>
          <select
            value={selectedModel}
            onChange={(event) => setSelectedModel(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {models.map((model) => (
              <option key={model.value} value={model.value}>{model.label}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59]"
          >
            {isSaving ? "Menyimpan..." : "Simpan Knowledge Base"}
          </button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Editor Knowledge Base</h2>
              <p className="text-sm text-slate-500">Tuliskan instruksi khusus yang ingin dipakai model saat menghasilkan content brief.</p>
            </div>
            <StatusBadge tone="teal">{models.find((m) => m.value === selectedModel)?.label}</StatusBadge>
          </div>
          <textarea
            value={entries[selectedModel] || ""}
            onChange={(event) => handleChange(selectedModel, event.target.value)}
            rows={16}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none ring-0"
            placeholder="Contoh: Fokus pada edukasi, CTA pada DM, gunakan bahasa yang santai untuk audience Gen Z..."
          />
          {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Tips Penggunaan</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-500">
              <li>• Masukkan insight brand, tone, atau aturan khusus per model.</li>
              <li>• Gunakan kalimat singkat dan actionable untuk hasil yang konsisten.</li>
              <li>• Simpan setelah setiap perubahan agar prompt dapat menggunakannya.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Model yang Bisa Diatur</h3>
            <div className="mt-3 space-y-2">
              {models.map((model) => (
                <div key={model.value} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">{model.label}</p>
                  <p className="mt-1 text-xs text-slate-500">Kunci: {model.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ElementType;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#0F766E]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {children}
    </section>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function MiniBarList({
  items,
  color = "bg-[#0F766E]",
  maxItems = 4,
}: {
  items: Array<{ label: string; value: number }>;
  color?: string;
  maxItems?: number;
}) {
  const visibleItems = items.slice(0, maxItems);
  const maxValue = Math.max(...visibleItems.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {visibleItems.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-semibold text-slate-700">{item.label}</span>
            <span className="shrink-0 font-bold text-slate-950">{formatNumber(item.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${Math.max(8, (item.value / maxValue) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
      {text}
    </div>
  );
}

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("id-ID").format(Math.round(value));
};

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${Math.round(value * 1000) / 10}%`;
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (value && typeof value === "object" && "value" in value) {
    return toNumber((value as { value?: unknown }).value);
  }
  if (value && typeof value === "object") {
    const values = Object.values(value).map(toNumber).filter((item): item is number => item !== undefined);
    return values.length ? values.reduce((total, item) => total + item, 0) : undefined;
  }
  return undefined;
};

const sumNumbers = (values: Array<number | undefined>) => {
  const available = values.filter((value): value is number => value !== undefined);
  return available.length ? available.reduce((total, value) => total + value, 0) : undefined;
};

const getFollowerDeltaValue = (value: unknown): number | undefined => {
  const numericValue = toNumber(value);
  if (typeof value !== "object" || value === null) return numericValue;

  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length) return numericValue;

  let hasFollowSignal = false;
  let total = 0;
  for (const [key, entryValue] of entries) {
    const entryNumber = toNumber(entryValue);
    if (entryNumber === undefined) continue;
    const normalizedKey = key.toLowerCase();
    if (normalizedKey.includes("unfollow")) {
      hasFollowSignal = true;
      total -= entryNumber;
    } else if (normalizedKey.includes("follow")) {
      hasFollowSignal = true;
      total += entryNumber;
    }
  }

  return hasFollowSignal ? total : numericValue;
};

const formatRankedValue = (items: Array<{ label: string; value: number }> | undefined, fallback = "-") => {
  const top = items?.find((item) => item.label);
  return top ? `${top.label} (${formatNumber(top.value)})` : fallback;
};

const formatRankedList = (items: Array<{ label: string; value: number }> | undefined, limit = 3) =>
  items?.slice(0, limit).map((item) => `${item.label} (${formatNumber(item.value)})`).join(", ") || "-";

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultInstagramDateRange = () => {
  const until = new Date();
  const since = new Date(until);
  since.setDate(since.getDate() - 29);
  return { since: formatDateInput(since), until: formatDateInput(until) };
};

const calculateCorrelation = (points: Array<{ x: number; y: number }>) => {
  if (points.length < 3) return undefined;

  const xAverage = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const yAverage = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const numerator = points.reduce((sum, point) => sum + ((point.x - xAverage) * (point.y - yAverage)), 0);
  const xSpread = Math.sqrt(points.reduce((sum, point) => sum + ((point.x - xAverage) ** 2), 0));
  const ySpread = Math.sqrt(points.reduce((sum, point) => sum + ((point.y - yAverage) ** 2), 0));

  return xSpread && ySpread ? numerator / (xSpread * ySpread) : undefined;
};

const formatCurrencyRange = (low: number | null, high: number | null) => {
  if (low === null && high === null) {
    return "-";
  }

  const formatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  if (low !== null && high !== null) {
    return `${formatter.format(low)} - ${formatter.format(high)}`;
  }

  return formatter.format(low ?? high ?? 0);
};

const getCompetitionTone = (competition: string | null): StatusTone => {
  if (competition === "HIGH") {
    return "red";
  }

  if (competition === "MEDIUM") {
    return "yellow";
  }

  if (competition === "LOW") {
    return "green";
  }

  return "slate";
};

const getKeywordIntent = (keyword: string) => {
  const normalized = keyword.toLowerCase();

  if (/\b(sewa|rental|harga|jual|paket)\b/.test(normalized)) {
    return "Transactional";
  }

  if (/\b(cara|panduan|tips|jenis|apa|contoh)\b/.test(normalized)) {
    return "Informational";
  }

  return "Commercial";
};

const getOpportunity = (volume: number | null, competitionIndex: number | null, position?: number) => {
  if (position && position > 3 && position <= 20) {
    return "Existing ranking opportunity";
  }

  if ((volume || 0) >= 1000 && (competitionIndex || 0) <= 60) {
    return "High";
  }

  if ((volume || 0) >= 300) {
    return "Medium";
  }

  return "Low";
};

const getDifficulty = (competitionIndex: number | null) => {
  if (competitionIndex === null) {
    return "Unknown";
  }

  if (competitionIndex >= 70) {
    return "High";
  }

  if (competitionIndex >= 35) {
    return "Medium";
  }

  return "Low";
};

export function MultiWebsiteManagement() {
  const [analytics, setAnalytics] = useState<WebsiteAnalyticsResponse | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");
  const [reportDays, setReportDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async (days = reportDays) => {
    setIsLoading(true);
    setError("");
    try {
      setAnalytics(await fetchWebsiteAnalytics(days));
    } catch (loadError) {
      setAnalytics(null);
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat data website.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalytics(30);
  }, []);

  const selectedProperties = (analytics?.properties || []).filter((property) =>
    selectedPropertyId === "all" || property.id === selectedPropertyId);
  const totals = selectedProperties.reduce((summary, property) => ({
    sessions: summary.sessions + property.totals.sessions,
    users: summary.users + property.totals.users,
    newUsers: summary.newUsers + property.totals.newUsers,
    pageviews: summary.pageviews + property.totals.pageviews,
    bounceRateWeighted: summary.bounceRateWeighted + (property.totals.bounceRate * property.totals.sessions),
    engagementRateWeighted: summary.engagementRateWeighted + (property.totals.engagementRate * property.totals.sessions),
    durationWeighted: summary.durationWeighted + (property.totals.averageSessionDuration * property.totals.sessions),
  }), { sessions: 0, users: 0, newUsers: 0, pageviews: 0, bounceRateWeighted: 0, engagementRateWeighted: 0, durationWeighted: 0 });
  const bounceRate = totals.sessions ? totals.bounceRateWeighted / totals.sessions : undefined;
  const engagementRate = totals.sessions ? totals.engagementRateWeighted / totals.sessions : undefined;
  const averageSessionDuration = totals.sessions ? totals.durationWeighted / totals.sessions : undefined;
  const pagesPerSession = totals.sessions ? totals.pageviews / totals.sessions : undefined;
  const returningUsers = selectedProperties.reduce((sum, property) => sum + property.visitorTypes
    .filter((item) => item.type.toLowerCase() === "returning")
    .reduce((typeSum, item) => typeSum + item.users, 0), 0);

  const dailyMap = new Map<string, { date: string; sessions: number; users: number; pageviews: number }>();
  for (const property of selectedProperties) {
    for (const day of property.daily) {
      const current = dailyMap.get(day.date) || { date: day.date, sessions: 0, users: 0, pageviews: 0 };
      current.sessions += day.sessions;
      current.users += day.users;
      current.pageviews += day.pageviews;
      dailyMap.set(day.date, current);
    }
  }
  const dailyData = Array.from(dailyMap.values()).sort((first, second) => first.date.localeCompare(second.date)).map((day) => ({
    ...day,
    label: day.date.length === 8 ? `${day.date.slice(6, 8)}/${day.date.slice(4, 6)}` : day.date,
  }));

  const sourceMap = new Map<string, { channel: string; sourceMedium: string; sessions: number; users: number; engagedSessions: number }>();
  for (const property of selectedProperties) {
    for (const source of property.sources) {
      const key = `${source.channel}|${source.sourceMedium}`;
      const current = sourceMap.get(key) || { ...source, sessions: 0, users: 0, engagedSessions: 0 };
      current.sessions += source.sessions;
      current.users += source.users;
      current.engagedSessions += source.engagedSessions;
      sourceMap.set(key, current);
    }
  }
  const sourceData = Array.from(sourceMap.values()).sort((first, second) => second.sessions - first.sessions);
  const pageData = selectedProperties.flatMap((property) => property.pages.map((page) => ({ ...page, website: property.domain })))
    .sort((first, second) => second.pageviews - first.pageviews)
    .slice(0, 25);
  const keywordData = selectedProperties.flatMap((property) => (property.keywordPerformance || []).map((keyword) => ({ ...keyword, website: property.domain })))
    .sort((first, second) => first.position - second.position || second.clicks - first.clicks || second.impressions - first.impressions)
    .slice(0, 25);
  const allKeywordData = selectedProperties.flatMap((property) => (property.keywordPerformance || []).map((keyword) => ({ ...keyword, website: property.domain })));
  const keywordTotals = allKeywordData.reduce((summary, keyword) => ({
    clicks: summary.clicks + keyword.clicks,
    impressions: summary.impressions + keyword.impressions,
    weightedPosition: summary.weightedPosition + (keyword.position * Math.max(keyword.impressions, 1)),
    positionWeight: summary.positionWeight + Math.max(keyword.impressions, 1),
  }), { clicks: 0, impressions: 0, weightedPosition: 0, positionWeight: 0 });
  const keywordAveragePosition = keywordTotals.positionWeight ? keywordTotals.weightedPosition / keywordTotals.positionWeight : undefined;
  const keywordCtr = keywordTotals.impressions ? keywordTotals.clicks / keywordTotals.impressions : undefined;
  const topKeyword = allKeywordData.length ? [...allKeywordData].sort((first, second) => second.clicks - first.clicks || first.position - second.position)[0] : undefined;
  const keywordPositionData = [
    { bucket: "Top 1-3", keywords: allKeywordData.filter((keyword) => keyword.position <= 3).length, fill: "#0F766E" },
    { bucket: "Top 4-10", keywords: allKeywordData.filter((keyword) => keyword.position > 3 && keyword.position <= 10).length, fill: "#2563EB" },
    { bucket: "Top 11-20", keywords: allKeywordData.filter((keyword) => keyword.position > 10 && keyword.position <= 20).length, fill: "#DB2777" },
    { bucket: "Top 20+", keywords: allKeywordData.filter((keyword) => keyword.position > 20).length, fill: "#F59E0B" },
  ].filter((bucket) => bucket.keywords > 0);
  const keywordPageMap = new Map<string, { page: string; website: string; clicks: number; impressions: number; keywords: Set<string>; bestPosition: number }>();
  for (const keyword of allKeywordData) {
    const key = `${keyword.website}|${keyword.page}`;
    const current = keywordPageMap.get(key) || { page: keyword.page, website: keyword.website, clicks: 0, impressions: 0, keywords: new Set<string>(), bestPosition: Number.POSITIVE_INFINITY };
    current.clicks += keyword.clicks;
    current.impressions += keyword.impressions;
    current.keywords.add(keyword.keyword);
    current.bestPosition = Math.min(current.bestPosition, keyword.position);
    keywordPageMap.set(key, current);
  }
  const keywordPageData = Array.from(keywordPageMap.values())
    .map((page) => ({ ...page, keywordCount: page.keywords.size }))
    .sort((first, second) => second.clicks - first.clicks || second.impressions - first.impressions)
    .slice(0, 8);
  const keywordOpportunityData = allKeywordData
    .filter((keyword) => keyword.position > 3 && keyword.position <= 20 && keyword.impressions > 0)
    .sort((first, second) => second.impressions - first.impressions || first.position - second.position)
    .slice(0, 8);
  const formatDuration = (seconds: number | undefined) => {
    if (seconds === undefined) return "-";
    const rounded = Math.round(seconds);
    return `${Math.floor(rounded / 60)}m ${rounded % 60}s`;
  };

  return (
    <ModuleShell
      title="Website Analytics"
      description="Pantau traffic dan perilaku pengunjung dari seluruh property GA4 dalam satu dashboard multi-website."
      toolbar={
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-2xl">
              <label className="text-sm font-semibold text-slate-700">Website
                <select value={selectedPropertyId} onChange={(event) => setSelectedPropertyId(event.target.value)} disabled={isLoading} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100">
                  <option value="all">Semua website ({analytics?.properties.length || 0})</option>
                  {analytics?.properties.map((property) => <option key={property.id} value={property.id}>{property.domain}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">Periode
                <select value={reportDays} onChange={(event) => { const days = Number(event.target.value); setReportDays(days); void loadAnalytics(days); }} disabled={isLoading} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100">
                  <option value={7}>7 hari terakhir</option><option value={30}>30 hari terakhir</option><option value={90}>90 hari terakhir</option>
                </select>
              </label>
            </div>
            <button onClick={() => void loadAnalytics()} disabled={isLoading} className="rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#115E59] disabled:bg-slate-400">{isLoading ? "Memuat GA4..." : "Refresh data"}</button>
          </div>
        </section>
      }
      stats={[
        { label: "Sessions", value: analytics ? formatNumber(totals.sessions) : "-", detail: `${selectedProperties.length} website dipilih` },
        { label: "Users", value: analytics ? formatNumber(totals.users) : "-", detail: "Unique visitors GA4" },
        { label: "Pageviews", value: analytics ? formatNumber(totals.pageviews) : "-", detail: "Total tampilan halaman" },
        { label: "Engagement rate", value: formatPercent(engagementRate), detail: "Engaged sessions / sessions" },
      ]}
    >
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">{error}</div>}
      {analytics?.warnings?.length ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{analytics.warnings.join(" | ")}</div> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New users" value={analytics ? formatNumber(totals.newUsers) : "-"} detail="Pengunjung baru dalam periode" />
        <StatCard label="Returning users" value={analytics ? formatNumber(returningUsers) : "-"} detail="Pengunjung yang kembali" />
        <StatCard label="Bounce rate" value={formatPercent(bounceRate)} detail="Sesi yang tidak engaged" />
        <StatCard label="Avg. session duration" value={formatDuration(averageSessionDuration)} detail={`${pagesPerSession === undefined ? "-" : pagesPerSession.toFixed(2)} halaman per sesi`} />
      </div>

      <SectionCard icon={TrendingUp} title="Traffic Trend" description={`Sessions, users, dan pageviews ${analytics ? `${analytics.startDate} sampai ${analytics.endDate}` : "dari GA4"}.`}>
        {dailyData.length ? <div className="h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={dailyData}><CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" /><XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} /><YAxis tick={{ fill: "#64748B", fontSize: 12 }} /><Tooltip /><Legend /><Area type="monotone" dataKey="sessions" name="Sessions" stroke="#0F766E" fill="#CCFBF1" strokeWidth={3} /><Area type="monotone" dataKey="users" name="Users" stroke="#2563EB" fill="#DBEAFE" strokeWidth={2} /><Area type="monotone" dataKey="pageviews" name="Pageviews" stroke="#DB2777" fill="#FCE7F3" strokeWidth={2} /></AreaChart></ResponsiveContainer></div> : <EmptyState text={isLoading ? "Sedang memuat tren GA4..." : "Belum ada data tren untuk periode ini."} />}
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard icon={BarChart3} title="Traffic Source / Medium" description="Organic, social, direct, referral, paid, dan sumber akuisisi lainnya.">
          {sourceData.length ? <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={sourceData.slice(0, 8)} layout="vertical" margin={{ left: 16 }}><CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} /><XAxis type="number" /><YAxis dataKey="channel" type="category" width={100} tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="sessions" name="Sessions" fill="#0F766E" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div> : <EmptyState text="Belum ada data acquisition." />}
        </SectionCard>
        <SectionCard icon={Users} title="New vs Returning Users" description="Komposisi pengunjung baru dan pengunjung yang kembali.">
          <div className="grid grid-cols-2 gap-3"><MetricPill label="New users" value={formatNumber(totals.newUsers)} /><MetricPill label="Returning users" value={formatNumber(returningUsers)} /></div>
          <div className="mt-5"><DataTable columns={["Channel", "Source / Medium", "Sessions", "Users", "Engaged"]} rows={sourceData.slice(0, 8).map((source) => [source.channel, source.sourceMedium, formatNumber(source.sessions), formatNumber(source.users), formatNumber(source.engagedSessions)])} /></div>
        </SectionCard>
      </div>

      <SectionCard icon={FileText} title="Page Performance" description="Pageviews, users, engagement rate, dan durasi rata-rata per halaman.">
        {pageData.length ? <DataTable columns={["Website", "Page", "Title", "Pageviews", "Users", "Engagement", "Avg. duration"]} rows={pageData.map((page) => [page.website, page.path, <span className="line-clamp-2 max-w-xs">{page.title}</span>, formatNumber(page.pageviews), formatNumber(page.users), formatPercent(page.engagementRate), formatDuration(page.averageSessionDuration)])} /> : <EmptyState text="Belum ada data halaman." />}
      </SectionCard>

      <KeywordRankCompetitorCard availableWebsites={(analytics?.properties || []).map((p) => ({ domain: p.domain, url: `https://${p.domain}/` }))} />

      <SectionCard icon={Search} title="Keyword Performance" description="Keyword organik dari Search Console, lengkap dengan ranking, halaman tujuan, clicks/views, impressions, CTR, dan peluang optimasi.">
        {allKeywordData.length ? <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <MetricPill label="Tracked keywords" value={formatNumber(allKeywordData.length)} />
            <MetricPill label="Total clicks/views" value={formatNumber(keywordTotals.clicks)} />
            <MetricPill label="Total impressions" value={formatNumber(keywordTotals.impressions)} />
            <MetricPill label="Avg. CTR" value={formatPercent(keywordCtr)} />
            <MetricPill label="Avg. position" value={keywordAveragePosition === undefined ? "-" : `#${keywordAveragePosition.toFixed(1)}`} />
          </div>

          {topKeyword && (
            <div className="rounded-lg border border-teal-100 bg-teal-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0F766E]">Top traffic keyword</p>
              <div className="mt-2 grid gap-3 lg:grid-cols-[1.2fr_2fr] lg:items-center">
                <div>
                  <p className="text-xl font-bold text-slate-950">{topKeyword.keyword}</p>
                  <p className="mt-1 text-sm text-slate-600">{topKeyword.website} • posisi #{topKeyword.position.toFixed(1)}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <MetricPill label="Clicks/views" value={formatNumber(topKeyword.clicks)} />
                  <MetricPill label="Impressions" value={formatNumber(topKeyword.impressions)} />
                  <MetricPill label="CTR" value={formatPercent(topKeyword.ctr)} />
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-600">{topKeyword.page}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Ranking Distribution</h3>
              {keywordPositionData.length ? <div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={keywordPositionData} dataKey="keywords" nameKey="bucket" innerRadius={58} outerRadius={95} paddingAngle={3}>{keywordPositionData.map((entry) => <Cell key={entry.bucket} fill={entry.fill} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div> : <EmptyState text="Belum ada distribusi ranking." />}
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Top SEO Landing Pages</h3>
              {keywordPageData.length ? <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={keywordPageData} layout="vertical" margin={{ left: 18 }}><CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} /><XAxis type="number" /><YAxis dataKey="page" type="category" width={120} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="clicks" name="Clicks / views" fill="#0F766E" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div> : <EmptyState text="Belum ada landing page SEO." />}
            </div>
          </div>

          <DataTable columns={["Rank", "Keyword", "Page", "Website", "Clicks / Views", "Impressions", "CTR", "Avg. position"]} rows={keywordData.map((keyword, index) => [
            <StatusBadge tone={index === 0 ? "green" : index < 3 ? "teal" : "blue"}>{`Top ${index + 1}`}</StatusBadge>,
            <span className="font-semibold text-slate-900">{keyword.keyword}</span>,
            <span className="line-clamp-2 max-w-sm">{keyword.page}</span>,
            keyword.website,
            formatNumber(keyword.clicks),
            formatNumber(keyword.impressions),
            formatPercent(keyword.ctr),
            `#${keyword.position.toFixed(1)}`,
          ])} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Page Keyword Summary</h3>
              <DataTable columns={["Page", "Website", "Keywords", "Clicks", "Impressions", "Best position"]} rows={keywordPageData.map((page) => [
                <span className="line-clamp-2 max-w-sm">{page.page}</span>,
                page.website,
                formatNumber(page.keywordCount),
                formatNumber(page.clicks),
                formatNumber(page.impressions),
                page.bestPosition === Number.POSITIVE_INFINITY ? "-" : `#${page.bestPosition.toFixed(1)}`,
              ])} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Optimization Opportunities</h3>
              {keywordOpportunityData.length ? <DataTable columns={["Keyword", "Page", "Impressions", "Clicks", "Position"]} rows={keywordOpportunityData.map((keyword) => [
                <span className="font-semibold text-slate-900">{keyword.keyword}</span>,
                <span className="line-clamp-2 max-w-xs">{keyword.page}</span>,
                formatNumber(keyword.impressions),
                formatNumber(keyword.clicks),
                `#${keyword.position.toFixed(1)}`,
              ])} /> : <EmptyState text="Belum ada keyword posisi 4-20 yang bisa diprioritaskan." />}
            </div>
          </div>
        </div> : <EmptyState text={isLoading ? "Sedang memuat keyword dari Search Console..." : "Belum ada data keyword. Pastikan GSC_SITE_URL atau gscSiteUrl di GA4_PROPERTIES sudah punya akses Search Console."} />}
      </SectionCard>

      <SectionCard icon={Globe2} title="Website Portfolio" description="Perbandingan performa seluruh property GA4 yang terhubung.">
        {analytics?.properties.length ? <DataTable columns={["Website", "Sessions", "Users", "Pageviews", "Engagement", "Bounce rate", "Pages/session"]} rows={analytics.properties.map((property) => [property.domain, formatNumber(property.totals.sessions), formatNumber(property.totals.users), formatNumber(property.totals.pageviews), formatPercent(property.totals.engagementRate), formatPercent(property.totals.bounceRate), property.totals.pagesPerSession.toFixed(2)])} /> : <EmptyState text="Belum ada property GA4 yang berhasil dimuat." />}
      </SectionCard>
    </ModuleShell>
  );
}

export function SeoManagement() {
  const [keywordsInput, setKeywordsInput] = useState("");
  const [gscSiteUrl, setGscSiteUrl] = useState("https://gmtgroup.co.id/");
  const [keywordResearch, setKeywordResearch] = useState<KeywordResearchResponse | null>(null);
  const [isResearchLoading, setIsResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState("");

  const keywordRows = (keywordResearch?.keywords || []).map((item) => [
    item.keyword,
    formatNumber(item.searchVolume),
    formatCurrencyRange(item.cpcLow, item.cpcHigh),
    <StatusBadge tone={getCompetitionTone(item.competition)}>{item.competition || "N/A"}</StatusBadge>,
    item.competitionIndex === null ? "-" : `${item.competitionIndex}/100`,
    item.gsc ? formatNumber(item.gsc.clicks) : "-",
    item.gsc ? formatPercent(item.gsc.ctr) : "-",
    item.gsc?.position ? `#${Math.round(item.gsc.position * 10) / 10}` : "-",
    item.trendPercent === null ? "-" : <StatusBadge tone={item.trendPercent >= 0 ? "green" : "red"}>{`${item.trendPercent > 0 ? "+" : ""}${item.trendPercent}%`}</StatusBadge>,
  ]);

  const handleKeywordResearch = async () => {
    setIsResearchLoading(true);
    setResearchError("");

    try {
      const response = await fetchKeywordResearch({
        keywords: keywordsInput,
        siteUrl: gscSiteUrl,
      });
      setKeywordResearch(response);
    } catch (error) {
      setResearchError(error instanceof Error ? error.message : "Keyword research gagal diproses.");
    } finally {
      setIsResearchLoading(false);
    }
  };

  const analyzerRows = (keywordResearch?.keywords || []).map((item) => {
    const intent = getKeywordIntent(item.keyword);
    const articleLength = item.searchVolume && item.searchVolume >= 1000 ? "3,000-5,000 words" : "1,500-2,500 words";

    return [
      item.keyword,
      getOpportunity(item.searchVolume, item.competitionIndex, item.gsc?.position),
      getDifficulty(item.competitionIndex),
      item.cpcHigh || item.cpcLow ? "Revenue keyword" : "Needs CPC data",
      intent === "Transactional" ? "Service landing page + FAQ" : "SEO article + FAQ",
      articleLength,
      item.gsc ? "Use GSC landing page data after page dimension sync" : "Needs GSC query/page data",
    ];
  });

  const rankTrackerRows = (keywordResearch?.keywords || [])
    .filter((item) => item.gsc)
    .map((item) => [
      item.keyword,
      `#${Math.round((item.gsc?.position || 0) * 10) / 10}`,
      "From GSC",
      formatPercent(item.gsc?.ctr),
      formatNumber(item.gsc?.clicks),
      `${keywordResearch?.meta.startDate} - ${keywordResearch?.meta.endDate}`,
    ]);

  const researchedKeywordCount = keywordResearch?.keywords.length || 0;
  const gscKeywordCount = (keywordResearch?.keywords || []).filter((item) => item.gsc).length;

  return (
    <ModuleShell
      title="SEO Management"
      description="Pusat keyword research, AI SEO analyzer, content gap, content planner, article generator, internal link AI, rank tracker, dan sinkronisasi GSC/Google Ads/WordPress."
      action="Run SEO AI"
      stats={[
        { label: "Keyword researched", value: formatNumber(researchedKeywordCount), detail: keywordResearch ? "Google Ads Keyword Planner" : "Belum mengambil data API" },
        { label: "GSC keyword matched", value: formatNumber(gscKeywordCount), detail: keywordResearch ? "Google Search Console" : "Belum mengambil data API" },
        { label: "Content gaps", value: "0", detail: "Menunggu crawler real" },
        { label: "AI briefs ready", value: "0", detail: "Menunggu AI provider real" },
      ]}
    >
      <KeywordRankCompetitorCard defaultSiteUrl={gscSiteUrl} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard icon={Plug} title="External Integrations" description="Connector readiness untuk data SEO, Ads, dan publishing.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <MetricPill label="Google Search Console API" value="Query, page, CTR, position" />
            <MetricPill label="Google Ads Keyword Planner API" value="Volume, CPC, competition" />
            <MetricPill label="WordPress REST API" value="Draft, publish, categories" />
          </div>
        </SectionCard>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Keyword Research Input</h2>
              <p className="mt-1 text-sm text-slate-500">Masukkan keyword dan GSC property URL untuk menarik data real dari Google Ads Keyword Planner dan Search Console.</p>
            </div>
            <button
              onClick={handleKeywordResearch}
              disabled={isResearchLoading}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Search className="h-4 w-4" />
              {isResearchLoading ? "Fetching Google data..." : "Analyze keywords"}
            </button>
          </div>
          <input
            value={gscSiteUrl}
            onChange={(event) => setGscSiteUrl(event.target.value)}
            placeholder="https://gmtgroup.co.id/ atau sc-domain:gmtgroup.co.id"
            className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
          />
          <textarea
            value={keywordsInput}
            onChange={(event) => setKeywordsInput(event.target.value)}
            placeholder={"Masukkan keyword real dari bisnis GMT, satu per baris"}
            className="min-h-32 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-700 outline-none transition focus:border-[#0F766E] focus:bg-white focus:ring-2 focus:ring-teal-100"
          />
          {researchError && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {researchError}
            </div>
          )}
          {keywordResearch && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              Connected: {keywordResearch.meta.sources.join(", ")} | {keywordResearch.meta.startDate} sampai {keywordResearch.meta.endDate}
            </div>
          )}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricPill label="Primary market" value="Indonesia" />
            <MetricPill label="Language" value="Bahasa Indonesia" />
            <MetricPill label="Data source" value={keywordResearch ? `Google Ads ${keywordResearch.meta.adsApiVersion}` : "Waiting for API"} />
          </div>
        </section>
      </div>

      <SectionCard icon={BarChart3} title="Keyword Research Results" description="Data real dari Google Ads Keyword Planner dan Google Search Console.">
        {keywordRows.length ? (
          <DataTable
            columns={["Keyword", "Search Volume", "CPC Range", "Competition", "Competition Index", "GSC Clicks", "GSC CTR", "Avg Position", "Trend"]}
            rows={keywordRows}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            Jalankan Analyze keywords untuk mengambil data real dari Google API. Tabel ini tidak memakai data dummy.
          </div>
        )}
      </SectionCard>

      <SectionCard icon={Brain} title="AI SEO Analyzer" description="Analisis opportunity, difficulty, business potential, content type, article length, dan internal link strategy.">
        {analyzerRows.length ? (
          <DataTable
            columns={["Keyword", "Ranking Opportunity", "Difficulty", "Business Potential", "Recommended Content", "Article Length", "Internal Linking Strategy"]}
            rows={analyzerRows}
          />
        ) : (
          <EmptyState text="Analyzer belum menampilkan data karena belum ada hasil real dari Google Ads Keyword Planner/GSC." />
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard icon={GitCompare} title="Content Gap Analysis" description="Bandingkan website GMT dan kompetitor untuk menemukan topik, cluster, dan kategori yang hilang.">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" defaultValue="https://gmtgroup.co.id/" />
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" placeholder="https://competitor-domain.id" />
          </div>
          <EmptyState text="Belum ada content gap real. Perlu endpoint crawler/sitemap yang membaca GMT dan competitor URL, lalu membandingkan artikel, kategori, dan keyword cluster aktual." />
        </SectionCard>

        <SectionCard icon={Route} title="AI Content Planner" description="Roadmap pillar, cluster, dan supporting content untuk 3, 6, dan 12 bulan.">
          <EmptyState text="Belum ada roadmap real. Roadmap akan dibuat setelah keyword real, content gap real, dan kalender WordPress aktual tersedia." />
        </SectionCard>
      </div>

      <SectionCard icon={PenLine} title="AI Article Generator" description="Generator artikel SEO 3,000-5,000 kata dengan E-E-A-T, struktur heading, FAQ, link suggestion, dan schema markup.">
        <EmptyState text="Belum ada artikel real. Butuh AI provider dan data WordPress/GSC supaya title, meta, outline, body, link, dan schema tidak dibuat dari contoh palsu." />
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard icon={Link2} title="Internal Link AI" description="Scan artikel GMT dan rekomendasikan link internal, anchor text, serta related article.">
          <EmptyState text="Belum ada rekomendasi link real. Perlu WordPress REST API untuk membaca post/page aktual dan membangun peta internal link." />
        </SectionCard>

        <SectionCard icon={TrendingUp} title="Rank Tracker" description="Daily tracking keyword position, change, visibility, dan estimated traffic.">
          {rankTrackerRows.length ? (
            <DataTable
              columns={["Keyword", "Position", "Change", "CTR", "GSC Clicks", "Date Range"]}
              rows={rankTrackerRows}
            />
          ) : (
            <EmptyState text="Belum ada rank tracker real. Posisi akan muncul dari average position GSC setelah keyword berhasil dianalisis." />
          )}
        </SectionCard>
      </div>

      <SectionCard icon={Plug} title="Real Data Status" description="Status koneksi berdasarkan data yang benar-benar dimuat di halaman ini.">
        <DataTable
          columns={["Integration", "Loaded Rows", "Status", "Source"]}
          rows={[
            ["Google Ads Keyword Planner", formatNumber(keywordResearch?.keywords.length || 0), keywordResearch ? <StatusBadge tone="green">Loaded</StatusBadge> : <StatusBadge tone="slate">Not loaded</StatusBadge>, "/api/seo/keyword-research"],
            ["Google Search Console", formatNumber(gscKeywordCount), gscKeywordCount ? <StatusBadge tone="green">Loaded</StatusBadge> : <StatusBadge tone="slate">Not loaded</StatusBadge>, "/api/seo/keyword-research"],
            ["WordPress REST API", "0", <StatusBadge tone="slate">Not connected</StatusBadge>, "No endpoint yet"],
            ["AI Provider", "0", <StatusBadge tone="slate">Not connected</StatusBadge>, "No endpoint yet"],
          ]}
        />
      </SectionCard>
    </ModuleShell>
  );
}

export function MarketingIntegrations() {
  const defaultDateRange = getDefaultInstagramDateRange();
  const [metaHealth, setMetaHealth] = useState<MetaAccountHealth | null>(null);
  const [instagramInsights, setInstagramInsights] = useState<InstagramInsights | null>(null);
  const [socialAgent, setSocialAgent] = useState<SocialAgentBundle | null>(null);
  const [socialAgentError, setSocialAgentError] = useState("");
  const [isSocialAgentLoading, setIsSocialAgentLoading] = useState(false);
  const [competitorBenchmark, setCompetitorBenchmark] = useState<CompetitorBenchmark | null>(null);
  const [selectedInstagramId, setSelectedInstagramId] = useState("");
  const [metaError, setMetaError] = useState("");
  const [competitorError, setCompetitorError] = useState("");
  const [isMetaLoading, setIsMetaLoading] = useState(true);
  const [isCompetitorLoading, setIsCompetitorLoading] = useState(false);
  const [isConnectingMeta, setIsConnectingMeta] = useState(false);
  const [customCompetitorInput, setCustomCompetitorInput] = useState("");
  const [customCompetitorsList, setCustomCompetitorsList] = useState<string[]>([]);
  const [selectedContentIdeaIndex, setSelectedContentIdeaIndex] = useState(0);
  const [contentSort, setContentSort] = useState<"newest" | "oldest" | "reach" | "views" | "engagement" | "likes" | "comments" | "saves">("newest");
  const [accountTrendChartType, setAccountTrendChartType] = useState<"line" | "bar">("line");
  const [visibleAccountTrendMetrics, setVisibleAccountTrendMetrics] = useState(["Reach", "Impressions", "Profile Views", "Website Clicks"]);
  const [isReferenceBriefGenerating, setIsReferenceBriefGenerating] = useState(false);
  const [referenceBriefError, setReferenceBriefError] = useState("");
  const [sinceDate, setSinceDate] = useState(defaultDateRange.since);
  const [untilDate, setUntilDate] = useState(defaultDateRange.until);
  const [appliedDateRange, setAppliedDateRange] = useState(defaultDateRange);
  const [dateFilterError, setDateFilterError] = useState("");
  const [competitorChartMetric, setCompetitorChartMetric] = useState<"interactions" | "views">("interactions");

  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [contentGenError, setContentGenError] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isSavedToCms, setIsSavedToCms] = useState(false);
  const [contentGenerationSource, setContentGenerationSource] = useState<"calendar" | "reference">("calendar");
  const [contentGenerationReference, setContentGenerationReference] = useState<any>(null);
  const [isAutoPosting, setIsAutoPosting] = useState(false);
  const [autoPostMessage, setAutoPostMessage] = useState("");
  const [autoPostError, setAutoPostError] = useState("");

  const handleGenerateContent = async (type: string, referenceItem?: any) => {
    setIsGeneratingContent(true);
    setContentGenError("");
    setContentModalOpen(true);
    setGeneratedContent(null);
    setIsCopied(false);
    setIsSavedToCms(false);
    setAutoPostMessage("");
    setAutoPostError("");
    setContentGenerationSource(referenceItem ? "reference" : "calendar");
    setContentGenerationReference(referenceItem || null);

    // Resolve target content type
    let targetType = type;
    if (type === "ikutin") {
      const formatLower = ((referenceItem?.contentType || selectedContentIdea.format) || "").toLowerCase();
      if (formatLower.includes("reel")) targetType = "reels";
      else if (formatLower.includes("story")) targetType = "story";
      else if (formatLower.includes("carousel")) targetType = "carousel";
      else if (formatLower.includes("feed") || formatLower.includes("post")) targetType = "feed";
      else targetType = "feed";
    }

    const sourceIdea = referenceItem
      ? {
          format: referenceItem.contentType || "Feed",
          idea: `Adaptasi konten dari referensi: ${referenceItem.media?.caption || referenceItem.reasoning || referenceItem.media?.permalink || "referensi Instagram"}`,
          pillar: referenceItem.pillar || "Reference-inspired content",
          objective: "Membuat konten baru yang mengambil pola hook, gaya visual, dan angle dari referensi tanpa menyalin mentah.",
          formatGuide: [
            referenceItem.hook ? `Hook referensi: ${referenceItem.hook}` : "",
            referenceItem.style ? `Gaya visual/copy: ${referenceItem.style}` : "",
            referenceItem.action ? `Adaptasi yang disarankan: ${referenceItem.action}` : "",
            referenceItem.media?.permalink ? `Link referensi: ${referenceItem.media.permalink}` : "",
          ].filter(Boolean).join("\n") || "Gunakan data performa dan reasoning pada kartu referensi sebagai arahan eksekusi.",
          action: referenceItem.action || referenceItem.reasoning || "Buat versi baru yang sesuai brand dan audiens akun ini.",
          reason: referenceItem.reasoning || "Referensi ini dipilih karena pola kontennya relevan untuk diturunkan menjadi ide baru.",
          impact: referenceItem.engagementRate
            ? `Mengikuti pola referensi dengan engagement ${formatPercent(referenceItem.engagementRate)} sambil tetap menjaga karakter brand.`
            : "Diharapkan membantu memperjelas hook, gaya visual, dan CTA konten baru.",
        }
      : selectedContentIdea;

    try {
      const result = await generateContentFromBrief({
        selectedIdea: {
          format: sourceIdea.format,
          idea: sourceIdea.idea,
          pillar: sourceIdea.pillar,
          objective: sourceIdea.objective,
          formatGuide: sourceIdea.formatGuide,
          action: sourceIdea.action,
          reason: sourceIdea.reason,
          impact: sourceIdea.impact,
        },
        contentType: targetType,
        account: {
          username: connectedInstagram?.username || profile?.username,
          name: profile?.name,
          biography: profile?.biography,
        },
      });

      setGeneratedContent(result);
    } catch (error) {
      setGeneratedContent(null);
      setContentGenError(error instanceof Error ? error.message : "Gagal men-generate konten.");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleAutoPostGeneratedContent = async () => {
    if (!generatedContent) return;

    setIsAutoPosting(true);
    setAutoPostError("");
    setAutoPostMessage("");

    try {
      const result = await autoPostInstagramContent({
        igUserId: selectedInstagramId,
        content: generatedContent,
        reference: contentGenerationReference
          ? {
              id: contentGenerationReference.media?.id,
              sourceType: contentGenerationReference.sourceType,
              contentType: contentGenerationReference.contentType,
              caption: contentGenerationReference.media?.caption,
              permalink: contentGenerationReference.media?.permalink,
              reasoning: contentGenerationReference.reasoning,
              hook: contentGenerationReference.hook,
              style: contentGenerationReference.style,
              action: contentGenerationReference.action,
            }
          : undefined,
      });
      setAutoPostMessage(
        result.permalink
          ? `Konten berhasil diposting: ${result.permalink}`
          : `Konten berhasil diposting${result.selectedAsset?.name ? ` memakai asset ${result.selectedAsset.name}` : ""}.`,
      );
    } catch (error) {
      setAutoPostError(error instanceof Error ? error.message : "Gagal auto post ke Instagram.");
    } finally {
      setIsAutoPosting(false);
    }
  };

  const getCopyableText = (data: any) => {
    if (!data) return "";
    let text = `Judul: ${data.title}\n\n`;
    
    if (data.caption?.hook || data.caption?.body) {
      text += `[CAPTION]\n`;
      if (data.caption?.hook) text += `Hook: ${data.caption.hook}\n`;
      if (data.caption?.body) text += `${data.caption.body}\n`;
      if (data.caption?.cta) text += `CTA: ${data.caption.cta}\n`;
      if (data.caption?.hashtags?.length) text += `Hashtags: ${data.caption.hashtags.join(" ")}\n`;
      text += `\n`;
    }

    if (data.contentType === "artikel" && data.content?.article) {
      text += `[ARTIKEL]\n${data.content.article}\n`;
    } else if (data.content?.script?.length) {
      text += `[SCRIPT REELS/VIDEO]\n`;
      data.content.script.forEach((scene: any) => {
        text += `- ${scene.timecode} | Visual: ${scene.visual} | VO: ${scene.voiceOver} | Text: ${scene.onScreenText}\n`;
      });
    } else if (data.content?.storyFrames?.length) {
      text += `[STORY FRAMES]\n`;
      data.content.storyFrames.forEach((frame: any) => {
        text += `- Frame ${frame.frame} | Visual: ${frame.visual} | Text: ${frame.text} | CTA/Sticker: ${frame.stickerOrCta}\n`;
      });
    } else if (data.content?.carouselSlides?.length) {
      text += `[CAROUSEL SLIDES]\n`;
      data.content.carouselSlides.forEach((slide: any) => {
        text += `- Slide ${slide.slide} | Headline: ${slide.headline} | Visual: ${slide.visual} | Copy: ${slide.copy}\n`;
      });
    }

    if (data.metadata?.visualDirection) {
      text += `\n[ARAHAN VISUAL]\n${data.metadata.visualDirection}\n`;
    }
    return text;
  };

  const loadCompetitorBenchmark = async (
    igUserId: string,
    dateRange: { since: string; until: string } = appliedDateRange,
    usernames?: string[]
  ) => {
    setIsCompetitorLoading(true);
    setCompetitorError("");

    try {
      const result = await fetchCompetitorBenchmark(igUserId, dateRange, usernames);
      setCompetitorBenchmark(result);
    } catch (error) {
      setCompetitorBenchmark(null);
      setCompetitorError(error instanceof Error ? error.message : "Gagal membaca benchmark kompetitor.");
    } finally {
      setIsCompetitorLoading(false);
    }
  };

  const loadInstagramInsights = async (
    igUserId: string,
    dateRange: { since: string; until: string } = appliedDateRange,
    forceRefresh: boolean = false
  ) => {
    setIsMetaLoading(true);
    setMetaError("");

    try {
      let insightsData: InstagramInsights | null = null;

      // Invalidate database cache if force refresh is requested (e.g. Regenerate)
      if (forceRefresh) {
        try {
          await deleteContentBriefCache(igUserId);
          console.log("Database cache invalidated for igUserId:", igUserId);
        } catch (deleteError) {
          console.warn("Failed to delete/invalidate content brief cache:", deleteError);
        }
      }

      // 1. Try to fetch from database cache first (only if not forceRefresh)
      if (!forceRefresh) {
        try {
          const cacheRes = await fetchContentBriefCache(igUserId);
          if (cacheRes && cacheRes.cached && cacheRes.data) {
            // Cache hit! We fetch raw instagram data with skipAi = true
            // This still runs enrichMediaReasoning in real-time on the server.
            insightsData = await fetchInstagramInsights(igUserId, dateRange, true);
            
            // Attach cached data
            insightsData.contentBrief = cacheRes.data.content_brief;
            insightsData.contentReferences = cacheRes.data.content_references;
            console.log("AI Content Brief cache hit from database.");
          }
        } catch (cacheError) {
          console.warn("Failed to read from content brief cache (expected if DB/endpoint not ready yet):", cacheError);
        }
      }

      // 2. Cache miss or force refresh or cache check failed
      if (!insightsData) {
        // Load the dashboard-critical Instagram data first. AI brief generation can be
        // slower for accounts with heavier data, so a failed AI request should not
        // prevent the integrations page from showing the account metrics.
        const baseInsightsData = await fetchInstagramInsights(igUserId, dateRange, true);
        insightsData = baseInsightsData;

        try {
          const aiInsightsData = await fetchInstagramInsights(igUserId, dateRange, false);
          insightsData = aiInsightsData;

          // Save generated data to cache
          if (aiInsightsData.contentBrief || (aiInsightsData.contentReferences && aiInsightsData.contentReferences.length > 0)) {
            try {
              await saveContentBriefCache({
                ig_user_id: igUserId,
                ig_username: aiInsightsData.profile?.username || "",
                content_brief: aiInsightsData.contentBrief,
                content_references: aiInsightsData.contentReferences || [],
              });
              console.log("Saved new AI Content Brief to database cache.");
            } catch (saveError) {
              console.warn("Failed to write to content brief cache (expected if DB/endpoint not ready yet):", saveError);
            }
          }
        } catch (aiError) {
          const message = aiError instanceof Error ? aiError.message : "AI content brief gagal dibuat.";
          insightsData = {
            ...baseInsightsData,
            warnings: [...(baseInsightsData.warnings || []), `AI content brief: ${message}`],
          };
          setMetaError(`Data Instagram berhasil dimuat, tetapi AI content brief gagal dibuat: ${message}`);
        }

      }

      setInstagramInsights(insightsData);
      if (isSocialAgentConfigured()) {
        setIsSocialAgentLoading(true);
        setSocialAgentError("");
        void syncAndFetchSocialAgent(insightsData, dateRange)
          .then((result) => {
            setSocialAgent(result);
            const reasoning = new Map(
              (result.reasoning.data || []).map((item) => [String(item.ig_media_id), item]),
            );
            setInstagramInsights((current) => current ? {
              ...current,
              media: current.media.map((item) => {
                const ai = reasoning.get(String(item.id));
                if (!ai) return item;
                return {
                  ...item,
                  ai_reasoning: ai.ai_reasoning || item.ai_reasoning,
                  ai_action: Array.isArray(ai.ai_action) ? ai.ai_action.join(" ") : ai.ai_action || item.ai_action,
                  ai_angle: ai.ai_topic_badge || item.ai_angle,
                  ai_status: ai.ai_performance_badge || item.ai_status,
                  ai_reasoning_source: "sosmed_agent_claude",
                };
              }),
            } : current);
          })
          .catch((error) => setSocialAgentError(error instanceof Error ? error.message : "Social Media Agent gagal dimuat."))
          .finally(() => setIsSocialAgentLoading(false));
      }
      void loadCompetitorBenchmark(igUserId, dateRange);
    } catch (error) {
      setInstagramInsights(null);
      setCompetitorBenchmark(null);
      setMetaError(error instanceof Error ? error.message : "Gagal membaca insight Instagram.");
    } finally {
      setIsMetaLoading(false);
    }
  };

  const refreshMetaStatus = async () => {
    setIsMetaLoading(true);
    setMetaError("");

    try {
      const accounts = await fetchMetaAccounts();
      setMetaHealth(accounts);

      const selectedAccount = accounts.instagramAccounts.find((account) => account.id === selectedInstagramId)
        || accounts.instagramAccounts[0];

      if (accounts.connected && selectedAccount) {
        setSelectedInstagramId(selectedAccount.id);
        await loadInstagramInsights(selectedAccount.id, appliedDateRange);
      } else {
        setSelectedInstagramId("");
        setInstagramInsights(null);
        setCompetitorBenchmark(null);
      }
    } catch (error) {
      setMetaError(error instanceof Error ? error.message : "Gagal membaca status Meta API.");
    } finally {
      setIsMetaLoading(false);
    }
  };

  const handleConnectMeta = async () => {
    setIsConnectingMeta(true);
    setMetaError("");

    try {
      const { url } = await fetchMetaAuthUrl();
      window.location.href = url;
    } catch (error) {
      setMetaError(error instanceof Error ? error.message : "Gagal membuat URL OAuth Meta.");
      setIsConnectingMeta(false);
    }
  };

  const applyDateFilter = () => {
    const sinceTime = Date.parse(`${sinceDate}T00:00:00`);
    const untilTime = Date.parse(`${untilDate}T00:00:00`);
    const rangeDays = Math.floor((untilTime - sinceTime) / (24 * 60 * 60 * 1000)) + 1;

    if (!sinceDate || !untilDate || !Number.isFinite(rangeDays) || rangeDays < 1) {
      setDateFilterError("Tanggal mulai tidak boleh melewati tanggal akhir.");
      return;
    }

    if (rangeDays > 90) {
      setDateFilterError("Rentang tanggal maksimal 90 hari.");
      return;
    }

    const nextRange = { since: sinceDate, until: untilDate };
    setDateFilterError("");
    setAppliedDateRange(nextRange);
    if (selectedInstagramId) loadInstagramInsights(selectedInstagramId, nextRange);
  };

  useEffect(() => {
    refreshMetaStatus();
  }, []);

  const connectedInstagram = metaHealth?.instagramAccounts.find((account) => account.id === selectedInstagramId)
    || metaHealth?.instagramAccounts[0];
  const metaConnected = Boolean(metaHealth?.connected);

  const hasInstagramData = Boolean(instagramInsights);

  const findInsightWithValues = (...names: string[]) =>
    instagramInsights?.insights.find((item) => names.includes(item.name) && item.values?.some((point) => toNumber(point.value) !== undefined));

  const getAccountMetric = (...names: string[]) => {
    const insight = findInsightWithValues(...names);
    return toNumber(insight?.values?.at(-1)?.value);
  };

  const getAccountMetricTotal = (...names: string[]) => {
    const insight = findInsightWithValues(...names);
    return insight?.values?.length
      ? insight.values.reduce((total, point) => total + (toNumber(point.value) || 0), 0)
      : undefined;
  };

  const getMediaMetric = (media: NonNullable<InstagramInsights["media"]>[number], ...names: string[]) =>
    toNumber(media.insights?.data?.find((item) => names.includes(item.name))?.values?.at(-1)?.value);

  const mediaItems = instagramInsights?.media || [];
  const sumMediaMetric = (...names: string[]) => sumNumbers(mediaItems.map((media) => getMediaMetric(media, ...names)));
  const mediaReachTotal = sumMediaMetric("reach", "accounts_reached");
  const mediaViewsTotal = sumMediaMetric("views", "impressions");
  const mediaProfileActivityTotal = sumMediaMetric("profile_visits");

  const latestReach = getAccountMetricTotal("reach", "accounts_reached") ?? mediaReachTotal;
  const impressions = getAccountMetricTotal("views") ?? mediaViewsTotal;
  const accountProfileViews = getAccountMetricTotal("profile_views");
  const profileViews = accountProfileViews ?? mediaProfileActivityTotal ?? (hasInstagramData ? 0 : undefined);
  const websiteClicks = getAccountMetricTotal("profile_links_taps", "website_clicks") ?? (hasInstagramData ? 0 : undefined);
  const ctaMetricNames = ["profile_links_taps", "website_clicks"];
  const ctaValues = ctaMetricNames
    .map((name) => getAccountMetricTotal(name))
    .filter((value): value is number => value !== undefined);
  const ctaClicks = ctaValues.length ? ctaValues.reduce((total, value) => total + value, 0) : (hasInstagramData ? 0 : undefined);
  const profile = instagramInsights?.profile;
  const audience = instagramInsights?.audience;
  const onlineFollowerSlots = audience?.onlineFollowers || [];
  const topOnlineFollowerSlots = onlineFollowerSlots.slice(0, 4);
  const demographicAge = formatRankedValue(audience?.demographics?.age);
  const demographicGender = formatRankedValue(audience?.demographics?.gender);
  const demographicCity = formatRankedValue(audience?.demographics?.city);
  const demographicCountry = formatRankedValue(audience?.demographics?.country);
  const followerSeries = instagramInsights?.insights.find((item) => item.name === "follower_count")?.values || [];
  const followsAndUnfollowsSeries = instagramInsights?.insights.find((item) => item.name === "follows_and_unfollows")?.values || [];
  const followsAndUnfollowsGrowth = followsAndUnfollowsSeries.length
    ? followsAndUnfollowsSeries.reduce((total, point) => total + (getFollowerDeltaValue(point.value) || 0), 0)
    : undefined;
  const newFollowerGrowth = followerSeries.length
    ? followerSeries.reduce((total, point) => total + (toNumber(point.value) || 0), 0)
    : undefined;
  const followerGrowth = followsAndUnfollowsGrowth ?? newFollowerGrowth;
  const followerStartValue = profile?.followers_count !== undefined && followerGrowth !== undefined
    ? profile.followers_count - followerGrowth
    : undefined;
  const followerGrowthRate = followerStartValue && followerGrowth !== undefined
    ? followerGrowth / followerStartValue
    : undefined;

  const accountMetrics = [
    { label: "Followers count", value: profile?.followers_count, detail: "Total followers akun saat ini" },
    { label: "Followers growth", value: followerGrowthRate, valueType: "percent", detail: followerGrowth !== undefined ? `${formatNumber(followerGrowth)} followers dalam periode data` : "Perubahan follower awal ke akhir periode" },
    { label: "Follows count", value: profile?.follows_count, detail: "Jumlah akun yang diikuti" },
    { label: "Profile views", value: profileViews, detail: accountProfileViews === undefined && mediaProfileActivityTotal !== undefined ? "Fallback dari profile visits konten" : "Jumlah kunjungan ke profil" },
    { label: "Reach akun", value: latestReach, detail: mediaReachTotal !== undefined && getAccountMetricTotal("reach", "accounts_reached") === undefined ? "Akumulasi reach konten yang dimuat" : "Akun unik yang melihat konten" },
    { label: "Impressions akun", value: impressions, detail: mediaViewsTotal !== undefined && getAccountMetricTotal("impressions", "views") === undefined ? "Fallback dari views/plays konten" : "Total tayangan seluruh konten" },
    { label: "Website clicks", value: websiteClicks, detail: "Total klik tautan bio dalam periode" },
    { label: "CTA clicks", value: ctaClicks, detail: "Total email, telepon, SMS, dan petunjuk arah" },
  ];

  const trendMetrics: Record<string, string> = {
    reach: "Reach",
    accounts_reached: "Reach",
    views: "Impressions",
    profile_views: "Profile Views",
    website_clicks: "Website Clicks",
    profile_links_taps: "Website Clicks",
  };
  const trendByDate = new Map<string, Record<string, string | number>>();

  for (const insight of instagramInsights?.insights || []) {
    const metricLabel = trendMetrics[insight.name];

    if (!metricLabel) continue;

    for (const point of insight.values || []) {
      const dateKey = point.end_time || "Periode terbaru";
      const current = trendByDate.get(dateKey) || {
        date: point.end_time ? new Date(point.end_time).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : dateKey,
      };
      current[metricLabel] = toNumber(point.value) || 0;
      trendByDate.set(dateKey, current);
    }
  }

  const accountTrendData = Array.from(trendByDate.entries())
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([, value]) => value);
  const accountTrendMetricConfig = [
    { key: "Reach", color: "#0F766E" },
    { key: "Impressions", color: "#2563EB" },
    { key: "Profile Views", color: "#DB2777" },
    { key: "Website Clicks", color: "#F59E0B" },
  ];
  const toggleAccountTrendMetric = (metric: string) => {
    setVisibleAccountTrendMetrics((current) => {
      if (current.includes(metric)) {
        return current.length > 1 ? current.filter((item) => item !== metric) : current;
      }
      return [...current, metric];
    });
  };
  const accountTrendSummary = accountTrendMetricConfig.map((metric) => ({
    ...metric,
    total: accountTrendData.reduce((sum, point) => sum + (toNumber(point[metric.key]) || 0), 0),
  }));
  const competitorColors = ["#0F766E", "#2563EB", "#DB2777", "#F59E0B", "#7C3AED", "#0891B2", "#65A30D", "#EA580C"];
  
  const currentAccountCompetitor = profile && mediaItems.length ? {
    username: profile.username || "Akun Saya",
    name: profile.name || "",
    followersCount: profile.followers_count || 0,
    mediaCount: profile.media_count || 0,
    publicMedia: mediaItems.map(media => ({
      id: media.id,
      timestamp: media.timestamp,
      interactions: (media.like_count || 0) + (media.comments_count || 0)
    }))
  } : null;

  const competitorsToGraph = currentAccountCompetitor 
    ? [currentAccountCompetitor, ...(competitorBenchmark?.competitors || [])]
    : (competitorBenchmark?.competitors || []);

  const competitorMetricConfig = competitorsToGraph.map((competitor, index) => ({
    key: `@${competitor.username}`,
    color: index === 0 && currentAccountCompetitor ? "#1E293B" : competitorColors[(index - (currentAccountCompetitor ? 1 : 0) + competitorColors.length) % competitorColors.length],
    competitor,
  }));

  const competitorActivityMap = new Map<string, Record<string, string | number>>();

  const startDate = new Date(appliedDateRange.since);
  const endDate = new Date(appliedDateRange.until);
  const msInDay = 24 * 60 * 60 * 1000;
  
  if (startDate <= endDate) {
    for (let d = startDate.getTime(); d <= endDate.getTime(); d += msInDay) {
      const dateObj = new Date(d);
      const dateStr = dateObj.toISOString().split("T")[0];
      competitorActivityMap.set(dateStr, {
        date: dateObj.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        rawDate: dateStr,
      });
    }
  }

  for (const metric of competitorMetricConfig) {
    for (const media of metric.competitor.publicMedia || []) {
      const dateStr = media.timestamp ? media.timestamp.split("T")[0] : undefined;
      const dateKey = dateStr || media.id;
      if (!dateKey || !competitorActivityMap.has(dateKey)) continue;

      const current = competitorActivityMap.get(dateKey)!;
      const currentVal = (current[metric.key] as number) || 0;
      current[metric.key] = currentVal + (competitorChartMetric === "views" ? (media.views || 0) : (media.interactions || 0));
    }
  }

  const competitorActivityData = Array.from(competitorActivityMap.values())
    .sort((a, b) => {
      const dateA = a.rawDate as string;
      const dateB = b.rawDate as string;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.localeCompare(dateB);
    });
  const competitorSummaryRows = (competitorBenchmark?.competitors || []).map((competitor) => [
    <div className="min-w-0">
      <p className="truncate font-semibold text-slate-900">@{competitor.username}</p>
      {competitor.name ? <p className="text-xs text-slate-500">{competitor.name}</p> : null}
    </div>,
    formatNumber(competitor.followersCount),
    formatNumber(competitor.mediaCount),
    formatNumber(competitor.summary.posts),
    formatNumber(competitor.summary.avgInteractions),
    formatPercent(competitor.summary.avgEngagementRate),
    `${competitor.summary.postingFrequencyPerWeek.toLocaleString("id-ID", { maximumFractionDigits: 1 })}/minggu`,
  ]);

  const contentChartData = mediaItems.slice(0, 8).reverse().map((media, index) => ({
    name: `Post ${index + 1}`,
    Reach: getMediaMetric(media, "reach", "accounts_reached") || 0,
    Likes: media.like_count || 0,
    Comments: media.comments_count || 0,
    Saves: getMediaMetric(media, "saved", "saves") || 0,
  }));

  const interactionTotals = mediaItems.reduce((totals, media) => ({
    likes: totals.likes + (media.like_count || 0),
    comments: totals.comments + (media.comments_count || 0),
    shares: totals.shares + (getMediaMetric(media, "shares") || 0),
    saves: totals.saves + (getMediaMetric(media, "saved", "saves") || 0),
  }), { likes: 0, comments: 0, shares: 0, saves: 0 });
  const interactionChartData = [
    { name: "Likes", value: interactionTotals.likes, color: "#0F766E" },
    { name: "Comments", value: interactionTotals.comments, color: "#2563EB" },
    { name: "Shares", value: interactionTotals.shares, color: "#F59E0B" },
    { name: "Saves", value: interactionTotals.saves, color: "#DB2777" },
  ].filter((item) => item.value > 0);

  const mediaAnalytics = mediaItems.map((media) => {
    const reach = getMediaMetric(media, "reach", "accounts_reached") || 0;
    const shares = getMediaMetric(media, "shares") || 0;
    const saves = getMediaMetric(media, "saved", "saves") || 0;
    const interactions = getMediaMetric(media, "total_interactions")
      ?? ((media.like_count || 0) + (media.comments_count || 0) + shares + saves);
    const contentType = media.media_product_type === "REELS"
      ? "Reels"
      : media.media_product_type === "STORY"
        ? "Story"
        : media.media_type === "CAROUSEL_ALBUM"
          ? "Carousel"
          : "Feed";

    return {
      media,
      reach,
      interactions,
      engagementRate: reach ? interactions / reach : undefined,
      contentType,
      postedAt: media.timestamp ? new Date(media.timestamp) : undefined,
    };
  });

  const engagementRates = mediaAnalytics
    .map((item) => item.engagementRate)
    .filter((value): value is number => value !== undefined);
  const averageEngagementRate = engagementRates.length
    ? engagementRates.reduce((sum, value) => sum + value, 0) / engagementRates.length
    : undefined;

  const contentTypeMap = new Map<string, { type: string; posts: number; reach: number; engagement: number; measured: number }>();
  for (const item of mediaAnalytics) {
    const current = contentTypeMap.get(item.contentType) || { type: item.contentType, posts: 0, reach: 0, engagement: 0, measured: 0 };
    current.posts += 1;
    current.reach += item.reach;
    if (item.engagementRate !== undefined) {
      current.engagement += item.engagementRate;
      current.measured += 1;
    }
    contentTypeMap.set(item.contentType, current);
  }
  const contentTypePerformance = Array.from(contentTypeMap.values()).map((item) => ({
    ...item,
    averageReach: item.posts ? item.reach / item.posts : 0,
    averageEngagement: item.measured ? item.engagement / item.measured : undefined,
  }));

  const timeSlotMap = new Map<string, { label: string; posts: number; reach: number; engagement: number; measured: number }>();
  for (const item of mediaAnalytics) {
    if (!item.postedAt) continue;
    const label = item.postedAt.toLocaleDateString("id-ID", { weekday: "long", hour: "2-digit", timeZone: "Asia/Jakarta" });
    const current = timeSlotMap.get(label) || { label, posts: 0, reach: 0, engagement: 0, measured: 0 };
    current.posts += 1;
    current.reach += item.reach;
    if (item.engagementRate !== undefined) {
      current.engagement += item.engagementRate;
      current.measured += 1;
    }
    timeSlotMap.set(label, current);
  }
  const bestTimeSlots = Array.from(timeSlotMap.values())
    .map((slot) => ({
      ...slot,
      averageReach: slot.posts ? slot.reach / slot.posts : 0,
      averageEngagement: slot.measured ? slot.engagement / slot.measured : 0,
    }))
    .sort((first, second) => second.averageEngagement - first.averageEngagement || second.averageReach - first.averageReach)
    .slice(0, 3);
  const onlineFollowerDisplaySlots = topOnlineFollowerSlots.length
    ? topOnlineFollowerSlots.map((slot) => ({ ...slot, source: "followers" as const }))
    : bestTimeSlots.map((slot) => ({
      label: slot.label,
      value: Math.round(slot.averageReach || slot.posts),
      source: "content" as const,
    }));

  const hashtagMap = new Map<string, { hashtag: string; posts: number; reach: number; engagement: number; measured: number }>();
  for (const item of mediaAnalytics) {
    const hashtags = Array.from(new Set((item.media.caption?.match(/#[\p{L}\p{N}_]+/gu) || []).map((tag) => tag.toLowerCase())));
    for (const hashtag of hashtags) {
      const current = hashtagMap.get(hashtag) || { hashtag, posts: 0, reach: 0, engagement: 0, measured: 0 };
      current.posts += 1;
      current.reach += item.reach;
      if (item.engagementRate !== undefined) {
        current.engagement += item.engagementRate;
        current.measured += 1;
      }
      hashtagMap.set(hashtag, current);
    }
  }
  const hashtagPerformance = Array.from(hashtagMap.values())
    .map((item) => ({
      ...item,
      averageReach: item.posts ? item.reach / item.posts : 0,
      averageEngagement: item.measured ? item.engagement / item.measured : undefined,
    }))
    .sort((first, second) => (second.averageEngagement || 0) - (first.averageEngagement || 0) || second.averageReach - first.averageReach)
    .slice(0, 8);

  const weeklyMap = new Map<string, { posts: number; engagement: number; measured: number }>();
  for (const item of mediaAnalytics) {
    if (!item.postedAt) continue;
    const weekStart = new Date(item.postedAt);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);
    const current = weeklyMap.get(weekKey) || { posts: 0, engagement: 0, measured: 0 };
    current.posts += 1;
    if (item.engagementRate !== undefined) {
      current.engagement += item.engagementRate;
      current.measured += 1;
    }
    weeklyMap.set(weekKey, current);
  }
  const frequencyCorrelation = calculateCorrelation(Array.from(weeklyMap.values())
    .filter((week) => week.measured > 0)
    .map((week) => ({ x: week.posts, y: week.engagement / week.measured })));
  const correlationLabel = frequencyCorrelation === undefined
    ? "Belum cukup data"
    : `${frequencyCorrelation >= 0 ? "+" : ""}${frequencyCorrelation.toFixed(2)}`;

  const buildContentReasoning = ({
    reach,
    views,
    interactions,
    engagementRate,
    saves,
    shares,
    contentType,
  }: {
    reach: number;
    views: number;
    interactions: number;
    engagementRate?: number;
    saves: number;
    shares: number;
    contentType: string;
  }) => {
    const notes: string[] = [];

    if (engagementRate !== undefined) {
      if (engagementRate >= 0.1) notes.push("Engagement tinggi; konten kuat untuk dijadikan referensi format berikutnya.");
      else if (engagementRate >= 0.03) notes.push("Engagement cukup stabil; pertahankan tema dan optimalkan hook/caption.");
      else notes.push("Engagement rendah; perlu perbaikan hook, visual awal, atau CTA.");
    } else if (reach > 0) {
      notes.push("Reach ada, tetapi interaksi terbatas sehingga kualitas respons audiens perlu dicek.");
    } else {
      notes.push("Data reach belum cukup; evaluasi setelah insight konten tersedia.");
    }

    if (views > reach && views > 0) notes.push("Views lebih besar dari reach, indikasi ada repeat view atau konsumsi ulang.");
    else if (reach > 0 && interactions > 0) notes.push("Konten mendapat respons organik dari audiens yang melihat.");
    if (saves > 0) notes.push("Ada saves, menandakan konten bernilai untuk disimpan.");
    if (shares > 0) notes.push("Ada shares, menandakan konten cukup relevan untuk dibagikan.");
    if (contentType === "Reels" && views === 0) notes.push("Reels belum punya views terukur dari API untuk periode ini.");

    return notes.slice(0, 2).join(" ");
  };

  const contentTableItems = mediaItems.map((media) => {
    const reach = getMediaMetric(media, "reach", "accounts_reached");
    const likes = media.like_count;
    const comments = media.comments_count;
    const shares = getMediaMetric(media, "shares");
    const saves = getMediaMetric(media, "saved", "saves");
    const views = getMediaMetric(media, "impressions", "views", "plays");
    const interactions = getMediaMetric(media, "total_interactions")
      ?? ((likes || 0) + (comments || 0) + (shares || 0) + (saves || 0));
    const engagementRate = reach ? interactions / reach : undefined;
    const contentType = media.media_product_type === "REELS"
      ? "Reels"
      : media.media_product_type === "STORY"
        ? "Story"
        : media.media_type === "CAROUSEL_ALBUM"
          ? "Carousel"
          : media.media_type || "POST";

    return {
      media,
      reach: reach || 0,
      likes: likes || 0,
      comments: comments || 0,
      shares: shares || 0,
      saves: saves || 0,
      views: views || 0,
      interactions,
      engagementRate,
      contentType,
      postedAtTime: media.timestamp ? new Date(media.timestamp).getTime() : 0,
      reasoning: media.ai_reasoning || buildContentReasoning({
        reach: reach || 0,
        views: views || 0,
        interactions,
        engagementRate,
        saves: saves || 0,
        shares: shares || 0,
        contentType,
      }),
    };
  });

  const sortedContentTableItems = [...contentTableItems].sort((first, second) => {
    if (contentSort === "oldest") return first.postedAtTime - second.postedAtTime;
    if (contentSort === "reach") return second.reach - first.reach;
    if (contentSort === "views") return second.views - first.views;
    if (contentSort === "engagement") return (second.engagementRate || 0) - (first.engagementRate || 0);
    if (contentSort === "likes") return second.likes - first.likes;
    if (contentSort === "comments") return second.comments - first.comments;
    if (contentSort === "saves") return second.saves - first.saves;
    return second.postedAtTime - first.postedAtTime;
  });

  const getStatusTone = (status?: string): StatusTone => {
    if (status === "Top Performer") return "green";
    if (status === "Underperformer") return "red";
    if (status === "Average") return "yellow";
    return "blue";
  };

  const contentRows = sortedContentTableItems.map((item) => {
    const { media, reach, likes, comments, shares, saves, views, engagementRate, reasoning } = item;
    return [
      <div className="w-64">
        <p className="line-clamp-3 font-semibold leading-5 text-slate-900">{media.caption || "Konten tanpa caption"}</p>
        <p className="mt-1 text-xs text-slate-500">{media.timestamp ? new Date(media.timestamp).toLocaleDateString("id-ID") : "-"}</p>
      </div>,
      <div className="flex w-36 flex-wrap gap-1.5">
        <StatusBadge tone={media.media_type === "VIDEO" ? "blue" : "teal"}>{item.contentType}</StatusBadge>
        {media.ai_status ? <StatusBadge tone={getStatusTone(media.ai_status)}>{media.ai_status}</StatusBadge> : null}
        {media.ai_angle ? <StatusBadge tone="teal">{media.ai_angle}</StatusBadge> : null}
      </div>,
      <div className="grid min-w-48 grid-cols-2 gap-x-5 gap-y-2 text-xs">
        {[
          ["Reach", reach],
          ["Views", views],
          ["Likes", likes],
          ["Comments", comments],
          ["Shares", shares],
          ["Saves", saves],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <p className="text-slate-500">{label}</p>
            <p className="mt-0.5 font-bold text-slate-900">{formatNumber(value as number)}</p>
          </div>
        ))}
      </div>,
      <div className="min-w-24">
        <p className="text-base font-bold text-[#0F766E]">{formatPercent(engagementRate)}</p>
        <p className="mt-1 text-xs text-slate-500">Engagement rate</p>
      </div>,
      <details className="w-72 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <summary className="cursor-pointer text-xs font-semibold text-[#0F766E]">Lihat analisis AI</summary>
        <p className="mt-3 text-xs leading-5 text-slate-600">{reasoning}</p>
        {media.ai_action ? <p className="mt-2 text-xs font-semibold leading-5 text-[#0F766E]">Aksi: {media.ai_action}</p> : null}
        <div className="mt-2">
          <StatusBadge tone={media.ai_reasoning_source && media.ai_reasoning_source !== "local" ? "blue" : "slate"}>
            {media.ai_reasoning_source && media.ai_reasoning_source !== "local" ? "Sosmed Agent Claude" : "Local"}
          </StatusBadge>
        </div>
      </details>,
      media.permalink ? (
        <a className="inline-flex rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-[#0F766E] hover:bg-teal-100" href={media.permalink} target="_blank" rel="noreferrer">Buka post</a>
      ) : <span className="text-slate-400">—</span>,
    ];
  });
  const customContentReferences = (instagramInsights?.contentReferences || []).map((reference, index) => ({
    id: reference.id || `custom-reference-${index + 1}`,
    sourceType: "custom" as const,
    media: {
      id: reference.id || `custom-reference-${index + 1}`,
      caption: reference.caption || reference.title || reference.hook || reference.url || "Referensi custom",
      permalink: reference.url || reference.accountUrl,
      timestamp: undefined,
      ai_reasoning_source: reference.source,
    },
    reach: undefined,
    likes: undefined,
    comments: undefined,
    shares: undefined,
    saves: undefined,
    views: undefined,
    engagementRate: undefined,
    contentType: reference.contentType || "Reference",
    reasoning: reference.reasoning || reference.note || "Referensi custom untuk akun ini.",
    hook: reference.hook,
    style: reference.style,
    action: reference.action,
    pillar: reference.pillar,
  }));
  const localContentReferences = [...contentTableItems]
    .sort((first, second) => (second.engagementRate || 0) - (first.engagementRate || 0) || second.reach - first.reach || second.views - first.views)
    .slice(0, 3)
    .map((item) => ({ ...item, sourceType: "local" as const }));
  const topContentReferences = customContentReferences.length ? customContentReferences : localContentReferences;
  const bestContentType = [...contentTypePerformance]
    .sort((first, second) => (second.averageEngagement || 0) - (first.averageEngagement || 0) || second.averageReach - first.averageReach)[0];
  const topHashtags = hashtagPerformance.slice(0, 4).map((item) => item.hashtag);
  const bestPostingTime = bestTimeSlots[0]?.label || "slot waktu dengan engagement tertinggi";
  const videoMedia = mediaItems.filter((media) => media.media_type === "VIDEO" || media.media_product_type === "REELS");
  const storyMedia = mediaItems.filter((media) => media.media_product_type === "STORY");
  const videoViews = videoMedia.reduce((sum, media) => sum + (getMediaMetric(media, "views", "impressions") || 0), 0);
  const reelsPlays = videoMedia
    .filter((media) => media.media_product_type === "REELS")
    .reduce((sum, media) => sum + (getMediaMetric(media, "views", "impressions") || 0), 0);
  const profileActivityFromVideo = videoMedia.reduce((sum, media) => sum + (getMediaMetric(media, "profile_visits") || 0), 0);
  const watchTimeValues = videoMedia
    .map((media) => getMediaMetric(media, "ig_reels_avg_watch_time", "average_watch_time"))
    .filter((value): value is number => value !== undefined);
  const averageWatchTimeMs = watchTimeValues.length
    ? watchTimeValues.reduce((sum, value) => sum + value, 0) / watchTimeValues.length
    : undefined;
  const averageWatchTime = averageWatchTimeMs !== undefined
    ? `${(averageWatchTimeMs / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} dtk`
    : "-";
  const fallbackContentIdeas = [
    {
      day: "Hari 1",
      format: "Reels",
      idea: `Hook cepat: masalah utama audiens lalu tampilkan solusi dari ${connectedInstagram?.username ? `@${connectedInstagram.username}` : "brand"}.`,
      formatGuide: "Video vertikal 9:16, durasi 12-20 detik. Struktur: 0-2 detik hook, 3-12 detik solusi/proof, 13-20 detik CTA.",
      action: `Posting di ${bestPostingTime}. Pakai opening 2 detik yang kuat, subtitle besar, dan CTA komentar.`,
      reason: "Reels pendek cocok untuk reach karena mudah ditonton ulang, cepat dipahami, dan memberi sinyal retention lebih baik.",
      impact: "Berpotensi menaikkan reach karena format singkat lebih mudah didistribusikan dan memancing interaksi awal.",
    },
    {
      day: "Hari 2",
      format: "Story",
      idea: "Behind the scene, progress pekerjaan, atau aktivitas tim yang membuat brand terasa lebih dekat.",
      formatGuide: "3-5 frame Story. Frame 1 teaser, frame 2-3 proses, frame 4 poll/quiz, frame 5 CTA reply atau DM.",
      action: "Gunakan poll/quiz sederhana, lalu follow-up dengan sticker pertanyaan.",
      reason: "Story bagus untuk menjaga hubungan dengan followers aktif karena interaksi kecil seperti poll dan reply terasa ringan.",
      impact: "Meningkatkan reply dan sinyal relationship dengan followers aktif.",
    },
    {
      day: "Hari 3",
      format: bestContentType?.type || "Carousel",
      idea: "Konten edukasi: 3 kesalahan umum pelanggan dan cara menghindarinya.",
      formatGuide: "Carousel 6-8 slide. Slide 1 judul kuat, slide 2-4 poin masalah, slide 5-7 solusi, slide terakhir CTA save/share.",
      action: `Buat slide/saveable content, tambahkan CTA save dan gunakan hashtag terbaik: ${topHashtags.length ? topHashtags.join(", ") : "hashtag niche brand"}.`,
      reason: "Carousel memberi ruang edukasi tanpa terasa berat dan biasanya lebih mudah menghasilkan save karena bisa dibaca ulang.",
      impact: "Saves dan shares bisa naik karena konten terasa berguna dan mudah dijadikan referensi.",
    },
    {
      day: "Hari 4",
      format: "Reels",
      idea: "Before-after atau mini case study dari produk/proyek yang paling mudah divisualkan.",
      formatGuide: "Video 15-30 detik. Buka dengan hasil akhir, lanjut before/process, tutup dengan detail hasil dan CTA lihat profil.",
      action: "Tampilkan hasil di awal, baru proses. Tutup dengan CTA klik profil atau DM.",
      reason: "Before-after cepat memberi bukti visual, sehingga audiens tidak perlu membaca panjang untuk memahami value.",
      impact: "Mendorong profile activity dari user yang tertarik melihat portfolio lebih lanjut.",
    },
    {
      day: "Hari 5",
      format: "Story",
      idea: "Q&A singkat dari pertanyaan pelanggan atau objection yang sering muncul.",
      formatGuide: "4-6 frame Story. Frame 1 pertanyaan, frame 2 jawaban pendek, frame 3 bukti/contoh, frame 4 sticker question, frame 5 CTA DM.",
      action: "Pakai 3-5 frame: pertanyaan, jawaban pendek, proof, CTA.",
      reason: "Q&A menurunkan hambatan calon pelanggan karena objection dijawab sebelum mereka harus bertanya langsung.",
      impact: "Membantu konversi soft-selling karena menjawab hambatan sebelum audiens bertanya langsung.",
    },
    {
      day: "Hari 6",
      format: "Feed",
      idea: "Social proof: testimoni, angka pencapaian, atau highlight hasil kerja.",
      formatGuide: "Single image atau 3-slide mini carousel. Visual utama berisi proof, caption 80-150 kata dengan problem, action, result.",
      action: "Gunakan caption storytelling pendek dengan struktur problem, action, result.",
      reason: "Feed cocok untuk trust building karena tampil lebih stabil di profil dan mudah dipakai sebagai portfolio ringkas.",
      impact: "Memperkuat trust dan memberi bahan remarketing organik untuk audiens baru.",
    },
    {
      day: "Hari 7",
      format: "Reels",
      idea: "Recap mingguan: kompilasi 3 momen terbaik atau 3 insight paling berguna.",
      formatGuide: "Video 20-35 detik. Buat 3 segmen cepat masing-masing 5-8 detik, gunakan teks nomor 1-3, tutup dengan CTA follow/save.",
      action: "Edit cepat, gunakan audio yang relevan, dan arahkan ke post terbaik minggu ini.",
      reason: "Recap memperpanjang umur konten lama dan membantu audiens baru menangkap value akun dalam waktu singkat.",
      impact: "Memperpanjang umur konten yang sudah bagus dan membantu followers menangkap value utama minggu itu.",
    },
  ];
  const aiContentIdeas = instagramInsights?.contentBrief?.items?.length === 7
    ? instagramInsights.contentBrief.items
    : [];
  const contentIdeas = aiContentIdeas.length ? aiContentIdeas : fallbackContentIdeas;
  const contentBriefSource = aiContentIdeas.length ? instagramInsights?.contentBrief?.source || "alibaba" : "local";
  const contentBriefSummary = aiContentIdeas.length
    ? instagramInsights?.contentBrief?.summary
    : `Fokus ke ${bestContentType?.type || "Reels"} di ${bestTimeSlots[0]?.label || "jam performa terbaik"}.`;
  const selectedContentIdea = contentIdeas[Math.min(selectedContentIdeaIndex, contentIdeas.length - 1)] || contentIdeas[0];
  const handleGenerateReferenceBrief = async () => {
    if (!topContentReferences.length) return;

    setIsReferenceBriefGenerating(true);
    setReferenceBriefError("");

    try {
      const result = await generateReferenceBrief({
        account: {
          username: connectedInstagram?.username ? `@${connectedInstagram.username}` : profile?.username,
          name: profile?.name,
          biography: profile?.biography,
          followers: profile?.followers_count,
          website: profile?.website,
        },
        mainRecommendation: contentBriefSummary,
        selectedBrief: selectedContentIdea,
        references: topContentReferences.map((item) => ({
          id: item.media.id,
          sourceType: item.sourceType,
          contentType: item.contentType,
          caption: item.media.caption || "",
          reasoning: item.reasoning,
          hook: item.hook,
          style: item.style,
          action: item.action,
          pillar: item.pillar,
          permalink: item.media.permalink,
          reach: item.reach,
          views: item.views,
          engagementRate: item.engagementRate,
        })),
      });
      const blob = new Blob([result.html], { type: "application/msword;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setReferenceBriefError(error instanceof Error ? error.message : "Gagal membuat brief referensi.");
    } finally {
      setIsReferenceBriefGenerating(false);
    }
  };
  const isMarketingLoading = isMetaLoading || isConnectingMeta || isReferenceBriefGenerating;
  const marketingLoadingText = isReferenceBriefGenerating
    ? "Alibaba Model Studio sedang membuat brief referensi..."
    : isConnectingMeta
      ? "Menghubungkan akun Meta..."
      : "Memuat data Instagram dan insight Alibaba...";

  return (
    <ModuleShell
      title="Marketing Integrations"
      description="Pantau performa profil, audiens, dan konten seluruh akun Instagram Business yang terhubung."
      toolbar={
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Filter Instagram Insights</h2>
              <p className="mt-1 text-sm text-slate-500">Pilih akun dan rentang tanggal untuk memuat data dashboard.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button onClick={refreshMetaStatus} disabled={isMetaLoading} className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400">
                {isMetaLoading ? "Memuat data..." : "Refresh data"}
              </button>
              {metaConnected && metaHealth?.source === "env" ? (
                <span className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 text-sm font-semibold text-emerald-700">
                  <Plug className="h-4 w-4" />
                  Token Instagram aktif
                </span>
              ) : (
                <button onClick={handleConnectMeta} disabled={isConnectingMeta} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#115E59] disabled:bg-slate-400">
                  <Plug className="h-4 w-4" />
                  {isConnectingMeta ? "Membuka Meta..." : metaConnected ? "Kelola koneksi" : "Hubungkan Meta"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,1.8fr)_minmax(170px,0.8fr)_minmax(170px,0.8fr)_auto] lg:items-end">
            <div>
              <label htmlFor="instagram-account" className="text-sm font-semibold text-slate-900">Akun Instagram</label>
              <select
                id="instagram-account"
                value={selectedInstagramId}
                onChange={(event) => {
                  setSelectedInstagramId(event.target.value);
                  loadInstagramInsights(event.target.value);
                }}
                disabled={isMetaLoading || !metaHealth?.instagramAccounts.length}
                className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:text-slate-400"
              >
                {!metaHealth?.instagramAccounts.length && <option value="">Belum ada akun Instagram terhubung</option>}
                {metaHealth?.instagramAccounts.map((account) => (
                  <option key={account.id} value={account.id}>@{account.username || account.id} - {account.pageName}</option>
                ))}
              </select>
            </div>
            <label className="text-sm font-semibold text-slate-900">
              Tanggal mulai
              <input
                type="date"
                value={sinceDate}
                max={untilDate}
                onChange={(event) => setSinceDate(event.target.value)}
                className="mt-3 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label className="text-sm font-semibold text-slate-900">
              Tanggal akhir
              <input
                type="date"
                value={untilDate}
                min={sinceDate}
                max={formatDateInput(new Date())}
                onChange={(event) => setUntilDate(event.target.value)}
                className="mt-3 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <button
              onClick={applyDateFilter}
              disabled={isMetaLoading || !selectedInstagramId}
              className="h-12 rounded-lg bg-[#0F766E] px-6 text-sm font-semibold text-white hover:bg-[#115E59] disabled:bg-slate-400"
            >
              Terapkan
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
              Periode aktif: {appliedDateRange.since} sampai {appliedDateRange.until}
            </span>
            <span className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">Maksimal 90 hari</span>
            {dateFilterError && <span className="font-semibold text-rose-600">{dateFilterError}</span>}
          </div>
        </section>
      }
      stats={[
        { label: "Followers", value: formatNumber(profile?.followers_count), detail: connectedInstagram?.username ? `@${connectedInstagram.username}` : "Pilih akun Instagram" },
        { label: "Reach", value: formatNumber(latestReach), detail: "Unique accounts dalam periode" },
        { label: "Impressions", value: formatNumber(impressions), detail: "Total tayangan konten" },
        { label: "Jumlah konten", value: formatNumber(profile?.media_count), detail: `${instagramInsights?.media.length || 0} konten terbaru dimuat` },
      ]}
    >
      <LoadingVideoOverlay visible={isMarketingLoading} text={marketingLoadingText} />
      {(metaError || metaHealth?.error) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          {metaError || metaHealth?.error}
        </div>
      )}
      <SectionCard icon={Brain} title="Social Media AI Agent" description="Analitik dan rangkuman AI dari service Social Media Agent terpisah.">
        {!isSocialAgentConfigured() ? (
          <EmptyState text="Atur VITE_SOSMED_AGENT_BASE_URL untuk mengaktifkan sinkronisasi dan analitik Social Media Agent." />
        ) : isSocialAgentLoading ? (
          <div className="grid gap-3 md:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : socialAgentError ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{socialAgentError}</div>
        ) : socialAgent ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="green">Synced</StatusBadge>
                <span className="text-xs font-semibold text-slate-600">@{socialAgent.account.username}</span>
                <span className="text-xs text-slate-500">UUID {socialAgent.account.id}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{socialAgent.summary.summary || "Ringkasan AI belum tersedia."}</p>
              {socialAgent.summary.key_points?.length ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {socialAgent.summary.key_points.map((point) => <li key={point}>{point}</li>)}
                </ul>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Positive", socialAgent.sentiment.sentiment?.positive, "green" as StatusTone],
                ["Neutral", socialAgent.sentiment.sentiment?.neutral, "slate" as StatusTone],
                ["Negative", socialAgent.sentiment.sentiment?.negative, "red" as StatusTone],
                ["Komentar dianalisis", socialAgent.sentiment.analyzed_comments_count, "blue" as StatusTone],
              ].map(([label, value, tone]) => (
                <div key={String(label)} className="rounded-lg border border-slate-200 p-3">
                  <StatusBadge tone={tone as StatusTone}>{String(label)}</StatusBadge>
                  <p className="mt-2 text-xl font-bold text-slate-950">{label === "Komentar dianalisis" ? formatNumber(value as number) : `${value ?? 0}%`}</p>
                </div>
              ))}
            </div>
            {socialAgent.sentiment.summary ? <p className="text-sm leading-6 text-slate-600">{socialAgent.sentiment.summary}</p> : null}
            <div className="flex flex-wrap gap-2">
              {[...(socialAgent.sentiment.keywords || []), ...(socialAgent.sentiment.suggested_hashtags || [])].map((item) => (
                <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{item}</span>
              ))}
            </div>
          </div>
        ) : <EmptyState text="Data Agent akan dimuat setelah data Instagram tersedia." />}
      </SectionCard>
      <SectionCard icon={Instagram} title="Account / Profile Level" description="Metrik profil dan aktivitas akun Instagram yang dipilih.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {accountMetrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">{metric.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{metric.valueType === "percent" ? formatPercent(metric.value) : formatNumber(metric.value)}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{metric.detail}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={TrendingUp} title="Tren Performa Akun" description="Pergerakan reach, impressions, profile views, dan website clicks berdasarkan periode dari Meta API.">
        {accountTrendData.length ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                {accountTrendSummary.map((metric) => {
                  const isActive = visibleAccountTrendMetrics.includes(metric.key);
                  return (
                    <button
                      key={metric.key}
                      type="button"
                      onClick={() => toggleAccountTrendMetric(metric.key)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${isActive ? "bg-white text-slate-950 ring-slate-300 shadow-sm" : "bg-slate-100 text-slate-500 ring-slate-200"}`}
                    >
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: metric.color }} />
                      {metric.key}: {formatNumber(metric.total)}
                    </button>
                  );
                })}
              </div>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setAccountTrendChartType("line")}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${accountTrendChartType === "line" ? "bg-[#0F766E] text-white" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  Line
                </button>
                <button
                  type="button"
                  onClick={() => setAccountTrendChartType("bar")}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${accountTrendChartType === "bar" ? "bg-[#0F766E] text-white" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  Bar
                </button>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {accountTrendChartType === "line" ? (
                  <LineChart data={accountTrendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} width={55} />
                    <Tooltip contentStyle={{ borderRadius: 10, borderColor: "#E2E8F0" }} formatter={(value) => formatNumber(toNumber(value))} />
                    <Legend />
                    {accountTrendMetricConfig.filter((metric) => visibleAccountTrendMetrics.includes(metric.key)).map((metric) => (
                      <Line key={metric.key} type="monotone" dataKey={metric.key} stroke={metric.color} strokeWidth={metric.key === "Reach" ? 3 : 2} dot={{ r: 3 }} activeDot={{ r: 6 }} connectNulls />
                    ))}
                  </LineChart>
                ) : (
                  <BarChart data={accountTrendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} width={55} />
                    <Tooltip contentStyle={{ borderRadius: 10, borderColor: "#E2E8F0" }} formatter={(value) => formatNumber(toNumber(value))} />
                    <Legend />
                    {accountTrendMetricConfig.filter((metric) => visibleAccountTrendMetrics.includes(metric.key)).map((metric) => (
                      <Bar key={metric.key} dataKey={metric.key} fill={metric.color} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <EmptyState text={isMetaLoading ? "Sedang memuat tren performa..." : "Data tren belum tersedia untuk akun dan periode ini."} />
        )}
      </SectionCard>

      <SectionCard icon={GitCompare} title="Benchmark Kompetitor" description="Bandingkan langsung akun IG pilihan dengan beberapa kompetitor.">
        <div className="mb-4">
          <label className="text-sm font-semibold text-slate-700 block mb-2">
            Username Kompetitor
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {customCompetitorsList.map((username, index) => (
              <span key={index} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                @{username}
                <button type="button" onClick={() => setCustomCompetitorsList(prev => prev.filter((_, i) => i !== index))} className="ml-1 text-slate-400 hover:text-slate-600 text-base font-bold">
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <input 
              value={customCompetitorInput}
              onChange={(e) => setCustomCompetitorInput(e.target.value)}
              placeholder="Ketik username lalu Enter (e.g. awkarin)" 
              className="w-full sm:max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customCompetitorInput.trim()) {
                  const newUsernames = customCompetitorInput.split(",").map(u => u.trim().replace(/^@/, "").toLowerCase()).filter(Boolean);
                  const updatedList = Array.from(new Set([...customCompetitorsList, ...newUsernames]));
                  setCustomCompetitorsList(updatedList);
                  setCustomCompetitorInput("");
                }
              }}
            />
            <button 
              onClick={() => {
                let currentList = customCompetitorsList;
                if (customCompetitorInput.trim()) {
                  const newUsernames = customCompetitorInput.split(",").map(u => u.trim().replace(/^@/, "").toLowerCase()).filter(Boolean);
                  currentList = Array.from(new Set([...customCompetitorsList, ...newUsernames]));
                  setCustomCompetitorsList(currentList);
                  setCustomCompetitorInput("");
                }
                void loadCompetitorBenchmark(selectedInstagramId, appliedDateRange, currentList.length ? currentList : undefined);
              }}
              disabled={isCompetitorLoading || !selectedInstagramId}
              className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:bg-slate-400"
            >
              {isCompetitorLoading ? "Memuat..." : "Bandingkan"}
            </button>
          </div>
        </div>

        {isCompetitorLoading ? (
          <EmptyState text="Sedang memuat benchmark kompetitor dari Meta Business Discovery..." />
        ) : competitorError ? (
          <EmptyState text={competitorError} />
        ) : competitorBenchmark?.setupRequired ? (
          <EmptyState text={competitorBenchmark.message || "Set META_COMPETITOR_USERNAMES untuk menampilkan benchmark kompetitor."} />
        ) : competitorBenchmark?.competitors?.length ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {competitorBenchmark.competitors.slice(0, 4).map((competitor, index) => (
                <div key={competitor.username} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: competitorColors[index % competitorColors.length] }} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-950">@{competitor.username}</p>
                      <p className="text-xs text-slate-500">Public benchmark</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-slate-500">Followers</p>
                      <p className="mt-1 text-base font-bold text-slate-950">{formatNumber(competitor.followersCount)}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-500">Avg eng.</p>
                      <p className="mt-1 text-base font-bold text-[#0F766E]">{formatPercent(competitor.summary.avgEngagementRate)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-950">Interaksi Publik per Tanggal Posting</h3>
                  <p className="mt-1 text-xs text-slate-500">Nilai grafik = {competitorChartMetric === "views" ? "Video views / plays. Views untuk foto tidak dikirim publik oleh Instagram." : "likes + comments. Reach dan impressions kompetitor tidak tersedia sebagai data publik."}</p>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <StatusBadge tone="slate">Public data</StatusBadge>
                  <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                    <button onClick={() => setCompetitorChartMetric("interactions")} className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${competitorChartMetric === "interactions" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Interactions</button>
                    <button onClick={() => setCompetitorChartMetric("views")} className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${competitorChartMetric === "views" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Views (Video)</button>
                  </div>
                </div>
              </div>
              {competitorActivityData.length ? (
                <div className="mt-5 h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={competitorActivityData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={12} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => new Intl.NumberFormat("id-ID").format(Number(v))} />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white/90 backdrop-blur-md p-3 border border-slate-200 shadow-xl rounded-xl">
                                <p className="font-bold text-slate-800 mb-2">{label}</p>
                                <div className="flex flex-col gap-1.5">
                                  {payload.map((entry: any, index: number) => (
                                    <div key={index} className="flex items-center gap-2 text-sm">
                                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                      <span className="text-slate-600 font-medium">{entry.name}:</span>
                                      <span className="text-slate-950 font-bold">{new Intl.NumberFormat("id-ID").format(Number(entry.value))}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }} 
                        cursor={{ fill: '#F1F5F9' }} 
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      {competitorMetricConfig.map((metric) => (
                        <Bar 
                          key={metric.key} 
                          dataKey={metric.key} 
                          fill={metric.color} 
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="mt-5"><EmptyState text="Belum ada posting publik kompetitor dalam periode ini." /></div>
              )}
            </div>

            <DataTable
              columns={["Kompetitor", "Followers", "Media", "Post dimuat", "Avg interaksi/post", "Avg engagement", "Frekuensi"]}
              rows={competitorSummaryRows}
            />
            {competitorBenchmark.warnings?.length ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                {competitorBenchmark.warnings.join(" | ")}
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState text="Belum ada data benchmark kompetitor yang berhasil dimuat." />
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard icon={TrendingUp} title="Online Followers" description="Waktu followers paling aktif untuk membantu penjadwalan konten.">
          {onlineFollowerDisplaySlots.length ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 rounded-lg border border-slate-200 bg-white p-4">
                <MiniBarList
                  items={onlineFollowerDisplaySlots.map((slot, index) => ({
                    label: `${index + 1}. ${slot.label}`,
                    value: slot.value,
                  }))}
                  color={topOnlineFollowerSlots.length ? "bg-[#0F766E]" : "bg-sky-500"}
                />
              </div>
              {onlineFollowerDisplaySlots.map((slot, index) => (
                <MetricPill
                  key={slot.label}
                  label={slot.source === "followers" ? `Jam aktif #${index + 1}` : `Jam performa #${index + 1}`}
                  value={`${slot.label} · ${formatNumber(slot.value)}`}
                />
              ))}
              {topOnlineFollowerSlots.length ? (
                <p className="col-span-2 text-xs leading-5 text-slate-500">Data berdasarkan jam followers aktif dari Meta.</p>
              ) : (
                <p className="col-span-2 text-xs leading-5 text-slate-500">Meta belum mengirim jam aktif followers, jadi ini memakai fallback jam performa terbaik dari konten yang dimuat.</p>
              )}
            </div>
          ) : (
            <EmptyState text={isMetaLoading ? "Sedang memuat jam aktif followers..." : "Data jam aktif followers belum dikirim Meta untuk akun/permission ini."} />
          )}
        </SectionCard>
        <SectionCard icon={BarChart3} title="Audience Demographics" description="Komposisi usia, gender, kota, dan negara followers.">
          <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Usia</p>
              {audience?.demographics?.age?.length ? <MiniBarList items={audience.demographics.age} color="bg-[#0F766E]" maxItems={3} /> : <MetricPill label="Usia" value={demographicAge} />}
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Gender</p>
              {audience?.demographics?.gender?.length ? <MiniBarList items={audience.demographics.gender} color="bg-sky-500" maxItems={3} /> : <MetricPill label="Gender" value={demographicGender} />}
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Kota teratas</p>
              {audience?.demographics?.city?.length ? <MiniBarList items={audience.demographics.city} color="bg-amber-500" maxItems={3} /> : <MetricPill label="Kota teratas" value={demographicCity} />}
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Negara teratas</p>
              {audience?.demographics?.country?.length ? <MiniBarList items={audience.demographics.country} color="bg-pink-500" maxItems={3} /> : <MetricPill label="Negara teratas" value={demographicCountry} />}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricPill label="Usia" value={demographicAge} />
            <MetricPill label="Gender" value={demographicGender} />
            <MetricPill label="Kota teratas" value={demographicCity} />
            <MetricPill label="Negara teratas" value={demographicCountry} />
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Top 3: usia {formatRankedList(audience?.demographics?.age)}, gender {formatRankedList(audience?.demographics?.gender)}, kota {formatRankedList(audience?.demographics?.city)}, negara {formatRankedList(audience?.demographics?.country)}.
          </p>
        </SectionCard>
      </div>

      <SectionCard icon={Image} title="Content / Post Level" description="Performa Feed, Reels, Stories, dan Carousel dari konten terbaru.">
        {contentRows.length ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Filter & urutkan konten</p>
                <p className="mt-1 text-xs text-slate-500">Menampilkan {formatNumber(contentRows.length)} konten berdasarkan pilihan sorting.</p>
              </div>
              <label className="text-sm font-semibold text-slate-900">
                Urutkan data
                <select
                  value={contentSort}
                  onChange={(event) => setContentSort(event.target.value as typeof contentSort)}
                  className="mt-2 w-full min-w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                >
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                  <option value="reach">Reach tertinggi</option>
                  <option value="views">Views tertinggi</option>
                  <option value="engagement">Engagement rate tertinggi</option>
                  <option value="likes">Likes tertinggi</option>
                  <option value="comments">Comments tertinggi</option>
                  <option value="saves">Saves tertinggi</option>
                </select>
              </label>
            </div>
            <div className="hidden lg:block">
              <DataTable columns={["Konten", "Tipe & status", "Performa", "Engagement", "Analisis", "Link"]} rows={contentRows} />
            </div>
            <div className="space-y-3 lg:hidden">
              {sortedContentTableItems.map((item) => {
                const { media, reach, likes, comments, shares, saves, views, engagementRate, reasoning } = item;
                return (
                  <article key={media.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge tone={media.media_type === "VIDEO" ? "blue" : "teal"}>{item.contentType}</StatusBadge>
                        {media.ai_status ? <StatusBadge tone={getStatusTone(media.ai_status)}>{media.ai_status}</StatusBadge> : null}
                        {media.ai_angle ? <StatusBadge tone="teal">{media.ai_angle}</StatusBadge> : null}
                      </div>
                      <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-slate-900">{media.caption || "Konten tanpa caption"}</p>
                      <p className="mt-1 text-xs text-slate-500">{media.timestamp ? new Date(media.timestamp).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Tanggal tidak tersedia"}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-px bg-slate-200">
                      {[
                        ["Reach", reach],
                        ["Views", views],
                        ["Likes", likes],
                        ["Comments", comments],
                        ["Shares", shares],
                        ["Saves", saves],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="bg-white p-3 text-center">
                          <p className="text-[11px] text-slate-500">{label}</p>
                          <p className="mt-1 text-sm font-bold text-slate-900">{formatNumber(value as number)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-500">Engagement rate</p>
                          <p className="mt-1 text-xl font-bold text-[#0F766E]">{formatPercent(engagementRate)}</p>
                        </div>
                        {media.permalink ? (
                          <a className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-[#0F766E]" href={media.permalink} target="_blank" rel="noreferrer">Buka post</a>
                        ) : null}
                      </div>
                      <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <summary className="cursor-pointer text-sm font-semibold text-slate-800">Analisis dan rekomendasi AI</summary>
                        <p className="mt-3 text-xs leading-5 text-slate-600">{reasoning}</p>
                        {media.ai_action ? <p className="mt-2 text-xs font-semibold leading-5 text-[#0F766E]">Aksi: {media.ai_action}</p> : null}
                        <div className="mt-3">
                          <StatusBadge tone={media.ai_reasoning_source && media.ai_reasoning_source !== "local" ? "blue" : "slate"}>
                            {media.ai_reasoning_source && media.ai_reasoning_source !== "local" ? "Sosmed Agent Claude" : "Local"}
                          </StatusBadge>
                        </div>
                      </details>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState text={isMetaLoading ? "Sedang memuat konten Instagram..." : "Belum ada data konten untuk akun yang dipilih."} />
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-slate-950">Perbandingan Konten Terbaru</h2>
          <p className="mt-1 text-sm text-slate-500">Reach dan interaksi dari maksimal delapan konten terbaru.</p>
          {contentChartData.length ? (
            <div className="mt-5 h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contentChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip contentStyle={{ borderRadius: 10, borderColor: "#E2E8F0" }} />
                  <Legend />
                  <Bar dataKey="Reach" fill="#0F766E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Likes" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Comments" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Saves" fill="#DB2777" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-5"><EmptyState text="Belum ada data konten untuk divisualisasikan." /></div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Komposisi Interaksi</h2>
          <p className="mt-1 text-sm text-slate-500">Distribusi engagement seluruh konten yang dimuat.</p>
          {interactionChartData.length ? (
            <div className="mt-5 h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={interactionChartData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                    {interactionChartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, borderColor: "#E2E8F0" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-5"><EmptyState text="Belum ada interaksi untuk divisualisasikan." /></div>
          )}
        </section>
      </div>

      <SectionCard icon={Brain} title="Insight Turunan & Kalkulasi" description="Analisis otomatis dari histori akun dan konten yang sedang dimuat.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">Avg. engagement rate</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{formatPercent(averageEngagementRate)}</p>
            <p className="mt-1 text-xs text-slate-500">Rata-rata dari {engagementRates.length} post dengan data reach</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">Follower growth rate</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{formatPercent(followerGrowthRate)}</p>
            <p className="mt-1 text-xs text-slate-500">{followerGrowth !== undefined && followerStartValue !== undefined ? `${formatNumber(followerGrowth)} / ${formatNumber(followerStartValue)} followers awal` : "Menunggu data follower periode"}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">Best time to post</p>
            <p className="mt-2 text-xl font-bold capitalize text-slate-950">{mediaAnalytics.length >= 3 ? bestTimeSlots[0]?.label || "-" : "-"}</p>
            <p className="mt-1 text-xs text-slate-500">Berdasarkan rata-rata engagement lalu reach</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">Frequency correlation</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{correlationLabel}</p>
            <p className="mt-1 text-xs text-slate-500">Pearson r dari {weeklyMap.size} minggu posting vs engagement</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div>
            <h3 className="font-semibold text-slate-950">Best Time to Post</h3>
            <p className="mt-1 text-sm text-slate-500">Slot waktu memakai zona Asia/Jakarta.</p>
            {mediaAnalytics.length >= 3 && bestTimeSlots.length ? (
              <div className="mt-4 space-y-3">
                {bestTimeSlots.map((slot, index) => (
                  <div key={slot.label} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3">
                    <div>
                      <p className="font-semibold capitalize text-slate-900">#{index + 1} {slot.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{slot.posts} post dalam sampel</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#0F766E]">{formatPercent(slot.averageEngagement)}</p>
                      <p className="text-xs text-slate-500">Avg reach {formatNumber(slot.averageReach)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4"><EmptyState text="Minimal tiga konten bertanggal diperlukan untuk rekomendasi waktu posting." /></div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-slate-950">Content Type Performance</h3>
            <p className="mt-1 text-sm text-slate-500">Perbandingan Reels, Feed, Carousel, dan Story.</p>
            <div className="mt-4">
              {contentTypePerformance.length ? (
                <DataTable
                  columns={["Tipe", "Post", "Avg. reach", "Avg. engagement"]}
                  rows={contentTypePerformance.map((item) => [
                    <StatusBadge tone={item.type === "Reels" ? "blue" : "teal"}>{item.type}</StatusBadge>,
                    formatNumber(item.posts),
                    formatNumber(item.averageReach),
                    formatPercent(item.averageEngagement),
                  ])}
                />
              ) : (
                <EmptyState text="Belum ada tipe konten untuk dibandingkan." />
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-slate-950">Hashtag Performance</h3>
          <p className="mt-1 text-sm text-slate-500">Dihitung lokal dari hashtag pada caption konten, karena Meta API tidak menyediakan insight hashtag langsung.</p>
          <div className="mt-4">
            {hashtagPerformance.length ? (
              <DataTable
                columns={["Hashtag", "Dipakai", "Avg. reach", "Avg. engagement"]}
                rows={hashtagPerformance.map((item) => [
                  <span className="font-semibold text-[#0F766E]">{item.hashtag}</span>,
                  `${item.posts} post`,
                  formatNumber(item.averageReach),
                  formatPercent(item.averageEngagement),
                ])}
              />
            ) : (
              <EmptyState text="Caption konten yang dimuat belum memiliki hashtag untuk dianalisis." />
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={BarChart3} title="Video, Reels & Stories" description="Metrik khusus video, Reels, dan Stories yang tersedia dari konten akun terpilih.">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <MetricPill label="Video views" value={formatNumber(videoViews)} />
          <MetricPill label="Video/Reels loaded" value={formatNumber(videoMedia.length)} />
          <MetricPill label="Reels plays" value={formatNumber(reelsPlays)} />
          <MetricPill label="Stories loaded" value={formatNumber(storyMedia.length)} />
          <MetricPill label="Profile activity" value={formatNumber(profileActivityFromVideo)} />
          <MetricPill label="Avg. watch time" value={averageWatchTime} />
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Views, plays, profile activity, dan watch time dibaca per konten. Stories hanya menampilkan konten yang masih aktif dan dapat diakses oleh Meta API.
        </p>
      </SectionCard>

      <SectionCard icon={Sparkles} title="AI Content Brief 7 Hari" description="Rencana konten sederhana: lihat rekomendasi utama, ikuti checklist, lalu eksekusi kalender 7 hari.">
        <div className="space-y-6">
          {instagramInsights?.warnings?.some((warning) => warning.toLowerCase().includes("alibaba")) ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Alibaba Model Studio belum berhasil dipakai.</p>
              <p className="mt-1">{instagramInsights.warnings.filter((warning) => warning.toLowerCase().includes("alibaba")).join(" ")}</p>
            </div>
          ) : null}

          <div className="rounded-xl border border-teal-100 bg-teal-50 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#0F766E]">Rekomendasi utama</p>
                  <StatusBadge tone={contentBriefSource !== "local" ? "blue" : "slate"}>{contentBriefSource !== "local" ? "Alibaba" : "Local"}</StatusBadge>
                </div>
                <h3 className="mt-1 text-xl font-bold text-slate-950">
                  {contentBriefSummary}
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Pakai konten referensi terbaik sebagai pola: hook cepat, visual jelas, caption singkat, dan CTA yang meminta komentar, save, atau DM.
                </p>
                {selectedInstagramId && (
                  <button
                    onClick={() => loadInstagramInsights(selectedInstagramId, appliedDateRange, true)}
                    disabled={isMetaLoading}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#115E59] disabled:bg-slate-300 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {isMetaLoading ? "Memperbarui..." : "Perbarui AI Brief (Regenerate)"}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:min-w-80">
                <MetricPill label="Avg engagement" value={formatPercent(averageEngagementRate)} />
                <MetricPill label="Referensi" value={formatNumber(topContentReferences.length)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {contentIdeas.slice(0, 3).map((idea, index) => (
              <div key={`summary-${idea.day}`} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={contentBriefSource !== "local" ? "blue" : "slate"}>{contentBriefSource !== "local" ? "Alibaba" : "Local"}</StatusBadge>
                  {idea.status && (
                    <StatusBadge tone={idea.status === "Proven" ? "green" : "yellow"}>{idea.status}</StatusBadge>
                  )}
                  <span className="text-xs font-semibold text-slate-500">{idea.day}</span>
                </div>
                <p className="mt-3 text-sm font-bold text-slate-950">{index + 1}. {idea.format}</p>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{idea.ide_utama || idea.idea}</p>
                {idea.objective ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{idea.objective}</p> : null}
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-950">Kalender Konten 7 Hari</h3>
              <p className="mt-1 text-sm text-slate-500">Pilih hari untuk melihat brief detail. Ini lebih enak dipakai saat meeting atau eksekusi harian.</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
                  {contentIdeas.map((idea, index) => {
                    const isSelected = selectedContentIdeaIndex === index;

                    return (
                      <button
                        key={idea.day}
                        type="button"
                        onClick={() => setSelectedContentIdeaIndex(index)}
                        className={`rounded-lg border px-3 py-3 text-left transition ${isSelected ? "border-[#0F766E] bg-teal-50 shadow-sm" : "border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50"}`}
                      >
                        <span className={`text-xs font-semibold ${isSelected ? "text-[#0F766E]" : "text-slate-500"}`}>{idea.day}</span>
                        <span className="mt-1 block text-sm font-bold text-slate-950">{idea.format}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={selectedContentIdea.format === "Reels" ? "blue" : selectedContentIdea.format === "Story" ? "yellow" : "teal"}>{selectedContentIdea.day}</StatusBadge>
                        {selectedContentIdea.status && (
                          <StatusBadge tone={selectedContentIdea.status === "Proven" ? "green" : "yellow"}>{selectedContentIdea.status}</StatusBadge>
                        )}
                      </div>
                      <h4 className="mt-3 text-xl font-bold text-slate-950">{selectedContentIdea.format}</h4>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Siap dieksekusi</span>
                      <p className="mt-2 text-xs text-slate-500">Hari {selectedContentIdeaIndex + 1} dari {contentIdeas.length}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ide utama</p>
                    <p className="mt-2 text-base font-semibold leading-7 text-slate-950">{selectedContentIdea.ide_utama || selectedContentIdea.idea}</p>
                  </div>

                  {(selectedContentIdea.content_pillar || selectedContentIdea.pillar || selectedContentIdea.objective) && (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {(selectedContentIdea.content_pillar || selectedContentIdea.pillar) && (
                        <div className="rounded-lg border border-slate-200 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Content pillar</p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{selectedContentIdea.content_pillar || selectedContentIdea.pillar}</p>
                        </div>
                      )}
                      {selectedContentIdea.objective && (
                        <div className="rounded-lg border border-slate-200 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{selectedContentIdea.objective}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Format eksekusi</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{selectedContentIdea.format_eksekusi || selectedContentIdea.formatGuide}</p>
                    </div>
                    <div className="rounded-lg border border-sky-100 bg-sky-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Kenapa format ini</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{selectedContentIdea.kenapa_format_ini || selectedContentIdea.reason}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Yang dilakukan</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{selectedContentIdea.yang_dilakukan || selectedContentIdea.action}</p>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Dampaknya</p>
                      <p className="mt-2 text-sm leading-6 text-emerald-800">{selectedContentIdea.dampaknya || selectedContentIdea.impact}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedContentIdeaIndex((current) => Math.max(0, current - 1))}
                      disabled={selectedContentIdeaIndex === 0}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Sebelumnya
                    </button>
                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            void handleGenerateContent(val);
                            e.target.value = "";
                          }
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                        defaultValue=""
                      >
                        <option value="" disabled>Buat konten dengan AI...</option>
                        <option value="ikutin">Ikutin jenis konten ini ({selectedContentIdea.format})</option>
                        <option value="artikel">Buat jadi artikel</option>
                        <option value="reels">Buat jadi Reels</option>
                        <option value="story">Buat jadi Story</option>
                        <option value="carousel">Buat jadi Carousel</option>
                        <option value="feed">Buat jadi Feed</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setSelectedContentIdeaIndex((current) => Math.min(contentIdeas.length - 1, current + 1))}
                        disabled={selectedContentIdeaIndex === contentIdeas.length - 1}
                        className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-950">Referensi Terbaik</h3>
                  <p className="mt-1 text-sm text-slate-500">Pakai ini sebagai contoh hook dan gaya konten.</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateReferenceBrief}
                  disabled={!topContentReferences.length || isReferenceBriefGenerating}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <FileText className="h-4 w-4" />
                  {isReferenceBriefGenerating ? "Membuat brief..." : "Generate brief Word"}
                </button>
              </div>
              {referenceBriefError ? (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {referenceBriefError}
                </div>
              ) : null}
              {topContentReferences.length ? (
                <div className="mt-4 space-y-3">
                  {topContentReferences.map((item, index) => (
                    <details key={item.media.id} open={index === 0} className="group min-w-0 rounded-lg border border-slate-200 bg-white">
                      <summary className="flex cursor-pointer list-none flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <StatusBadge tone={index === 0 ? "green" : "teal"}>{`Ref ${index + 1}`}</StatusBadge>
                          <StatusBadge tone={item.media.ai_reasoning_source && item.media.ai_reasoning_source !== "local" ? "blue" : "slate"}>{item.media.ai_reasoning_source && item.media.ai_reasoning_source !== "local" ? "Alibaba" : "Local"}</StatusBadge>
                          <span className="min-w-0 text-sm font-semibold text-slate-900">{item.contentType}</span>
                          <span className="text-xs text-slate-500">{item.media.timestamp ? new Date(item.media.timestamp).toLocaleDateString("id-ID") : "-"}</span>
                        </div>
                        <span className="text-xs font-semibold text-[#0F766E] group-open:hidden sm:shrink-0">Lihat</span>
                        <span className="hidden text-xs font-semibold text-slate-500 group-open:inline sm:shrink-0">Tutup</span>
                      </summary>
                      <div className="border-t border-slate-100 px-3 pb-3">
                        <p className="mt-3 line-clamp-4 break-words text-sm font-medium text-slate-900">{item.media.caption || "Konten tanpa caption"}</p>
                        {item.sourceType === "custom" ? (
                          <div className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
                            {item.hook ? <p><span className="font-semibold text-slate-900">Hook:</span> {item.hook}</p> : null}
                            {item.style ? <p><span className="font-semibold text-slate-900">Style:</span> {item.style}</p> : null}
                            {item.action ? <p><span className="font-semibold text-slate-900">Adaptasi:</span> {item.action}</p> : null}
                            {item.pillar ? <StatusBadge tone="teal">{item.pillar}</StatusBadge> : null}
                          </div>
                        ) : (
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">Reach {formatNumber(item.reach)}</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">Views {formatNumber(item.views)}</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">Likes {formatNumber(item.likes)}</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">Saves {formatNumber(item.saves)}</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">Eng. {formatPercent(item.engagementRate)}</span>
                          </div>
                        )}
                        <p className="mt-3 break-words text-xs leading-5 text-slate-600">{item.reasoning}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {item.media.permalink ? (
                            <a className="inline-flex h-9 items-center text-sm font-semibold text-[#0F766E] hover:underline" href={item.media.permalink} target="_blank" rel="noreferrer">
                              {item.sourceType === "custom" ? "Buka link referensi" : "Buka referensi"}
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleGenerateContent("ikutin", item)}
                            disabled={isGeneratingContent}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 text-sm font-semibold text-[#0F766E] hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Sparkles className="h-4 w-4" />
                            Hasilkan konten
                          </button>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <EmptyState text="Belum ada konten referensi. Muat data Instagram atau pilih akun lain untuk membuat brief yang lebih akurat." />
              )}

            </div>
          </div>
        </div>
      </SectionCard>

      {instagramInsights?.warnings?.length ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Sebagian metrik belum dapat dimuat dari Meta API.</p>
          <p className="mt-1">{instagramInsights.warnings.join(" ")}</p>
        </div>
      ) : null}

      {/* AI CONTENT GENERATOR MODAL */}
      {contentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="flex h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#0F766E] px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/10 p-2">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">GMT AI Content Writer</h3>
                  <p className="text-xs text-teal-100">
                    {contentGenerationSource === "reference"
                      ? "Dibuat otomatis dari kartu Referensi Terbaik"
                      : `Dibuat otomatis dari Brief Kalender Konten Hari ${selectedContentIdeaIndex + 1}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setContentModalOpen(false)}
                className="rounded-lg p-1.5 text-teal-50 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Tutup modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isGeneratingContent ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 py-20 text-center">
                  <video
                    src="/imgloading/4067125821-preview.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-32 w-32 rounded-xl object-cover shadow-lg"
                  />
                  <div>
                    <h4 className="text-base font-bold text-slate-900 animate-pulse">Menghasilkan Konten dengan AI...</h4>
                    <p className="mt-2 text-sm text-slate-500 max-w-md">Alibaba Model Studio sedang merancang draf visual, copywriting, dan struktur konten terbaik untuk Anda.</p>
                  </div>
                </div>
              ) : contentGenError ? (
                <div className="flex h-full flex-col items-center justify-center py-20 text-center">
                  <div className="rounded-full bg-rose-50 p-4 text-rose-600">
                    <AlertCircle className="h-10 w-10" />
                  </div>
                  <h4 className="mt-4 text-base font-bold text-slate-900">Gagal Menghasilkan Konten</h4>
                  <p className="mt-2 text-sm text-slate-500 max-w-md">{contentGenError}</p>
                  <button
                    onClick={() => handleGenerateContent("ikutin")}
                    className="mt-6 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59]"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : generatedContent ? (
                <div className="space-y-6">
                  {/* Title & Format Info */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <span className="inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-[#0F766E] ring-1 ring-teal-200 capitalize">
                        {generatedContent.contentType}
                      </span>
                      <h4 className="mt-2 text-xl font-extrabold text-slate-900">{generatedContent.title}</h4>
                    </div>
                  </div>

                  {/* Caption Card (if provided) */}
                  {generatedContent.caption && (generatedContent.caption.hook || generatedContent.caption.body) && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Copywriting Caption / Deskripsi</h5>
                      <div className="bg-white rounded-lg border border-slate-200 p-4 text-sm font-medium text-slate-800 space-y-3 shadow-inner">
                        {generatedContent.caption.hook && (
                          <p className="font-bold text-[#0F766E] border-b border-slate-100 pb-2">
                            {generatedContent.caption.hook}
                          </p>
                        )}
                        {generatedContent.caption.body && (
                          <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                            {generatedContent.caption.body}
                          </p>
                        )}
                        {generatedContent.caption.cta && (
                          <p className="font-semibold text-blue-600 border-t border-slate-100 pt-2">
                            {generatedContent.caption.cta}
                          </p>
                        )}
                        {generatedContent.caption.hashtags?.length > 0 && (
                          <p className="text-slate-500 text-xs font-semibold">
                            {generatedContent.caption.hashtags.join(" ")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Format-Specific Content Outputs */}
                  {generatedContent.contentType === "artikel" && generatedContent.content?.article && (
                    <div className="rounded-xl border border-slate-200 p-5">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Draf Artikel SEO (Markdown)</h5>
                      <div className="max-h-[300px] overflow-y-auto bg-slate-950 text-slate-100 rounded-lg p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-inner">
                        {generatedContent.content.article}
                      </div>
                    </div>
                  )}

                  {/* Reels / Video script */}
                  {(generatedContent.contentType === "reels" || generatedContent.contentType === "reals" || generatedContent.contentType === "video") && generatedContent.content?.script?.length > 0 && (
                    <div className="rounded-xl border border-slate-200 p-5">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Script & Storyboard Video</h5>
                      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-inner">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                              <th className="p-3 w-16">Durasi</th>
                              <th className="p-3 w-1/3">Deskripsi Visual</th>
                              <th className="p-3 w-1/3">Voice Over / Audio</th>
                              <th className="p-3">Teks di Layar</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                            {generatedContent.content.script.map((scene, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-3 font-bold text-[#0F766E]">{scene.timecode || "-"}</td>
                                <td className="p-3 whitespace-pre-wrap">{scene.visual || "-"}</td>
                                <td className="p-3 whitespace-pre-wrap">{scene.voiceOver || "-"}</td>
                                <td className="p-3 whitespace-pre-wrap">{scene.onScreenText || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Story frames */}
                  {generatedContent.contentType === "story" && generatedContent.content?.storyFrames?.length > 0 && (
                    <div className="rounded-xl border border-slate-200 p-5">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Frame Story Sequence</h5>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {generatedContent.content.storyFrames.map((frame, idx) => (
                          <div key={idx} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3 flex flex-col justify-between">
                            <div>
                              <span className="inline-flex rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                Frame {frame.frame || idx + 1}
                              </span>
                              <p className="mt-2 text-xs font-bold text-slate-800">{frame.visual || "No visual direction"}</p>
                            </div>
                            <div className="border-t border-slate-100 pt-2 space-y-2">
                              {frame.text && (
                                <p className="text-[11px] text-slate-600 italic">Teks: "{frame.text}"</p>
                              )}
                              {frame.stickerOrCta && (
                                <p className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 rounded px-2 py-1 inline-block">
                                  🔗 {frame.stickerOrCta}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Carousel slides */}
                  {generatedContent.contentType === "carousel" && generatedContent.content?.carouselSlides?.length > 0 && (
                    <div className="rounded-xl border border-slate-200 p-5">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Slide Outline Carousel</h5>
                      <div className="space-y-3">
                        {generatedContent.content.carouselSlides.map((slide, idx) => (
                          <div key={idx} className="flex gap-4 rounded-lg border border-slate-100 p-3.5 bg-slate-50/50 hover:bg-slate-50 transition">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 font-bold text-xs text-[#0F766E]">
                              {slide.slide || idx + 1}
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-900">{slide.headline || "-"}</p>
                              <p className="text-xs text-slate-500"><span className="font-semibold text-slate-600">Visual:</span> {slide.visual || "-"}</p>
                              {slide.copy && (
                                <p className="text-xs text-slate-600 bg-white border border-slate-100 rounded p-2 mt-1 leading-relaxed whitespace-pre-wrap">{slide.copy}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata cards */}
                  {generatedContent.metadata && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {generatedContent.metadata.visualDirection && (
                        <div className="rounded-xl border border-slate-200 p-5 bg-teal-50/10">
                          <h5 className="text-xs font-semibold uppercase tracking-wider text-teal-800 mb-2">Arahan Visual & Mood</h5>
                          <p className="text-xs leading-5 text-slate-700 font-medium">{generatedContent.metadata.visualDirection}</p>
                        </div>
                      )}
                      {generatedContent.metadata.shotList?.length > 0 && (
                        <div className="rounded-xl border border-slate-200 p-5 bg-sky-50/10">
                          <h5 className="text-xs font-semibold uppercase tracking-wider text-sky-800 mb-2">Daftar Pengambilan Gambar (Shot List)</h5>
                          <ul className="list-disc pl-4 text-xs space-y-1 text-slate-600 font-medium">
                            {generatedContent.metadata.shotList.map((shot, idx) => (
                              <li key={idx}>{shot}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Checklists */}
                  {generatedContent.metadata?.publishChecklist?.length > 0 && (
                    <div className="rounded-xl border border-slate-200 p-5">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Publish QA Checklist</h5>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {generatedContent.metadata.publishChecklist.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                            <CheckCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center py-20 text-center text-slate-400">
                  Belum ada data konten.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-2">
                {generatedContent && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = getCopyableText(generatedContent);
                        await navigator.clipboard.writeText(text);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      } catch (err) {
                        alert("Gagal menyalin ke clipboard.");
                      }
                    }}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      isCopied ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    <CheckCheck className={`h-4 w-4 transition-transform ${isCopied ? "scale-100" : "scale-0 w-0"}`} />
                    {isCopied ? "Tersalin!" : "Salin Teks"}
                  </button>
                )}
                  {generatedContent && (
                    <button
                      type="button"
                      onClick={() => {
                      setIsSavedToCms(true);
                      setTimeout(() => setIsSavedToCms(false), 3000);
                    }}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      isSavedToCms ? "bg-emerald-600 text-white" : "bg-[#0F766E] text-white hover:bg-[#115E59]"
                    }`}
                    >
                      <CheckCircle className={`h-4 w-4 transition-transform ${isSavedToCms ? "scale-100" : "scale-0 w-0"}`} />
                      {isSavedToCms ? "Sukses Tersimpan di CMS!" : "Simpan ke Draf CMS"}
                    </button>
                  )}
                {generatedContent && (
                  <button
                    type="button"
                    onClick={handleAutoPostGeneratedContent}
                    disabled={isAutoPosting}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    <Instagram className="h-4 w-4" />
                    {isAutoPosting ? "Mem-posting..." : "Auto post IG"}
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1 text-xs font-medium">
                {autoPostMessage ? <p className="break-words text-emerald-700">{autoPostMessage}</p> : null}
                {autoPostError ? <p className="break-words text-rose-700">{autoPostError}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => setContentModalOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}
    </ModuleShell>
  );
}

export function ArticleManagement() {
  return (
    <ModuleShell
      title="Article / CMS Management"
      description="Kelola artikel lintas website dengan rich text editor, SEO preview, jadwal publish, multi website publish, dan approval Writer -> SEO -> Manager."
      action="Buat artikel"
      stats={[
        { label: "Draft", value: "38", detail: "Menunggu writer update" },
        { label: "Review", value: "24", detail: "SEO dan manager queue" },
        { label: "Scheduled", value: "17", detail: "Publish otomatis" },
        { label: "Published", value: "126", detail: "Bulan Mei 2026" },
      ]}
    >
      <DataTable
        columns={["Judul", "Website", "Writer", "Workflow", "SEO Score", "Publish"]}
        rows={[
          ["Panduan memilih lampu panggung", "gmtlighting.id", "Dewi", <StatusBadge tone="blue">SEO Review</StatusBadge>, "92", "22 Mei 2026"],
          ["Checklist safety rigging", "gmttruss.id", "Rafi", <StatusBadge tone="yellow">Manager Approval</StatusBadge>, "87", "Scheduled"],
          ["Agenda training audio visual", "gmttraining.id", "Nadia", <StatusBadge tone="slate">Draft</StatusBadge>, "74", "Draft"],
        ]}
      />
    </ModuleShell>
  );
}

export function EventManagement() {
  return (
    <ModuleShell
      title="Event Management"
      description="Manajemen event dua arah dengan Google Calendar, multiple calendar, recurring event, dan calendar view month/week/agenda."
      action="Tambah event"
      stats={[
        { label: "Upcoming event", value: "34", detail: "Meeting, interview, training" },
        { label: "Calendar sync", value: "6", detail: "Google Calendar aktif" },
        { label: "Recurring", value: "14", detail: "Event rutin terjadwal" },
        { label: "Pending approval", value: "11", detail: "Butuh manager approval" },
      ]}
    >
      <DataTable
        columns={["Event", "Jenis", "Calendar", "Tanggal", "Status", "Peserta"]}
        rows={[
          ["Project deadline website GMT Training", "Deadline project", "Project Calendar", "21 Mei 2026", <StatusBadge tone="yellow">Approval</StatusBadge>, "8"],
          ["Interview SEO Specialist", "Interview", "HR Calendar", "23 Mei 2026", <StatusBadge tone="green">Synced</StatusBadge>, "4"],
          ["Client visit Bandung Expo", "Client visit", "Sales Calendar", "27 Mei 2026", <StatusBadge tone="blue">Recurring</StatusBadge>, "18"],
        ]}
      />
    </ModuleShell>
  );
}

export function ParticipantManagement() {
  return (
    <ModuleShell
      title="Event Participant Management"
      description="Kelola registrasi peserta, approve/reject, notifikasi email/WhatsApp, QR check-in, dan attendance analytics."
      action="Buka form registrasi"
      stats={[
        { label: "Pending", value: "82", detail: "Menunggu validasi" },
        { label: "Approved", value: "214", detail: "Siap dikirimi QR" },
        { label: "Checked-in", value: "684", detail: "Attendance bulan ini" },
        { label: "Rejected", value: "31", detail: "Duplikat/tidak valid" },
      ]}
    >
      <FeatureGrid
        features={[
          { icon: QrCode, title: "QR Check-in", text: "QR unik per peserta untuk validasi hadir di lokasi event." },
          { icon: Mail, title: "Email Notification", text: "Kirim status approve, reject, reminder, dan tiket event otomatis." },
          { icon: Smartphone, title: "WhatsApp Notification", text: "Reminder H-1 dan update status peserta lewat kanal WhatsApp." },
        ]}
      />
      <DataTable
        columns={["Peserta", "Event", "Status", "Kontak", "Action"]}
        rows={[
          ["Ayu Prameswari", "Training Lighting Basic", <StatusBadge tone="yellow">Pending</StatusBadge>, "ayu@email.com", "Approve / Reject"],
          ["Rizky Hidayat", "Client visit Bandung Expo", <StatusBadge tone="green">Checked-in</StatusBadge>, "+62 812 0000", "View QR"],
          ["Sinta Lestari", "Interview SEO Specialist", <StatusBadge tone="blue">Approved</StatusBadge>, "sinta@email.com", "Send reminder"],
        ]}
      />
    </ModuleShell>
  );
}

export function NotificationCenter() {
  return (
    <ModuleShell
      title="Notification Center"
      description="Reminder otomatis untuk ranking turun, artikel perlu approval, event H-1, dan SEO issue alert melalui in-app, email, dan WhatsApp."
      action="Buat rule"
      stats={[
        { label: "Unread", value: "19", detail: "Butuh respons hari ini" },
        { label: "SEO alerts", value: "8", detail: "Ranking turun dan issue" },
        { label: "Approval alerts", value: "13", detail: "Artikel dan event" },
        { label: "Channels", value: "3", detail: "In-app, email, WhatsApp" },
      ]}
    >
      <DataTable
        columns={["Notifikasi", "Trigger", "Channel", "Prioritas", "Status"]}
        rows={[
          ["Keyword 'sewa truss jakarta' turun 2 posisi", "SEO ranking turun", "In-app, Email", <StatusBadge tone="red">High</StatusBadge>, "Open"],
          ["Artikel perlu approval manager", "Workflow approval", "In-app", <StatusBadge tone="yellow">Medium</StatusBadge>, "Open"],
          ["Reminder event H-1", "Calendar schedule", "WhatsApp, Email", <StatusBadge tone="blue">Normal</StatusBadge>, "Queued"],
        ]}
      />
    </ModuleShell>
  );
}

export function UserRoleManagement() {
  return (
    <ModuleShell
      title="User & Role Management"
      description="RBAC untuk Super Admin, SEO Team, Content Team, HR, dan Manager dengan hak akses berbeda per modul dan per website."
      action="Tambah user"
      stats={[
        { label: "Users", value: "64", detail: "Aktif di dashboard" },
        { label: "Roles", value: "5", detail: "Super Admin sampai HR" },
        { label: "Website access", value: "56", detail: "Permission per domain" },
        { label: "Approval owners", value: "9", detail: "Manager dan SEO lead" },
      ]}
    >
      <DataTable
        columns={["Role", "Website", "SEO", "Artikel", "Event", "User"]}
        rows={[
          ["Super Admin", "Full", "Full", "Full", "Full", "Manage"],
          ["SEO Team", "Assigned", "Full", "Review", "Read", "Read"],
          ["Content Team", "Assigned", "Checklist", "Create/Edit", "Read", "Read"],
          ["HR", "Training site", "Read", "Read", "Full", "Read"],
          ["Manager", "Assigned", "Approve", "Approve", "Approve", "Read"],
        ]}
      />
    </ModuleShell>
  );
}

export function MediaLibrary() {
  return (
    <ModuleShell
      title="Media Library"
      description="Pusat asset image, PDF, video, dan brochure dengan compress image, tagging, versioning, dan CDN."
      action="Upload asset"
      stats={[
        { label: "Images", value: "2,840", detail: "WebP dan JPG" },
        { label: "PDF/Brochure", value: "416", detail: "Company profile dan katalog" },
        { label: "Videos", value: "128", detail: "Event dan product demo" },
        { label: "CDN usage", value: "1.8 TB", detail: "Bulan berjalan" },
      ]}
    >
      <FeatureGrid
        features={[
          { icon: Image, title: "Compress Image", text: "Optimasi ukuran asset untuk performa website tanpa mengubah workflow editor." },
          { icon: FileArchive, title: "Versioning", text: "Simpan riwayat file, revisi brochure, dan asset campaign per versi." },
          { icon: Upload, title: "CDN Publishing", text: "Push asset terpilih ke CDN untuk dipakai lintas website GMT Group." },
        ]}
      />
    </ModuleShell>
  );
}

export function TaskWorkflow() {
  return (
    <ModuleShell
      title="Task & Workflow"
      description="Task management internal untuk SEO issue, artikel, event, dan pekerjaan operasional dengan status Todo -> Review -> Done."
      action="Tambah task"
      stats={[
        { label: "Todo", value: "47", detail: "Belum dikerjakan" },
        { label: "Review", value: "18", detail: "Menunggu approval" },
        { label: "Done", value: "112", detail: "Bulan ini" },
        { label: "Overdue", value: "6", detail: "Butuh eskalasi" },
      ]}
    >
      <DataTable
        columns={["Task", "Owner", "Module", "Status", "Due"]}
        rows={[
          ["Update artikel lampu panggung", "Dewi", "Article CMS", <StatusBadge tone="yellow">Review</StatusBadge>, "20 Mei 2026"],
          ["Fix broken link gmttruss.id", "Bima", "SEO Audit", <StatusBadge tone="slate">Todo</StatusBadge>, "21 Mei 2026"],
          ["Approve peserta training", "Nadia", "Participant", <StatusBadge tone="green">Done</StatusBadge>, "19 Mei 2026"],
        ]}
      />
    </ModuleShell>
  );
}

export function Reporting() {
  return (
    <ModuleShell
      title="Reporting"
      description="Export SEO report, Ads report, Instagram performance, keyword report, event attendance, article performance, dan AI summary ke PDF/Excel."
      action="Generate report"
      stats={[
        { label: "Scheduled reports", value: "16", detail: "Auto email mingguan/bulanan" },
        { label: "PDF exports", value: "92", detail: "SEO, Ads, social, AI summary" },
        { label: "Excel exports", value: "74", detail: "Keyword, Ads, GSC, attendance" },
        { label: "Recipients", value: "38", detail: "Manager dan PIC website" },
      ]}
    >
      <FeatureGrid
        features={[
          { icon: FileText, title: "SEO Report", text: "Health score, technical issue, organic traffic, GSC/GA4 metric, dan rekomendasi." },
          { icon: Megaphone, title: "Ads Report", text: "Spend, CPC, CTR, conversion, ROAS, campaign trend, dan rekomendasi budget." },
          { icon: Instagram, title: "Instagram Report", text: "Reach, engagement, follower growth, top content, dan campaign attribution." },
          { icon: FileSpreadsheet, title: "Keyword Report", text: "Ranking movement, search volume, CTR, target page, dan competitor compare." },
          { icon: CalendarCheck, title: "Event Attendance", text: "Registrasi, approval, QR check-in, no-show, dan attendance analytics." },
          { icon: Target, title: "AI Marketing Summary", text: "Ringkasan peluang, risiko, action priority, dan kebutuhan campaign berikutnya." },
        ]}
      />
    </ModuleShell>
  );
}
