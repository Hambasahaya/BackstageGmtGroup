import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Gauge,
  Globe2,
  Instagram,
  Megaphone,
  Plug,
  Search,
  Server,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const kpiData = [
  { title: "Website tracked", value: "18", change: "+2", trend: "up", icon: Globe2, color: "bg-teal-600" },
  { title: "Organic traffic", value: "428.6K", change: "+18.4%", trend: "up", icon: TrendingUp, color: "bg-sky-600" },
  { title: "Keyword ranking", value: "9,842", change: "+736", trend: "up", icon: Search, color: "bg-indigo-600" },
  { title: "Ads spend tracked", value: "Rp128M", change: "+9.6%", trend: "up", icon: Megaphone, color: "bg-violet-600" },
  { title: "Social engagement", value: "86.4K", change: "+12.8%", trend: "up", icon: Instagram, color: "bg-pink-600" },
  { title: "AI recommendations", value: "47", change: "18 high impact", trend: "up", icon: Bot, color: "bg-cyan-600" },
  { title: "SEO issue count", value: "287", change: "-13.2%", trend: "down", icon: AlertTriangle, color: "bg-rose-600" },
  { title: "Website health score", value: "91%", change: "+5 pts", trend: "up", icon: Gauge, color: "bg-emerald-600" },
  { title: "Server uptime", value: "99.97%", change: "30 hari", trend: "up", icon: Server, color: "bg-slate-700" },
];

const traffic30Days = [
  { day: "20 Apr", organic: 10400, ads: 4200, social: 2600 },
  { day: "24 Apr", organic: 11800, ads: 4800, social: 3100 },
  { day: "28 Apr", organic: 12650, ads: 5100, social: 3600 },
  { day: "2 Mei", organic: 12120, ads: 5400, social: 3300 },
  { day: "6 Mei", organic: 13780, ads: 6100, social: 3900 },
  { day: "10 Mei", organic: 14920, ads: 6600, social: 4400 },
  { day: "14 Mei", organic: 15840, ads: 7200, social: 4800 },
  { day: "18 Mei", organic: 17110, ads: 7800, social: 5300 },
];

const rankingMovement = [
  { week: "W1", top3: 284, top10: 1180, top50: 4260 },
  { week: "W2", top3: 301, top10: 1234, top50: 4388 },
  { week: "W3", top3: 329, top10: 1316, top50: 4524 },
  { week: "W4", top3: 352, top10: 1428, top50: 4705 },
];

const channelPerformance = [
  { category: "Organic", leads: 482 },
  { category: "Google Ads", leads: 364 },
  { category: "Meta Ads", leads: 318 },
  { category: "Instagram", leads: 276 },
  { category: "Referral", leads: 148 },
];

const connectorStatus = [
  { name: "Google Search Console", value: 18, color: "#0F766E" },
  { name: "Instagram API", value: 12, color: "#DB2777" },
  { name: "Google Ads", value: 9, color: "#2563EB" },
  { name: "Meta Ads", value: 7, color: "#7C3AED" },
];

const websites = [
  { domain: "gmtlighting.id", niche: "Lighting", traffic: "92.4K", leads: "642", roas: "4.8x", health: "94%" },
  { domain: "gmttruss.id", niche: "Truss", traffic: "71.8K", leads: "418", roas: "3.9x", health: "89%" },
  { domain: "gmttraining.id", niche: "Training", traffic: "54.2K", leads: "336", roas: "5.2x", health: "92%" },
  { domain: "gmtevent.id", niche: "Event", traffic: "48.6K", leads: "289", roas: "3.5x", health: "87%" },
];

const aiRecommendations = [
  { item: "Naikkan budget Google Ads untuk keyword lampu panggung", impact: "High", owner: "Ads Team" },
  { item: "Buat artikel pembanding truss aluminium vs besi", impact: "High", owner: "Content Team" },
  { item: "Optimasi CTR halaman training rigging dari data GSC", impact: "Medium", owner: "SEO Team" },
  { item: "Repost konten Instagram event ke campaign retargeting", impact: "Medium", owner: "Social Team" },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">GMT Group Marketing Intelligence</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Overview multi-website & marketing data</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Monitor banyak website, SEO, Instagram, Ads, GSC, artikel, event, server, dan rekomendasi AI dari satu pusat kerja.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Plug className="h-4 w-4" />
            Sync data sources
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59]">
            <Sparkles className="h-4 w-4" />
            Generate AI report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          const isUp = kpi.trend === "up";

          return (
            <div key={kpi.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-500">{kpi.title}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{kpi.value}</p>
                </div>
                <div className={`rounded-lg p-2.5 ${kpi.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-sm">
                {isUp ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-rose-600" />
                )}
                <span className={isUp ? "font-medium text-emerald-700" : "font-medium text-rose-700"}>
                  {kpi.change}
                </span>
                <span className="text-slate-500">vs periode lalu</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Traffic & acquisition 30 hari</h2>
              <p className="text-sm text-slate-500">Organic, Ads, dan social traffic dari seluruh website aktif</p>
            </div>
            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">+18.4% total sessions</span>
          </div>
          <ResponsiveContainer width="100%" height={310}>
            <AreaChart data={traffic30Days}>
              <defs>
                <linearGradient id="organic" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#0F766E" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#0F766E" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip />
              <Area dataKey="organic" stroke="#0F766E" strokeWidth={3} fill="url(#organic)" />
              <Area dataKey="ads" stroke="#2563EB" strokeWidth={2} fill="#DBEAFE" />
              <Area dataKey="social" stroke="#DB2777" strokeWidth={2} fill="#FCE7F3" />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Data source readiness</h2>
          <p className="text-sm text-slate-500">Jumlah property yang sudah siap disinkronkan</p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={connectorStatus} innerRadius={62} outerRadius={88} paddingAngle={4} dataKey="value">
                {connectorStatus.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            {connectorStatus.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold text-slate-950">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Ranking keyword movement</h2>
          <p className="text-sm text-slate-500">Distribusi keyword top 3, top 10, dan top 50 dari GSC/SEO tracker</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={rankingMovement}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="week" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip />
              <Line type="monotone" dataKey="top3" stroke="#0F766E" strokeWidth={3} />
              <Line type="monotone" dataKey="top10" stroke="#2563EB" strokeWidth={3} />
              <Line type="monotone" dataKey="top50" stroke="#F59E0B" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Lead source performance</h2>
          <p className="text-sm text-slate-500">Kontribusi leads dari SEO, Ads, Instagram, dan referral</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={channelPerformance}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="category" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip />
              <Bar dataKey="leads" fill="#2563EB" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Website portfolio</h2>
              <p className="text-sm text-slate-500">Tracking performa lintas domain, niche, traffic, leads, ROAS, dan health</p>
            </div>
            <Target className="h-5 w-5 text-[#0F766E]" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                  <th className="py-3 pr-4 font-semibold">Domain</th>
                  <th className="py-3 pr-4 font-semibold">Niche</th>
                  <th className="py-3 pr-4 font-semibold">Traffic</th>
                  <th className="py-3 pr-4 font-semibold">Leads</th>
                  <th className="py-3 pr-4 font-semibold">ROAS</th>
                  <th className="py-3 pr-4 font-semibold">Health</th>
                </tr>
              </thead>
              <tbody>
                {websites.map((row) => (
                  <tr key={row.domain} className="border-b border-slate-100 text-sm last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-950">{row.domain}</td>
                    <td className="py-3 pr-4 text-slate-600">{row.niche}</td>
                    <td className="py-3 pr-4 text-slate-600">{row.traffic}</td>
                    <td className="py-3 pr-4 text-slate-600">{row.leads}</td>
                    <td className="py-3 pr-4 text-slate-600">{row.roas}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{row.health}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">AI action queue</h2>
              <p className="text-sm text-slate-500">Rekomendasi dari data SEO, Ads, GSC, dan social</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-[#0F766E]" />
          </div>
          <div className="space-y-3">
            {aiRecommendations.map((row) => (
              <div key={row.item} className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-950">{row.item}</p>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{row.owner}</span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">{row.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
