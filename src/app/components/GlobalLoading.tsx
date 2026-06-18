type GlobalLoadingProps = {
  message?: string;
};

export function GlobalLoading({ message = "Memuat..." }: GlobalLoadingProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4">
      <div className="w-full max-w-3xl text-center">
        <img
          src="/imgloading/gmt-orbit-loader.svg"
          alt="Memuat"
          className="mx-auto h-24 w-full object-contain"
        />
        <p className="mt-4 text-sm font-medium text-slate-600">{message}</p>
      </div>
    </div>
  );
}
