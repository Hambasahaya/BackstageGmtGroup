import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Gauge,
  Globe2,
  Search,
  Server,
  TrendingUp,
  Users,
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
  { title: "Website aktif", value: "18", change: "+2", trend: "up", icon: Globe2, color: "bg-teal-600" },
  { title: "Organic traffic", value: "428.6K", change: "+18.4%", trend: "up", icon: TrendingUp, color: "bg-sky-600" },
  { title: "Keyword ranking", value: "9,842", change: "+736", trend: "up", icon: Search, color: "bg-indigo-600" },
  { title: "Artikel publish bulan ini", value: "126", change: "+21", trend: "up", icon: FileText, color: "bg-emerald-600" },
  { title: "Event upcoming", value: "34", change: "7 minggu ini", trend: "up", icon: CalendarDays, color: "bg-amber-500" },
  { title: "Pending approval event", value: "11", change: "-4", trend: "down", icon: Clock3, color: "bg-orange-500" },
  { title: "SEO issue count", value: "287", change: "-13.2%", trend: "down", icon: AlertTriangle, color: "bg-rose-600" },
  { title: "Website health score", value: "91%", change: "+5 pts", trend: "up", icon: Gauge, color: "bg-cyan-600" },
  { title: "Server uptime", value: "99.97%", change: "30 hari", trend: "up", icon: Server, color: "bg-slate-700" },
];

const traffic30Days = [
  { day: "20 Apr", traffic: 10400 },
  { day: "24 Apr", traffic: 11800 },
  { day: "28 Apr", traffic: 12650 },
  { day: "2 Mei", traffic: 12120 },
  { day: "6 Mei", traffic: 13780 },
  { day: "10 Mei", traffic: 14920 },
  { day: "14 Mei", traffic: 15840 },
  { day: "18 Mei", traffic: 17110 },
];

const rankingMovement = [
  { week: "W1", top3: 284, top10: 1180, top50: 4260 },
  { week: "W2", top3: 301, top10: 1234, top50: 4388 },
  { week: "W3", top3: 329, top10: 1316, top50: 4524 },
  { week: "W4", top3: 352, top10: 1428, top50: 4705 },
];

const articlePerformance = [
  { category: "SEO Tips", views: 48200 },
  { category: "Product", views: 36400 },
  { category: "Event", views: 21800 },
  { category: "Company", views: 17600 },
  { category: "Hiring", views: 9400 },
];

const attendanceData = [
  { name: "Checked-in", value: 684, color: "#0F766E" },
  { name: "Approved", value: 214, color: "#2563EB" },
  { name: "Pending", value: 82, color: "#F59E0B" },
  { name: "Rejected", value: 31, color: "#E11D48" },
];

const approvals = [
  { item: "Launching campaign GMT Lighting", type: "Artikel", owner: "Content Team", status: "SEO review" },
  { item: "Client visit Bandung Expo", type: "Event", owner: "Sales Ops", status: "Manager approval" },
  { item: "Duplicate meta di gmttruss.id", type: "SEO", owner: "SEO Team", status: "Fix queued" },
  { item: "Training Google Analytics 4", type: "Event", owner: "HR", status: "Calendar sync" },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">GMT Group Central Dashboard</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Overview operasional digital</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor website, SEO, artikel, event, approval, dan performa server dari satu tempat.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Sync GA4/GSC
          </button>
          <button className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59]">
            Export report
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
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Traffic organic 30 hari</h2>
              <p className="text-sm text-slate-500">Gabungan seluruh website aktif GMT Group</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">+18.4%</span>
          </div>
          <ResponsiveContainer width="100%" height={310}>
            <AreaChart data={traffic30Days}>
              <defs>
                <linearGradient id="traffic" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#0F766E" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#0F766E" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip />
              <Area dataKey="traffic" stroke="#0F766E" strokeWidth={3} fill="url(#traffic)" />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Event attendance</h2>
          <p className="text-sm text-slate-500">Status peserta bulan ini</p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={attendanceData} innerRadius={62} outerRadius={88} paddingAngle={4} dataKey="value">
                {attendanceData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            {attendanceData.map((item) => (
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
          <p className="text-sm text-slate-500">Distribusi keyword top 3, top 10, dan top 50</p>
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
          <h2 className="text-lg font-semibold text-slate-950">Artikel performance</h2>
          <p className="text-sm text-slate-500">Views berdasarkan kategori konten</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={articlePerformance}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="category" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip />
              <Bar dataKey="views" fill="#2563EB" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Approval & issue queue</h2>
            <p className="text-sm text-slate-500">Prioritas lintas SEO, artikel, dan event</p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-[#0F766E]" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                <th className="py-3 pr-4 font-semibold">Item</th>
                <th className="py-3 pr-4 font-semibold">Tipe</th>
                <th className="py-3 pr-4 font-semibold">Owner</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((row) => (
                <tr key={row.item} className="border-b border-slate-100 text-sm last:border-0">
                  <td className="py-3 pr-4 font-medium text-slate-950">{row.item}</td>
                  <td className="py-3 pr-4 text-slate-600">{row.type}</td>
                  <td className="py-3 pr-4 text-slate-600">{row.owner}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
