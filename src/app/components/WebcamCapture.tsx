import { Camera, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function WebcamCapture({
  onCapture,
  onClose,
  overlayType = "ktp",
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
  overlayType?: "ktp" | "selfie";
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: overlayType === "ktp" ? "environment" : "user" },
          audio: false,
        });
        setStream(mediaStream);
        activeStream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError("Gagal mengakses kamera. Pastikan izin kamera diberikan ke browser Anda.");
      }
    };

    void startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [overlayType]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video intrinsic size for max resolution
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
      }
    }, "image/jpeg", 0.9);
  }, [onCapture]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950">
      <div className="absolute inset-x-0 top-0 z-10 flex h-16 items-center justify-between bg-black/40 px-4 text-white">
        <h2 className="text-lg font-semibold">{overlayType === "ktp" ? "Ambil Foto KTP" : "Ambil Selfie"}</h2>
        <button onClick={onClose} className="rounded-full p-2 hover:bg-white/20">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-900">
        {error ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm font-medium text-rose-500">
            {error}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />
            
            {/* Overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden p-6">
              {overlayType === "ktp" && (
                <div className="relative aspect-[856/540] w-full max-w-md rounded-xl border border-white/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]">
                  {/* Corners */}
                  <div className="absolute -left-1 -top-1 h-8 w-8 border-l-4 border-t-4 border-teal-400"></div>
                  <div className="absolute -right-1 -top-1 h-8 w-8 border-r-4 border-t-4 border-teal-400"></div>
                  <div className="absolute -bottom-1 -left-1 h-8 w-8 border-b-4 border-l-4 border-teal-400"></div>
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 border-b-4 border-r-4 border-teal-400"></div>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="px-4 text-center text-sm font-bold text-white/80 drop-shadow-md">
                      Posisikan KTP tepat di dalam area ini
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex h-32 shrink-0 items-center justify-center bg-black pb-8 pt-4">
        <button
          onClick={handleCapture}
          disabled={!stream}
          className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-teal-500 text-white transition active:scale-95 disabled:opacity-50"
        >
          <Camera className="h-8 w-8" />
        </button>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
