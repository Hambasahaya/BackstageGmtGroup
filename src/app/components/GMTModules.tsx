import {
  BarChart3,
  Bot,
  Brain,
  CalendarCheck,
  FileArchive,
  FileSpreadsheet,
  FileText,
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
} from "lucide-react";
import { useEffect, useState, type ElementType, type ReactNode } from "react";
import {
  fetchInstagramInsights,
  fetchMetaAccounts,
  fetchMetaAuthUrl,
  type InstagramInsights,
  type MetaAccountHealth,
} from "../services/metaIntegrations";
import { fetchKeywordResearch, type KeywordResearchResponse } from "../services/seoIntegrations";

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
  children,
}: {
  title: string;
  description: string;
  action?: string;
  stats: Array<{ label: string; value: string; detail: string }>;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} action={action} />
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
  const websites = [
    ["gmtlighting.id", "Lighting & stage equipment", "Rina SEO", <StatusBadge tone="green">Live</StatusBadge>, "GA4, GSC, Instagram, Google Ads", "SEO Team, Ads Team, Manager"],
    ["gmttruss.id", "Rigging & truss", "Bima Admin", <StatusBadge tone="blue">Staging</StatusBadge>, "GA4, GSC, Sitemap", "SEO Team"],
    ["gmttraining.id", "Training & certification", "Nadia HR", <StatusBadge tone="green">Live</StatusBadge>, "GA4, GSC, Meta Ads", "HR, Ads Team, Manager"],
  ];

  return (
    <ModuleShell
      title="Multi Website Management"
      description="Kelola seluruh properti digital GMT Group, lengkap dengan domain, niche, PIC, integrasi analytics, dan akses per website."
      action="Tambah website"
      stats={[
        { label: "Website live", value: "18", detail: "3 staging siap deploy" },
        { label: "Integrasi aktif", value: "42", detail: "GSC, Ads, Instagram, AI" },
        { label: "PIC admin", value: "12", detail: "Terpetakan per unit bisnis" },
        { label: "Role access", value: "56", detail: "Akses granular per website" },
      ]}
    >
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Filter status</button>
        <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Switch website</button>
        <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Data source</button>
        <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Role access</button>
      </div>
      <DataTable
        columns={["Domain", "Niche", "PIC Admin", "Status", "Integrasi", "Akses"]}
        rows={websites}
      />
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
  const [metaError, setMetaError] = useState("");
  const [isMetaLoading, setIsMetaLoading] = useState(true);
  const [isConnectingMeta, setIsConnectingMeta] = useState(false);

  const refreshMetaStatus = async () => {
    setIsMetaLoading(true);
    setMetaError("");

    try {
      const accounts = await fetchMetaAccounts();
      setMetaHealth(accounts);

      if (accounts.connected) {
        const insights = await fetchInstagramInsights();
        setInstagramInsights(insights);
      } else {
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

  const connectedInstagram = metaHealth?.instagramAccounts[0];
  const metaConnected = Boolean(metaHealth?.connected);
  const topMedia = instagramInsights?.media[0];
  const latestReach = instagramInsights?.insights
    .find((item) => item.name === "reach")
    ?.values?.at(-1)?.value;

  return (
    <ModuleShell
      title="Marketing Integrations"
      description="Pusat koneksi API untuk Google Search Console, Instagram, Google Ads, Meta Ads, dan AI engine agar data marketing bisa dipakai per website."
      stats={[
        { label: "Meta status", value: isMetaLoading ? "Checking" : metaConnected ? "Connected" : "Not connected", detail: connectedInstagram?.username ? `@${connectedInstagram.username}` : "OAuth server-side" },
        { label: "Instagram accounts", value: formatNumber(metaHealth?.instagramAccounts.length || 0), detail: metaConnected ? "Dari Graph API" : "Menunggu OAuth" },
        { label: "Latest reach", value: formatNumber(latestReach || 0), detail: latestReach ? "Instagram insights" : "Belum ada data insights" },
        { label: "Recent media", value: formatNumber(instagramInsights?.media.length || 0), detail: topMedia?.media_type || "Menunggu koneksi" },
      ]}
    >
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Meta OAuth Connection</h2>
          <p className="mt-1 text-sm text-slate-500">
            Token disimpan di backend. Frontend hanya membaca status, akun Instagram Business, dan insight ringkas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={refreshMetaStatus}
            disabled={isMetaLoading}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {isMetaLoading ? "Checking..." : "Refresh status"}
          </button>
          <button
            onClick={handleConnectMeta}
            disabled={isConnectingMeta}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <Plug className="h-4 w-4" />
            {isConnectingMeta ? "Opening Meta..." : metaConnected ? "Reconnect Meta" : "Connect Meta"}
          </button>
        </div>
      </div>
      {(metaError || metaHealth?.error) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          {metaError || metaHealth?.error}
        </div>
      )}
      <FeatureGrid
        features={[
          { icon: Search, title: "Google Search Console", text: "Ambil click, impression, CTR, average position, query, page, device, dan country per website." },
          { icon: Instagram, title: "Instagram API", text: "Sinkronkan reach, engagement, follower growth, content performance, comment signal, dan campaign tag." },
          { icon: Megaphone, title: "Ads Platforms", text: "Gabungkan Google Ads dan Meta Ads untuk spend, CPC, CTR, conversion, ROAS, dan audience performance." },
          { icon: Bot, title: "AI Insight API", text: "Ubah data SEO, social, Ads, dan website menjadi rekomendasi aksi, report, content brief, dan prioritas campaign." },
          { icon: Plug, title: "Connector Health", text: "Pantau token, permission scope, jadwal sync, error terakhir, dan data freshness per channel." },
          { icon: Sparkles, title: "Marketing Automation", text: "Siapkan trigger untuk ranking turun, ads boros, konten viral, issue teknis, dan peluang keyword baru." },
        ]}
      />
      <DataTable
        columns={["Source", "Website", "Scope data", "Sync", "Status", "Next action"]}
        rows={[
          ["Google Search Console", "gmtlighting.id", "Query, page, CTR, position", "Daily 06:00", <StatusBadge tone="green">Connected</StatusBadge>, "Map query to landing page"],
          [
            "Instagram API",
            connectedInstagram?.username ? `@${connectedInstagram.username}` : "No account",
            "Profile, media, reach, engagement",
            "On demand",
            isMetaLoading ? <StatusBadge tone="blue">Checking</StatusBadge> : metaConnected ? <StatusBadge tone="green">Connected</StatusBadge> : <StatusBadge tone="slate">Not connected</StatusBadge>,
            metaConnected ? "Review App permissions before public use" : "Complete OAuth",
          ],
          ["Google Ads", "GMT Group Ads", "Spend, conversion, ROAS", "Daily 07:00", <StatusBadge tone="yellow">Review scope</StatusBadge>, "Add conversion access"],
          ["Meta Ads", "GMT Training", "Campaign, adset, leads", "Daily 07:30", metaConnected ? <StatusBadge tone="yellow">Needs ads endpoint</StatusBadge> : <StatusBadge tone="blue">Queued</StatusBadge>, metaConnected ? "Implement ad account reporting" : "Finish OAuth"],
          ["AI Insight API", "All websites", "Summary and recommendation", "On demand", <StatusBadge tone="green">Ready</StatusBadge>, "Define prompt templates"],
        ]}
      />
      <SectionCard icon={Instagram} title="Instagram API Health" description="Ringkasan akun dan data yang benar-benar dibaca dari endpoint Meta.">
        <DataTable
          columns={["Check", "Value", "Status", "Source"]}
          rows={[
            ["OAuth token", metaHealth?.savedAt || "-", metaConnected ? <StatusBadge tone="green">Stored server-side</StatusBadge> : <StatusBadge tone="slate">Missing</StatusBadge>, "/api/meta/accounts"],
            ["Instagram Business Account", connectedInstagram?.username ? `@${connectedInstagram.username}` : "-", metaConnected ? <StatusBadge tone="green">Resolved</StatusBadge> : <StatusBadge tone="slate">Not resolved</StatusBadge>, "instagram_business_account"],
            ["Insights", latestReach ? formatNumber(latestReach) : "-", latestReach ? <StatusBadge tone="green">Loaded</StatusBadge> : <StatusBadge tone="slate">Not loaded</StatusBadge>, "/api/meta/instagram-insights"],
            ["Recent media", topMedia?.permalink || "-", topMedia ? <StatusBadge tone="green">Loaded</StatusBadge> : <StatusBadge tone="slate">Not loaded</StatusBadge>, "IG media edge"],
          ]}
        />
      </SectionCard>
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
