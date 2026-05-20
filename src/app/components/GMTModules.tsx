import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Download,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Globe2,
  Image,
  Link2,
  Mail,
  Plus,
  QrCode,
  Search,
  Send,
  Smartphone,
  Upload,
  Workflow,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";

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

export function MultiWebsiteManagement() {
  const websites = [
    ["gmtlighting.id", "Lighting & stage equipment", "Rina SEO", <StatusBadge tone="green">Live</StatusBadge>, "GA4, GSC, Sitemap", "SEO Team, Manager"],
    ["gmttruss.id", "Rigging & truss", "Bima Admin", <StatusBadge tone="blue">Staging</StatusBadge>, "GA4, Sitemap", "SEO Team"],
    ["gmttraining.id", "Training & certification", "Nadia HR", <StatusBadge tone="green">Live</StatusBadge>, "GA4, GSC", "HR, Manager"],
  ];

  return (
    <ModuleShell
      title="Multi Website Management"
      description="Kelola seluruh properti digital GMT Group, lengkap dengan domain, niche, PIC, integrasi analytics, dan akses per website."
      action="Tambah website"
      stats={[
        { label: "Website live", value: "18", detail: "3 staging siap deploy" },
        { label: "Integrasi aktif", value: "42", detail: "GA4, GSC, sitemap" },
        { label: "PIC admin", value: "12", detail: "Terpetakan per unit bisnis" },
        { label: "Role access", value: "56", detail: "Akses granular per website" },
      ]}
    >
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Filter status</button>
        <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Switch website</button>
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
  return (
    <ModuleShell
      title="SEO Management"
      description="Pusat keyword tracking, technical audit, content optimization, competitor monitoring, dan sinkronisasi GSC/GA4."
      action="Import keyword"
      stats={[
        { label: "Tracked keyword", value: "9,842", detail: "736 naik minggu ini" },
        { label: "Technical issues", value: "287", detail: "404, broken link, noindex" },
        { label: "Avg CTR", value: "4.8%", detail: "Dari GSC sync terakhir" },
        { label: "SEO health", value: "91%", detail: "Skor rata-rata website" },
      ]}
    >
      <FeatureGrid
        features={[
          { icon: Search, title: "Keyword Tracking", text: "Pantau posisi, search volume, ranking change, target page, CTR, ranking history, dan competitor compare." },
          { icon: AlertTriangle, title: "Technical SEO Audit", text: "Auto check 404, broken link, duplicate meta/title, missing alt, slow page, index/noindex, dan health score." },
          { icon: FileText, title: "Content SEO Optimization", text: "Checklist keyword di title/H1, link internal/eksternal, meta description, image alt, schema, dan readability score." },
          { icon: Link2, title: "Competitor Monitoring", text: "Bandingkan keyword overlap, estimasi backlink, dan top pages kompetitor untuk tiap niche website." },
          { icon: Globe2, title: "GSC & GA4 Sync", text: "Monitor click, impression, CTR, average position, organic traffic, engagement, dan conversion." },
          { icon: CheckCircle2, title: "SEO Action Queue", text: "Issue langsung menjadi task untuk SEO Team, Content Team, atau Manager approval." },
        ]}
      />
      <DataTable
        columns={["Keyword", "Position", "Volume", "Change", "Target page", "CTR"]}
        rows={[
          ["lampu panggung", "#3", "8.1K", <StatusBadge tone="green">+4</StatusBadge>, "/produk/lampu-panggung", "6.7%"],
          ["sewa truss jakarta", "#8", "2.4K", <StatusBadge tone="yellow">-2</StatusBadge>, "/rental/truss", "3.9%"],
          ["training rigging", "#12", "1.2K", <StatusBadge tone="green">+6</StatusBadge>, "/training/rigging", "4.2%"],
        ]}
      />
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
      description="Export SEO report, keyword report, event attendance, dan article performance ke PDF/Excel dengan auto email report."
      action="Generate report"
      stats={[
        { label: "Scheduled reports", value: "16", detail: "Auto email mingguan/bulanan" },
        { label: "PDF exports", value: "92", detail: "Bulan berjalan" },
        { label: "Excel exports", value: "74", detail: "Keyword dan attendance" },
        { label: "Recipients", value: "38", detail: "Manager dan PIC website" },
      ]}
    >
      <FeatureGrid
        features={[
          { icon: FileText, title: "SEO Report", text: "Health score, technical issue, organic traffic, GSC/GA4 metric, dan rekomendasi." },
          { icon: FileSpreadsheet, title: "Keyword Report", text: "Ranking movement, search volume, CTR, target page, dan competitor compare." },
          { icon: CalendarCheck, title: "Event Attendance", text: "Registrasi, approval, QR check-in, no-show, dan attendance analytics." },
          { icon: Download, title: "PDF & Excel", text: "Export manual untuk meeting atau audit data dengan format siap bagikan." },
          { icon: Send, title: "Auto Email", text: "Kirim laporan otomatis ke PIC dan manager sesuai jadwal." },
          { icon: Workflow, title: "Article Performance", text: "Views, engagement, conversion, publish cadence, dan approval bottleneck." },
        ]}
      />
    </ModuleShell>
  );
}
