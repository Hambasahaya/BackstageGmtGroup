import { CalendarDays, Download, HelpCircle, ShieldCheck, Trash2 } from "lucide-react";
import type { ElementType } from "react";

type SimpleUserPageProps = {
  title: string;
  description: string;
  icon: ElementType;
  tone?: "default" | "danger";
};

function SimpleUserPage({ title, description, icon: Icon, tone = "default" }: SimpleUserPageProps) {
  const isDanger = tone === "danger";

  return (
    <div className="space-y-6">
      <div>
        <p className={`text-sm font-semibold uppercase tracking-wide ${isDanger ? "text-rose-600" : "text-[#0F766E]"}`}>
          {isDanger ? "Account Setting" : "Resources"}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">{description}</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isDanger ? "bg-rose-50 text-rose-600" : "bg-teal-50 text-[#0F766E]"}`}>
          <Icon className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-950">Coming Soon</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Halaman ini sudah disiapkan dari sidebar dan siap dihubungkan ke konten atau API saat datanya tersedia.
        </p>
      </div>
    </div>
  );
}

export function ResourceDownload() {
  return <SimpleUserPage title="Download" description="Akses file, dokumen, brosur, dan materi resmi GMT Group." icon={Download} />;
}

export function ResourceEventTraining() {
  return <SimpleUserPage title="Event & Training" description="Lihat informasi event, kelas, dan training yang tersedia untuk user." icon={CalendarDays} />;
}

export function ResourceWarranty() {
  return <SimpleUserPage title="Warranty" description="Informasi garansi, klaim, dan perlindungan produk atau layanan." icon={ShieldCheck} />;
}

export function ResourceHelpCenter() {
  return <SimpleUserPage title="Help Center" description="Pusat bantuan untuk pertanyaan umum, panduan, dan dukungan pengguna." icon={HelpCircle} />;
}

export function DeleteAccount() {
  return (
    <SimpleUserPage
      title="Delete Account"
      description="Kelola permintaan penghapusan akun dan data pengguna."
      icon={Trash2}
      tone="danger"
    />
  );
}