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
  fetchMetaAccounts,
  fetchMetaAuthUrl,
  type InstagramInsights,
  type MetaAccountHealth,
} from "../services/metaIntegrations";
import { fetchKeywordResearch, type KeywordResearchResponse } from "../services/seoIntegrations";
import { fetchWebsiteAnalytics, type WebsiteAnalyticsResponse } from "../services/websiteAnalytics";

type StatusTone = "green" | "yellow" | "red" | "blue" | "slate" | "teal";

const toneClasses: Record<StatusTone, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  yellow: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
};

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
  const [metaHealth, setMetaHealth] = useState<MetaAccountHealth | null>(null);
  const [instagramInsights, setInstagramInsights] = useState<InstagramInsights | null>(null);
  const [selectedInstagramId, setSelectedInstagramId] = useState("");
  const [metaError, setMetaError] = useState("");
  const [isMetaLoading, setIsMetaLoading] = useState(true);
  const [isConnectingMeta, setIsConnectingMeta] = useState(false);
  const [selectedContentIdeaIndex, setSelectedContentIdeaIndex] = useState(0);

  const loadInstagramInsights = async (igUserId: string) => {
    setIsMetaLoading(true);
    setMetaError("");

    try {
      setInstagramInsights(await fetchInstagramInsights(igUserId));
    } catch (error) {
      setInstagramInsights(null);
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
        setInstagramInsights(await fetchInstagramInsights(selectedAccount.id));
      } else {
        setSelectedInstagramId("");
        setInstagramInsights(null);
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

  useEffect(() => {
    refreshMetaStatus();
  }, []);

  const connectedInstagram = metaHealth?.instagramAccounts.find((account) => account.id === selectedInstagramId)
    || metaHealth?.instagramAccounts[0];
  const metaConnected = Boolean(metaHealth?.connected);

  const getAccountMetric = (...names: string[]) => instagramInsights?.insights
    .find((item) => names.includes(item.name))?.values?.at(-1)?.value;

  const getMediaMetric = (media: NonNullable<InstagramInsights["media"]>[number], ...names: string[]) =>
    media.insights?.data?.find((item) => names.includes(item.name))?.values?.at(-1)?.value;

  const latestReach = getAccountMetric("reach", "accounts_reached");
  const impressions = getAccountMetric("impressions", "views");
  const profileViews = getAccountMetric("profile_views");
  const websiteClicks = getAccountMetric("website_clicks");
  const profile = instagramInsights?.profile;

  const accountMetrics = [
    { label: "Followers count", value: profile?.followers_count, detail: "Total followers akun saat ini" },
    { label: "Followers growth", value: undefined, detail: "Perubahan harian, mingguan, dan bulanan" },
    { label: "Follows count", value: profile?.follows_count, detail: "Jumlah akun yang diikuti" },
    { label: "Profile views", value: profileViews, detail: "Jumlah kunjungan ke profil" },
    { label: "Reach akun", value: latestReach, detail: "Akun unik yang melihat konten" },
    { label: "Impressions akun", value: impressions, detail: "Total tayangan seluruh konten" },
    { label: "Website clicks", value: websiteClicks, detail: "Klik pada tautan di bio" },
    { label: "CTA clicks", value: getAccountMetric("email_contacts", "phone_call_clicks", "get_directions_clicks"), detail: "Email, telepon, dan petunjuk arah" },
  ];

  const trendMetrics: Record<string, string> = {
    reach: "Reach",
    accounts_reached: "Reach",
    impressions: "Impressions",
    views: "Impressions",
    profile_views: "Profile Views",
    website_clicks: "Website Clicks",
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
      current[metricLabel] = point.value;
      trendByDate.set(dateKey, current);
    }
  }

  const accountTrendData = Array.from(trendByDate.entries())
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([, value]) => value);

  const contentChartData = (instagramInsights?.media || []).slice(0, 8).reverse().map((media, index) => ({
    name: `Post ${index + 1}`,
    Reach: getMediaMetric(media, "reach", "accounts_reached") || 0,
    Likes: media.like_count || 0,
    Comments: media.comments_count || 0,
    Saves: getMediaMetric(media, "saved", "saves") || 0,
  }));

  const interactionTotals = (instagramInsights?.media || []).reduce((totals, media) => ({
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

  const mediaAnalytics = (instagramInsights?.media || []).map((media) => {
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

  const followerSeries = instagramInsights?.insights.find((item) => item.name === "follower_count")?.values || [];
  const firstFollowerValue = followerSeries.at(0)?.value;
  const lastFollowerValue = followerSeries.at(-1)?.value;
  const followerGrowthRate = firstFollowerValue && lastFollowerValue !== undefined
    ? (lastFollowerValue - firstFollowerValue) / firstFollowerValue
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

  const contentRows = (instagramInsights?.media || []).map((media) => {
    const reach = getMediaMetric(media, "reach", "accounts_reached");
    const likes = media.like_count;
    const comments = media.comments_count;
    const shares = getMediaMetric(media, "shares");
    const saves = getMediaMetric(media, "saved", "saves");
    const interactions = getMediaMetric(media, "total_interactions")
      ?? ((likes || 0) + (comments || 0) + (shares || 0) + (saves || 0));
    const engagementRate = reach ? interactions / reach : undefined;

    return [
      <div className="max-w-xs">
        <p className="line-clamp-2 font-medium text-slate-900">{media.caption || "Konten tanpa caption"}</p>
        <p className="mt-1 text-xs text-slate-500">{media.timestamp ? new Date(media.timestamp).toLocaleDateString("id-ID") : "-"}</p>
      </div>,
      <StatusBadge tone={media.media_type === "VIDEO" ? "blue" : "teal"}>{media.media_type || "POST"}</StatusBadge>,
      formatNumber(reach),
      formatNumber(getMediaMetric(media, "impressions", "views", "plays")),
      formatNumber(likes),
      formatNumber(comments),
      formatNumber(shares),
      formatNumber(saves),
      formatPercent(engagementRate),
      media.permalink ? <a className="font-semibold text-[#0F766E] hover:underline" href={media.permalink} target="_blank" rel="noreferrer">Buka</a> : "-",
    ];
  });
  const topContentReferences = [...mediaAnalytics]
    .sort((first, second) => (second.engagementRate || 0) - (first.engagementRate || 0) || second.reach - first.reach)
    .slice(0, 3);
  const bestContentType = [...contentTypePerformance]
    .sort((first, second) => (second.averageEngagement || 0) - (first.averageEngagement || 0) || second.averageReach - first.averageReach)[0];
  const topHashtags = hashtagPerformance.slice(0, 4).map((item) => item.hashtag);
  const bestPostingTime = bestTimeSlots[0]?.label || "slot waktu dengan engagement tertinggi";
  const videoMedia = (instagramInsights?.media || []).filter((media) => media.media_type === "VIDEO" || media.media_product_type === "REELS");
  const storyMedia = (instagramInsights?.media || []).filter((media) => media.media_product_type === "STORY");
  const videoViews = videoMedia.reduce((sum, media) => sum + (getMediaMetric(media, "views", "plays", "impressions") || 0), 0);
  const reelsPlays = videoMedia
    .filter((media) => media.media_product_type === "REELS")
    .reduce((sum, media) => sum + (getMediaMetric(media, "plays", "views", "impressions") || 0), 0);
  const profileActivityFromVideo = videoMedia.reduce((sum, media) => sum + (getMediaMetric(media, "profile_activity", "profile_visits") || 0), 0);
  const contentIdeas = [
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
  const selectedContentIdea = contentIdeas[Math.min(selectedContentIdeaIndex, contentIdeas.length - 1)] || contentIdeas[0];

  return (
    <ModuleShell
      title="Marketing Integrations"
      description="Pantau performa profil, audiens, dan konten seluruh akun Instagram Business yang terhubung."
      toolbar={
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full max-w-xl">
              <label htmlFor="instagram-account" className="text-sm font-semibold text-slate-900">Akun Instagram</label>
              <p className="mt-1 text-sm text-slate-500">Pilih akun yang datanya ingin ditampilkan pada dashboard.</p>
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
            <div className="flex flex-wrap gap-2">
              <button onClick={refreshMetaStatus} disabled={isMetaLoading} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:text-slate-400">
                {isMetaLoading ? "Memuat data..." : "Refresh data"}
              </button>
              {metaConnected && metaHealth?.source === "env" ? (
                <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <Plug className="h-4 w-4" />
                  Token Instagram aktif
                </span>
              ) : (
                <button onClick={handleConnectMeta} disabled={isConnectingMeta} className="inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:bg-slate-400">
                  <Plug className="h-4 w-4" />
                  {isConnectingMeta ? "Membuka Meta..." : metaConnected ? "Kelola koneksi" : "Hubungkan Meta"}
                </button>
              )}
            </div>
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
      {(metaError || metaHealth?.error) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          {metaError || metaHealth?.error}
        </div>
      )}
      <SectionCard icon={Instagram} title="Account / Profile Level" description="Metrik profil dan aktivitas akun Instagram yang dipilih.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {accountMetrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">{metric.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{formatNumber(metric.value)}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{metric.detail}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={TrendingUp} title="Tren Performa Akun" description="Pergerakan reach, impressions, profile views, dan website clicks berdasarkan periode dari Meta API.">
        {accountTrendData.length ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accountTrendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip contentStyle={{ borderRadius: 10, borderColor: "#E2E8F0" }} />
                <Legend />
                <Line type="monotone" dataKey="Reach" stroke="#0F766E" strokeWidth={3} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="Impressions" stroke="#2563EB" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="Profile Views" stroke="#DB2777" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="Website Clicks" stroke="#F59E0B" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState text={isMetaLoading ? "Sedang memuat tren performa..." : "Data tren belum tersedia untuk akun dan periode ini."} />
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard icon={TrendingUp} title="Online Followers" description="Waktu followers paling aktif untuk membantu penjadwalan konten.">
          <EmptyState text="Data jam aktif followers belum tersedia dari permission Meta untuk akun ini." />
        </SectionCard>
        <SectionCard icon={BarChart3} title="Audience Demographics" description="Komposisi usia, gender, kota, dan negara followers.">
          <div className="grid grid-cols-2 gap-3">
            <MetricPill label="Usia" value="-" />
            <MetricPill label="Gender" value="-" />
            <MetricPill label="Kota teratas" value="-" />
            <MetricPill label="Negara teratas" value="-" />
          </div>
        </SectionCard>
      </div>

      <SectionCard icon={Image} title="Content / Post Level" description="Performa Feed, Reels, Stories, dan Carousel dari konten terbaru.">
        {contentRows.length ? (
          <DataTable columns={["Konten", "Tipe", "Reach", "Views", "Likes", "Comments", "Shares", "Saves", "Eng. rate", "Link"]} rows={contentRows} />
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
            <p className="mt-1 text-xs text-slate-500">Perubahan titik awal ke akhir dari {followerSeries.length} periode</p>
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
          <MetricPill label="Avg. watch time" value="N/A" />
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Avg. watch time, sticker taps, exits, dan replies bergantung pada permission/metric Meta yang tersedia untuk akun. Jika API mengirim metric tersebut, card ini bisa diperluas tanpa mengubah layout.
        </p>
      </SectionCard>

      <SectionCard icon={Sparkles} title="AI Content Brief 7 Hari" description="Rencana konten sederhana: lihat rekomendasi utama, ikuti checklist, lalu eksekusi kalender 7 hari.">
        <div className="space-y-6">
          <div className="rounded-xl border border-teal-100 bg-teal-50 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0F766E]">Rekomendasi utama</p>
                <h3 className="mt-1 text-xl font-bold text-slate-950">
                  Fokus ke {bestContentType?.type || "Reels"} di {bestTimeSlots[0]?.label || "jam performa terbaik"}.
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Pakai konten referensi terbaik sebagai pola: hook cepat, visual jelas, caption singkat, dan CTA yang meminta komentar, save, atau DM.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:min-w-80">
                <MetricPill label="Avg engagement" value={formatPercent(averageEngagementRate)} />
                <MetricPill label="Referensi" value={formatNumber(topContentReferences.length)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-950">1. Buat Reels pendek</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Mulai dengan hasil/masalah di 2 detik pertama, lalu tutup dengan CTA jelas.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-950">2. Aktifkan Story harian</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Gunakan poll, quiz, Q&A, atau behind the scene untuk memancing reply.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-950">3. Ulangi pola terbaik</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Ambil format dari konten referensi, lalu buat variasi topik baru.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_0.8fr]">
            <div>
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
                      <StatusBadge tone={selectedContentIdea.format === "Reels" ? "blue" : selectedContentIdea.format === "Story" ? "yellow" : "teal"}>{selectedContentIdea.day}</StatusBadge>
                      <h4 className="mt-3 text-xl font-bold text-slate-950">{selectedContentIdea.format}</h4>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Siap dieksekusi</span>
                      <p className="mt-2 text-xs text-slate-500">Hari {selectedContentIdeaIndex + 1} dari {contentIdeas.length}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ide utama</p>
                    <p className="mt-2 text-base font-semibold leading-7 text-slate-950">{selectedContentIdea.idea}</p>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Format eksekusi</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{selectedContentIdea.formatGuide}</p>
                    </div>
                    <div className="rounded-lg border border-sky-100 bg-sky-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Kenapa format ini</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{selectedContentIdea.reason}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Yang dilakukan</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{selectedContentIdea.action}</p>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Dampaknya</p>
                      <p className="mt-2 text-sm leading-6 text-emerald-800">{selectedContentIdea.impact}</p>
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

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-950">Referensi Terbaik</h3>
                <p className="mt-1 text-sm text-slate-500">Pakai ini sebagai contoh hook dan gaya konten.</p>
              </div>
              {topContentReferences.length ? (
                <div className="space-y-3">
                  {topContentReferences.map((item, index) => (
                    <details key={item.media.id} open={index === 0} className="group rounded-lg border border-slate-200 bg-white">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3">
                        <div className="flex items-center gap-2">
                          <StatusBadge tone={index === 0 ? "green" : "teal"}>{`Ref ${index + 1}`}</StatusBadge>
                          <span className="text-sm font-semibold text-slate-900">{item.contentType}</span>
                        </div>
                        <span className="text-xs font-semibold text-[#0F766E] group-open:hidden">Lihat</span>
                        <span className="hidden text-xs font-semibold text-slate-500 group-open:inline">Tutup</span>
                      </summary>
                      <div className="border-t border-slate-100 px-3 pb-3">
                        <p className="mt-3 line-clamp-3 text-sm font-medium text-slate-900">{item.media.caption || "Konten tanpa caption"}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">Reach {formatNumber(item.reach)}</span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">Eng. {formatPercent(item.engagementRate)}</span>
                        </div>
                        {item.media.permalink ? <a className="mt-3 inline-flex text-sm font-semibold text-[#0F766E] hover:underline" href={item.media.permalink} target="_blank" rel="noreferrer">Buka referensi</a> : null}
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <EmptyState text="Belum ada konten referensi. Muat data Instagram atau pilih akun lain untuk membuat brief yang lebih akurat." />
              )}

              <div className="rounded-lg border border-sky-100 bg-sky-50 p-4">
                <p className="font-semibold text-slate-950">Nanti untuk AI Assistant</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">Blok ini bisa dikirim ke Cloud/Codex sebagai konteks untuk membuat caption, storyboard, shot list, dan checklist publish.</p>
              </div>
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
