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

function AuthVisual({ collage, large }: { collage: boolean; large: boolean }) {
  if (!collage) {
    return (
      <div className={`hidden shrink-0 overflow-hidden rounded-[24px] lg:block ${large ? "h-[800px] w-[800px]" : "h-[680px] w-[680px]"}`}>
        <img
          src="/img/bglogin2.png"
          alt="GMT Suite event background"
          className="h-full w-full object-cover transition duration-300 hover:scale-[1.02] hover:saturate-[1.08]"
        />
      </div>
    );
  }

  return (
    <div className="hidden h-[800px] w-[800px] shrink-0 grid-cols-4 grid-rows-3 gap-1.5 overflow-hidden rounded-[24px] lg:grid">
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
  const useLargeLayout = isRegister || useCollage;

  return (
    <main className={`flex h-[100dvh] items-center justify-center overflow-hidden bg-[#0a0a0a] px-3 font-sans text-white sm:px-5 ${useLargeLayout ? "" : "border-t-[3px] border-[#f1d900]"}`}>
      <style>{`
        .gmt-auth-panel h1 { font-size: 23px !important; line-height: 1.2 !important; }
        .gmt-auth-panel form label > span,
        .gmt-auth-panel form label > div > span { font-size: 12px !important; }
        .gmt-auth-panel form input { min-height: 42px !important; padding-left: 16px !important; padding-right: 16px !important; font-size: 14px !important; border-radius: 6px !important; }
        .gmt-auth-panel form button[type="submit"] { min-height: 44px !important; font-size: 14px !important; border-radius: 6px !important; }
        .gmt-auth-recovery form input { min-height: 48px !important; }
        .gmt-auth-recovery form button[type="submit"] { min-height: 50px !important; }
        @media (max-height: 760px) and (min-width: 1024px) { .gmt-auth-stage { zoom: 0.88; } }
        @media (max-height: 650px) and (min-width: 1024px) { .gmt-auth-stage { zoom: 0.75; } }
        @media (max-width: 1023px) {
          .gmt-auth-panel h1 { font-size: 23px !important; }
          .gmt-auth-panel form input { font-size: 12px !important; }
          .gmt-auth-panel form button[type="submit"] { font-size: 12px !important; }
        }
      `}</style>
      <div className={`gmt-auth-stage mx-auto flex h-auto w-full shrink-0 items-center justify-center gap-5 ${useLargeLayout ? "max-w-[1410px]" : "max-w-[1200px]"}`}>
        <div className={isRegister ? "order-2" : "order-1"}>
          <AuthVisual collage={useCollage} large={useLargeLayout} />
        </div>
        <section
          className={`gmt-auth-panel ${useCollage ? "gmt-auth-recovery" : ""} relative z-10 flex min-h-[640px] w-full flex-col overflow-hidden rounded-[24px] bg-[#111] px-5 py-8 shadow-[0_0_0_1px_#303030,0_24px_70px_rgba(0,0,0,0.55)] sm:px-8 ${useLargeLayout ? "max-w-[590px] lg:min-h-[800px] lg:px-[59px] lg:py-[60px]" : "max-w-[500px] lg:min-h-[680px] lg:px-[46px] lg:py-[42px]"} ${
            isRegister ? "order-1" : "order-2"
          }`}
        >
          <a href="/mygmt" className={`flex items-center justify-center ${useLargeLayout ? "mb-[34px] min-h-[48px]" : "mb-[30px] min-h-[48px]"}`}>
            <img src="/img/GMT Suite-02 1.png" alt="GMT Suite" className={`object-contain ${useLargeLayout ? "h-[48px] w-[120px]" : "h-[48px] w-[100px]"}`} />
          </a>
          {children}
        </section>
      </div>
    </main>
  );
}