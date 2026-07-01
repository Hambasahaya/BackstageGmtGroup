import { Camera, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";

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
  const [model, setModel] = useState<blazeface.BlazeFaceModel | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [validationMessage, setValidationMessage] = useState<string>("Memuat AI...");
  const validationLoopRef = useRef<number>(undefined);

  useEffect(() => {
    let isMounted = true;
    const loadModel = async () => {
      try {
        await tf.ready();
        const loadedModel = await blazeface.load({ modelUrl: '/models/blazeface/model.json' });
        if (isMounted) {
          setModel(loadedModel);
          setValidationMessage("Menganalisa kamera...");
        }
      } catch (err) {
        if (isMounted) setError("Gagal memuat model AI TensorFlow.");
      }
    };
    void loadModel();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!model || !videoRef.current || !stream) return;
    let isRunning = true;

    const validateFrame = async () => {
      if (!isRunning || !videoRef.current) return;
      const video = videoRef.current;

      if (video.readyState === 4) { // HAVE_ENOUGH_DATA
        try {
          const predictions = await model.estimateFaces(video, false);
          
          if (overlayType === "ktp") {
            if (predictions.length > 0) {
              const face = predictions[0];
              const topLeft = face.topLeft as [number, number];
              const bottomRight = face.bottomRight as [number, number];
              const faceCenterX = topLeft[0] + (bottomRight[0] - topLeft[0]) / 2;
              
              // Cek apakah pusat wajah berada di sisi kanan dari video
              const isRightSide = faceCenterX > video.videoWidth * 0.45;

              if (isRightSide) {
                setIsValid(true);
                setValidationMessage("Posisi KTP sudah pas");
              } else {
                setIsValid(false);
                setValidationMessage("Pastikan foto wajah pada KTP berada di kotak bagian kanan");
              }
            } else {
              setIsValid(false);
              setValidationMessage("Wajah KTP tidak terdeteksi. Posisikan KTP lebih jelas.");
            }
          } else {
            // Mode selfie
            if (predictions.length > 0) {
              setIsValid(true);
              setValidationMessage("Wajah terdeteksi");
            } else {
              setIsValid(false);
              setValidationMessage("Posisikan wajah Anda ke kamera");
            }
          }
        } catch (err) {
          // abaikan error frame drop
        }
      }

      if (isRunning) {
        validationLoopRef.current = requestAnimationFrame(validateFrame);
      }
    };

    void validateFrame();

    return () => {
      isRunning = false;
      if (validationLoopRef.current) {
        cancelAnimationFrame(validationLoopRef.current);
      }
    };
  }, [model, stream, overlayType]);

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
            
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center overflow-hidden p-6">
              {overlayType === "ktp" && (
                <div className={`relative aspect-[856/540] w-full max-w-md rounded-xl border-2 transition-colors duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] ${isValid ? "border-emerald-400" : "border-white/20"}`}>
                  {/* Corners */}
                  <div className={`absolute -left-1 -top-1 h-8 w-8 border-l-4 border-t-4 transition-colors ${isValid ? "border-emerald-400" : "border-teal-400"}`}></div>
                  <div className={`absolute -right-1 -top-1 h-8 w-8 border-r-4 border-t-4 transition-colors ${isValid ? "border-emerald-400" : "border-teal-400"}`}></div>
                  <div className={`absolute -bottom-1 -left-1 h-8 w-8 border-b-4 border-l-4 transition-colors ${isValid ? "border-emerald-400" : "border-teal-400"}`}></div>
                  <div className={`absolute -bottom-1 -right-1 h-8 w-8 border-b-4 border-r-4 transition-colors ${isValid ? "border-emerald-400" : "border-teal-400"}`}></div>
                  
                  {/* Tanda area kanan (panduan visual) */}
                  <div className="absolute bottom-0 right-0 top-0 w-1/3 border-l-2 border-dashed border-white/20 bg-white/5"></div>
                </div>
              )}
              
              <div className="mt-8 rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm">
                {!model ? (
                  <p className="flex items-center gap-2 text-sm font-semibold text-white/90">
                    <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                    {validationMessage}
                  </p>
                ) : (
                  <p className={`text-sm font-bold ${isValid ? "text-emerald-400" : "text-amber-400"}`}>
                    {validationMessage}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex h-32 shrink-0 items-center justify-center bg-black pb-8 pt-4">
        <button
          onClick={handleCapture}
          disabled={!stream || !isValid}
          className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-teal-500 text-white transition active:scale-95 disabled:opacity-50 disabled:bg-slate-500"
        >
          <Camera className="h-8 w-8" />
        </button>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
