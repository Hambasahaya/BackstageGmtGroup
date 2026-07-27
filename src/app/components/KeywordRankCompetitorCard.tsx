import React, { useState } from "react";
import {
  Search,
  Globe,
  TrendingUp,
  Target,
  Award,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Layers,
  Zap,
  ArrowUpRight,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import {
  checkKeywordRankAndCompetitors,
  type KeywordCheckResponse,
} from "../services/seoIntegrations";

interface Props {
  defaultSiteUrl?: string;
  className?: string;
  availableWebsites?: Array<{ domain: string; url?: string }>;
}

export function KeywordRankCompetitorCard({
  defaultSiteUrl = "https://gmtgroup.co.id/",
  className = "",
  availableWebsites = [],
}: Props) {
  const [keywordInput, setKeywordInput] = useState("sewa forklift jakarta");
  const [siteUrlInput, setSiteUrlInput] = useState(defaultSiteUrl);
  const [result, setResult] = useState<KeywordCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const presetKeywords = [
    "sewa forklift jakarta",
    "jasa crane jakarta",
    "rental alat berat",
    "gmt group",
  ];

  const handleSearch = async (overrideKeyword?: string) => {
    const targetKeyword = (overrideKeyword || keywordInput).trim();
    if (!targetKeyword) {
      setError("Masukkan kata kunci (keyword) yang ingin dianalisis.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await checkKeywordRankAndCompetitors({
        keyword: targetKeyword,
        siteUrl: siteUrlInput,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengecek posisi keyword dan analisis kompetitor.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRankBadge = (position: number) => {
    if (position === 0) {
      return {
        bg: "bg-slate-100 text-slate-700 border-slate-300",
        label: `🔍 Posisi > 30 (Belum Masuk Top 30 Google Live SERP)`,
        iconTone: "text-slate-500",
      };
    }
    if (position <= 3) {
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: `🏆 Posisi #${position} (Top 3 Google)`,
        iconTone: "text-emerald-600",
      };
    }
    if (position <= 10) {
      return {
        bg: "bg-teal-50 text-teal-700 border-teal-200",
        label: `⭐ Posisi #${position} (Halaman 1 Google)`,
        iconTone: "text-teal-600",
      };
    }
    if (position <= 20) {
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        label: `📈 Posisi #${position} (Halaman 2 Google)`,
        iconTone: "text-amber-600",
      };
    }
    return {
      bg: "bg-slate-100 text-slate-700 border-slate-200",
      label: `Posisi #${position} di Google`,
      iconTone: "text-slate-600",
    };
  };

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("id-ID").format(num);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <section className={`rounded-xl border border-teal-100 bg-white p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              100% Realtime Live SERP
            </span>
            <span className="text-xs text-slate-400">Google Indonesia + GSC + Ads API</span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Cek Posisi Keyword & Analisis Kompetitor (Realtime Live)
          </h2>
          <p className="text-sm text-slate-500">
            Ketahui posisi peringkat aktual website Anda di Google Indonesia secara realtime tanpa data dummy.
          </p>
        </div>
      </div>

      {/* Form Input Card */}
      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1.5fr_auto]">
          {/* Input Keyword */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Kata Kunci (Keyword)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Contoh: sewa forklift jakarta, jasa crane"
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          {/* Input/Select Website URL */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Target Website / Domain
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              {availableWebsites.length > 0 ? (
                <select
                  value={siteUrlInput}
                  onChange={(e) => setSiteUrlInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                >
                  <option value={defaultSiteUrl}>{defaultSiteUrl}</option>
                  {availableWebsites.map((w, idx) => (
                    <option key={idx} value={w.url || `https://${w.domain}`}>
                      {w.domain}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={siteUrlInput}
                  onChange={(e) => setSiteUrlInput(e.target.value)}
                  placeholder="https://gmtgroup.co.id/"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                />
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-end">
            <button
              onClick={() => handleSearch()}
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Search className="h-4 w-4" />
              {isLoading ? "Analisis Posisi..." : "Cek Posisi"}
            </button>
          </div>
        </div>

        {/* Preset Keywords */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Coba Keyword Popular:</span>
          {presetKeywords.map((kw) => (
            <button
              key={kw}
              onClick={() => {
                setKeywordInput(kw);
                handleSearch(kw);
              }}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-[#0F766E] hover:text-[#0F766E]"
            >
              {kw}
            </button>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="mt-6 space-y-4 animate-pulse">
          <div className="h-20 rounded-lg bg-slate-100"></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="h-16 rounded-lg bg-slate-100"></div>
            <div className="h-16 rounded-lg bg-slate-100"></div>
            <div className="h-16 rounded-lg bg-slate-100"></div>
            <div className="h-16 rounded-lg bg-slate-100"></div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && !isLoading && (
        <div className="mt-6 space-y-6">
          {/* Main Rank Position Highlight Banner */}
          {(() => {
            const badge = getRankBadge(result.position);
            return (
              <div className={`rounded-xl border p-5 transition-all ${badge.bg}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-lg font-extrabold ${badge.iconTone}`}>
                        <Award className="h-6 w-6" /> {badge.label}
                      </span>
                    </div>
                    <p className="text-sm font-medium opacity-90">
                      Keyword: <span className="font-bold underline">{result.keyword}</span> • Domain:{" "}
                      <span className="font-bold">{result.targetDomain}</span>
                    </p>
                    {result.targetPage ? (
                      <p className="flex items-center gap-1.5 text-xs opacity-80">
                        <span>Landing Page Target:</span>
                        <a
                          href={result.targetPage}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium underline hover:opacity-100 flex items-center gap-1"
                        >
                          <span className="max-w-md truncate">{result.targetPage}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 text-xs text-slate-600 bg-white/60 p-2 rounded-md border border-slate-200 mt-1">
                        <span className="font-semibold">Landing Page Target:</span>
                        <span className="italic text-slate-600">
                          Belum terdeteksi di Top 30 Google (Belum ada halaman spesifik {result.targetDomain} yang masuk peringkat SERP untuk keyword "{result.keyword}")
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <div className="rounded-lg bg-white/80 backdrop-blur px-3 py-2 text-center shadow-xs">
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Search Volume</p>
                      <p className="text-sm font-bold text-slate-900">{formatNumber(result.metrics.searchVolume)}/bln</p>
                    </div>
                    <div className="rounded-lg bg-white/80 backdrop-blur px-3 py-2 text-center shadow-xs">
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Est. CTR</p>
                      <p className="text-sm font-bold text-slate-900">{(result.metrics.ctr * 100).toFixed(1)}%</p>
                    </div>
                    <div className="rounded-lg bg-white/80 backdrop-blur px-3 py-2 text-center shadow-xs">
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Persaingan</p>
                      <p className="text-sm font-bold text-slate-900">{result.metrics.competitionLevel}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-xs font-semibold text-slate-500">Total Impressions</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{formatNumber(result.metrics.impressions)}</p>
              <p className="text-[11px] text-slate-400">Estimasi tampilan SERP</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-xs font-semibold text-slate-500">GSC Clicks / Organic</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{formatNumber(result.metrics.clicks)}</p>
              <p className="text-[11px] text-slate-400">Pengunjung via Google</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-xs font-semibold text-slate-500">CPC Bid Range</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {formatCurrency(result.metrics.cpcLow)} - {formatCurrency(result.metrics.cpcHigh)}
              </p>
              <p className="text-[11px] text-slate-400">Biaya iklan Google Ads</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-xs font-semibold text-slate-500">Difficulty Index</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-lg font-bold text-[#0F766E]">
                  {result.metrics.competitionIndex}/100
                </span>
                <span className="text-xs text-slate-500 font-medium">({result.metrics.competitionLevel})</span>
              </div>
              <p className="text-[11px] text-slate-400">Tingkat kesulitan optimasi</p>
            </div>
          </div>

          {/* Competitor Analysis Section */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#0F766E]" />
                  Analisis SERP & Kompetitor Teratas
                </h3>
                <p className="text-xs text-slate-500">
                  Domain pesaing utama yang menguasai kata kunci "{result.keyword}".
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {result.competitors.length} Pesaing Terdeteksi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  <tr>
                    <th className="px-3 py-2.5">Peringkat</th>
                    <th className="px-3 py-2.5">Domain Kompetitor</th>
                    <th className="px-3 py-2.5">Tipe Konten</th>
                    <th className="px-3 py-2.5">Domain Authority</th>
                    <th className="px-3 py-2.5">Estimasi Traffic Share</th>
                    <th className="px-3 py-2.5">Keunggulan Konten</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {result.competitors.map((comp) => (
                    <tr key={comp.rank} className="hover:bg-slate-50/80">
                      <td className="px-3 py-3 font-bold text-slate-900">#{comp.rank}</td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-900">{comp.domain}</div>
                        <a
                          href={comp.url}
                          target="_blank"
                          rel="noreferrer"
                          className="line-clamp-1 text-[11px] text-teal-700 underline hover:text-teal-900 flex items-center gap-1 mt-0.5"
                        >
                          <span>{comp.title}</span>
                          <ArrowUpRight className="h-3 w-3 inline shrink-0" />
                        </a>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
                          {comp.type}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-800">
                        {comp.authorityScore}/100
                      </td>
                      <td className="px-3 py-3 font-bold text-[#0F766E]">
                        {comp.estimatedTrafficShare}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {comp.strengths.map((str, sIdx) => (
                            <span
                              key={sIdx}
                              className="inline-flex items-center gap-1 rounded-sm bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-800 border border-teal-100"
                            >
                              <CheckCircle2 className="h-2.5 w-2.5 text-teal-600" />
                              {str}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Outrank Strategy Recommendations */}
          <div className="rounded-lg border border-teal-100 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 p-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#0F766E]" />
              Rekomendasi Strategi Mengalahkan Kompetitor (Outrank Action Plan)
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Lakukan langkah-langkah optimasi berikut untuk meningkatkan posisi ranking domain Anda menuju Halaman 1 Google.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {result.recommendations.map((rec, rIdx) => (
                <div
                  key={rIdx}
                  className="rounded-lg border border-teal-100 bg-white p-3.5 shadow-2xs transition hover:border-teal-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0F766E] text-[10px] font-bold text-white shrink-0">
                        {rIdx + 1}
                      </span>
                      {rec.title}
                    </h4>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                        rec.priority === "HIGH"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {rec.priority} PRIORITY
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {rec.description}
                  </p>
                </div>
              ))}
            </div>

            {result.suggestions && result.suggestions.length > 0 && (
              <div className="mt-4 border-t border-teal-100 pt-4">
                <p className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                  Rekomendasi Kata Kunci Turunan (Free Google Suggest API):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.suggestions.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => {
                        setKeywordInput(sug);
                        handleSearch(sug);
                      }}
                      className="rounded-md border border-teal-200 bg-white px-2.5 py-1 text-xs font-medium text-teal-800 transition hover:bg-teal-50 hover:border-teal-400"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
