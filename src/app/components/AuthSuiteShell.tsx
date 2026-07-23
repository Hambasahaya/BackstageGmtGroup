import type { ReactNode } from "react";

const collageImages = [
  "3A1643C7-C6C5-4189-926C-B823C9737589 1.png",
  "DSC00683 1.png",
  "DSC00810 1.png",
  "DSC00810 2.png",
  "DSC00958 1.png",
  "DSC01448 1.png",
  "DSC01924 1.png",
  "DSC02157 1.png",
  "DSC02197 1.png",
  "DSC03263 1.png",
  "DSC03528 1.png",
  "DSC05135 1.png",
];

export function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 38 38" stroke="currentColor" className="animate-spin" aria-hidden="true">
      <g fill="none" fillRule="evenodd">
        <g transform="translate(1 1)" strokeWidth="2">
          <circle strokeOpacity=".3" cx="18" cy="18" r="18" />
          <path d="M36 18c0-9.94-8.06-18-18-18" />
        </g>
      </g>
    </svg>
  );
}

function AuthVisual({ collage }: { collage: boolean }) {
  if (!collage) {
    return (
      <div className="hidden h-[640px] w-[640px] shrink-0 overflow-hidden rounded-[25px] lg:block">
        <img
          src="/img/bglogin2.png"
          alt="GMT Suite event background"
          className="h-full w-full object-cover transition duration-300 hover:scale-[1.02] hover:saturate-[1.08]"
        />
      </div>
    );
  }

  return (
    <div className="hidden h-[640px] w-[640px] shrink-0 grid-cols-4 grid-rows-3 gap-1.5 overflow-hidden rounded-[25px] lg:grid">
      {collageImages.map((image, index) => (
        <div key={image} className="overflow-hidden rounded-lg bg-[#1a1a1a]">
          <img
            src={`/img/login&registerpagesomg/${encodeURIComponent(image)}`}
            alt={`GMT event ${index + 1}`}
            className="h-full w-full object-cover transition duration-300 hover:scale-[1.03] hover:invert hover:saturate-125"
          />
        </div>
      ))}
    </div>
  );
}

export function AuthSuiteShell({
  mode,
  children,
}: {
  mode: "login" | "register" | "forgot-password" | "reset-password";
  children: ReactNode;
}) {
  const isRegister = mode === "register";
  const useCollage = mode === "forgot-password" || mode === "reset-password";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0a0a0a] px-3 py-6 font-sans text-white sm:px-5 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-[1150px] items-center justify-center gap-6 lg:min-h-[calc(100vh-80px)] lg:gap-0">
        <div className={isRegister ? "order-2" : "order-1"}>
          <AuthVisual collage={useCollage} />
        </div>
        <section
          className={`relative z-10 flex min-h-[640px] w-full max-w-[470px] flex-col overflow-y-auto rounded-[20px] bg-[#111] px-4 py-6 shadow-[0_0_0_1px_#2b2b2b,0_24px_70px_rgba(0,0,0,0.55)] sm:px-6 sm:py-8 lg:px-[46px] lg:py-[46px] ${
            isRegister ? "order-1" : "order-2"
          }`}
        >
          <a href="/mygmt" className="mb-7 flex min-h-[46px] items-center justify-center">
            <img src="/img/GMT Suite-02 1.png" alt="GMT Suite" className="h-[42px] w-[92px] object-contain" />
          </a>
          {children}
        </section>
      </div>
    </main>
  );
}