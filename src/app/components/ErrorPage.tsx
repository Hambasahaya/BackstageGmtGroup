import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router";

export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Terjadi Kesalahan Aplikasi";
  let message = "Maaf, terjadi kesalahan yang tidak terduga pada aplikasi.";
  let is404 = false;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Halaman Tidak Ditemukan (404)";
      message = "Halaman yang Anda cari tidak tersedia atau alamat URL telah berubah.";
      is404 = true;
    } else {
      title = `Error ${error.status}`;
      message = error.statusText || message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4 text-slate-900">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#0F766E]">
          {is404 ? "404 Not Found" : "Application Error"}
        </p>
        <h1 className="mt-1 text-xl font-bold text-slate-950">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{message}</p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => navigate("/", { replace: true })}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0F766E] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0D655E]"
          >
            <Home className="h-4 w-4" />
            Kembali ke Beranda
          </button>
          {!is404 && (
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Muat Ulang Halaman
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4 text-slate-900">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#0F766E]">404 Not Found</p>
        <h1 className="mt-1 text-xl font-bold text-slate-950">Halaman Tidak Ditemukan</h1>
        <p className="mt-2 text-sm text-slate-500">
          Halaman yang Anda tuju tidak ditemukan di sistem Website Pusat GMT Group.
        </p>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => navigate("/", { replace: true })}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0F766E] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0D655E]"
          >
            <Home className="h-4 w-4" />
            Kembali ke Beranda
          </button>
        </div>
      </section>
    </main>
  );
}
