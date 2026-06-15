import type { ReactNode } from "react";

const images = [
  { id: 1, src: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&q=80", alt: "concert crowd" },
  { id: 2, src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80", alt: "festival lights" },
  { id: 3, src: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&q=80", alt: "stage performance" },
  { id: 4, src: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=300&q=80", alt: "DJ set" },
  { id: 5, src: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&q=80", alt: "crowd aerial" },
  { id: 6, src: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=300&q=80", alt: "neon lights" },
  { id: 7, src: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=300&q=80", alt: "DJ booth" },
  { id: 8, src: "https://images.unsplash.com/photo-1563841930606-67e2bce48b78?w=300&q=80", alt: "concert stage" },
  { id: 9, src: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&q=80", alt: "music festival" },
  { id: 10, src: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&q=80", alt: "laser show" },
  { id: 11, src: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80", alt: "nightclub" },
  { id: 12, src: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=300&q=80", alt: "music event" },
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

function AuthImageGrid({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={[
        "hidden h-[640px] w-[640px] shrink-0 grid-cols-4 grid-rows-3 gap-1.5 overflow-hidden rounded-[25px] lg:grid",
        side === "left" ? "order-1" : "order-2",
      ].join(" ")}
    >
      {images.map((image) => (
        <div key={image.id} className="overflow-hidden rounded-lg bg-[#1a1a1a]">
          <img
            src={image.src}
            alt={image.alt}
            className="h-full w-full object-cover grayscale transition duration-300 hover:scale-[1.03] hover:grayscale-0"
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
  mode: "login" | "register";
  children: ReactNode;
}) {
  const gridSide = mode === "login" ? "left" : "right";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0a0a0a] px-3 py-6 text-white sm:px-5 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-[1160px] items-center justify-center gap-8 lg:min-h-[calc(100vh-80px)]">
        <AuthImageGrid side={gridSide} />
        <section
          className={[
            "relative z-10 flex min-h-[640px] w-full max-w-[470px] flex-col rounded-[20px] bg-[#111] px-5 py-8 shadow-[0_0_0_1px_#2b2b2b,0_24px_70px_rgba(0,0,0,0.55)] sm:px-9 lg:px-[46px] lg:py-[46px]",
            mode === "login" ? "order-2" : "order-1",
          ].join(" ")}
        >
          <div className="mb-10 flex min-h-[46px] items-center justify-center">
            <img src="/img/GMT Suite-02 1.png" alt="GMT Suite" className="h-[42px] w-[92px] object-contain" />
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
