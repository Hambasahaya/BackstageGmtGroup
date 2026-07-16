import { useEffect, useRef, useState } from "react";
import { Bot, MessageSquare, RotateCcw, Send, Sparkles, X, Loader2 } from "lucide-react";
import { api } from "../services/api";
import { fetchChatbotContext, streamChatbot } from "../services/chatbot";
import { fetchWebsiteAnalytics } from "../services/websiteAnalytics";
import { fetchInstagramInsights } from "../services/metaIntegrations";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function DashboardChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState("");
  const [isFetchingContext, setIsFetchingContext] = useState(false);
  const [hasLoadedContext, setHasLoadedContext] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll messages area to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Load context data on open/load
  const loadContextData = async () => {
    if (hasLoadedContext || isFetchingContext) return;
    setIsFetchingContext(true);
    
    try {
      try {
        const backendContext = await fetchChatbotContext();
        if (backendContext.trim()) {
          setContext(backendContext);
          setHasLoadedContext(true);
          return;
        }
      } catch {
        // Fallback to browser-built context while the Go context endpoint is still a placeholder.
      }

      const [prodRes, artRes, webRes, igRes] = await Promise.allSettled([
        api.products(),
        api.articles({ limit: 50 }),
        fetchWebsiteAnalytics(30),
        fetchInstagramInsights(undefined, undefined, true),
      ]);

      const contextParts: string[] = [];

      // 1. Parse Products
      if (prodRes.status === "fulfilled" && prodRes.value.products) {
        const prodList = prodRes.value.products
          .map((p) => {
            const tiers = p.commission_tiers
              ? Object.entries(p.commission_tiers)
                  .map(([tier, val]) => `${tier}: Rp${val.toLocaleString("id-ID")}`)
                  .join(", ")
              : "Tidak ada tier khusus";
            return [
              `- Nama Produk: ${p.namaproduct}`,
              `  Harga: Rp${p.price.toLocaleString("id-ID")}`,
              `  Unit: ${p.unit || "unit"}`,
              `  Status: ${p.status}`,
              `  Komisi Utama: Rp${(p.komisi || 0).toLocaleString("id-ID")}`,
              `  Komisi Tiering: ${tiers}`,
              `  Deskripsi: ${p.deskripsi || "Tidak ada deskripsi."}`
            ].join("\n");
          })
          .join("\n\n");
        contextParts.push(`GMT Group Products (Daftar Lengkap Detail):\n${prodList}`);
      }

      // 2. Parse Articles
      if (artRes.status === "fulfilled" && artRes.value.articles) {
        const artList = artRes.value.articles
          .map((a) => `- ${a.title} (Kategori: ${a.category || "Umum"}, Status: ${a.status || "published"})`)
          .join("\n");
        contextParts.push(`GMT Group Articles:\n${artList}`);
      }

      // 3. Parse GA4 Websites
      if (webRes.status === "fulfilled" && webRes.value.properties) {
        const webList = webRes.value.properties
          .map(
            (p) =>
              `- ${p.name} (${p.domain}): Sesi=${p.totals.sessions}, Pengunjung=${p.totals.users}, Pageviews=${p.totals.pageviews}, Rerata Durasi=${p.totals.averageSessionDuration}s. Keyword Teratas: ${p.keywordPerformance
                ?.slice(0, 5)
                .map((k) => `${k.keyword} (${k.clicks} klik)`)
                .join(", ")}`
          )
          .join("\n");
        contextParts.push(`Website Google Analytics Data (30 Hari Terakhir):\n${webList}`);
      }

      // 4. Parse Instagram Insights
      if (igRes.status === "fulfilled" && igRes.value.connected && igRes.value.profile) {
        const profile = igRes.value.profile;
        const mediaList = (igRes.value.media || [])
          .slice(0, 10)
          .map((m) => {
            const metrics = `Likes: ${m.like_count || 0}, Comments: ${m.comments_count || 0}`;
            const aiStrategy = [
              m.ai_angle ? `Angle/Pillar: ${m.ai_angle}` : "",
              m.ai_reasoning ? `Analisis AI: ${m.ai_reasoning}` : "",
              m.ai_action ? `Saran Aksi: ${m.ai_action}` : ""
            ].filter(Boolean).join("\n    ");
            return [
              `- Post [ID: ${m.id}, Tipe: ${m.media_type}, Tanggal: ${m.timestamp ? new Date(m.timestamp).toLocaleDateString("id-ID") : "N/A"}]`,
              `  Metrik: ${metrics}`,
              `  Caption: ${m.caption || "Tidak ada caption."}`,
              aiStrategy ? `  Strategi Konten:\n    ${aiStrategy}` : ""
            ].filter(Boolean).join("\n");
          })
          .join("\n\n");
        const igData = [
          `Instagram Account: @${profile.username} (${profile.name})`,
          `Followers: ${profile.followers_count}, Total Media: ${profile.media_count}, Mengikuti: ${profile.follows_count || 0}`,
          `Daftar Postingan & Performa Detail:\n${mediaList}`,
        ].join("\n");
        contextParts.push(`Social Media (Instagram Insights & Post Analytics):\n${igData}`);
      }

      setContext(contextParts.join("\n\n"));
      setHasLoadedContext(true);
    } catch (err) {
      console.error("Gagal memuat konteks chatbot:", err);
    } finally {
      setIsFetchingContext(false);
    }
  };

  const handleToggleChat = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      void loadContextData();
      setTimeout(() => chatInputRef.current?.focus(), 150);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || message).trim();
    if (!query || isLoading) return;

    if (!textToSend) {
      setMessage("");
    }

    const nextMessages: Message[] = [...messages, { role: "user", content: query }];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      let assistantReply = "";

      // Add a blank message to compile the stream in real-time
      setMessages([...nextMessages, { role: "assistant", content: "" }]);
      setIsLoading(false); // Hide the loading indicator as streaming starts

      await streamChatbot(
        {
          message: query,
          history: messages,
          context,
        },
        (token) => {
          assistantReply += token;
          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === "assistant") {
              lastMsg.content = assistantReply;
            }
            return updated;
          });
        },
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Terjadi kesalahan koneksi.";
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === "assistant" && !lastMsg.content) {
          lastMsg.content = `Maaf, terjadi kesalahan: ${errMsg}`;
          return updated;
        }
        return [...nextMessages, { role: "assistant", content: `Maaf, terjadi kesalahan: ${errMsg}` }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
  };

  // Simple and premium React parser for chatbot markdown
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let cleanLine = line.trim();
      if (!cleanLine) return <div key={idx} className="h-1.5" />;

      const isBullet = cleanLine.startsWith("- ") || cleanLine.startsWith("* ") || cleanLine.startsWith("• ");
      if (isBullet) {
        cleanLine = cleanLine.replace(/^[-*•]\s+/, "");
      }

      // Handle bold tags **text** -> strong
      const parts = cleanLine.split(/\*\*([\s\S]*?)\*\*/g);
      const content = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return (
            <strong key={pIdx} className="font-bold text-teal-300">
              {part}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} className="list-disc ml-4 text-xs sm:text-sm my-1 text-slate-200 leading-relaxed">
            {content}
          </li>
        );
      }

      return (
        <p key={idx} className="text-xs sm:text-sm leading-relaxed mb-1 text-slate-200">
          {content}
        </p>
      );
    });
  };

  const suggestions = [
    { label: "Produk GMT Group", text: "Tampilkan daftar produk GMT Group beserta harga dan komisi." },
    { label: "Kinerja Website", text: "Bagaimana statistik performa pengunjung website GMT Group bulan ini?" },
    { label: "Artikel Terbaru", text: "Tampilkan daftar artikel terbaru beserta kategorinya." },
    { label: "Draf Instagram", text: "Buatkan saya draf draf ide postingan Instagram berdasarkan performa terbaru." },
  ];

  return (
    <>
      {/* Floating Toggle Button (Bottom Right) */}
      <button
        onClick={handleToggleChat}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-[0_8px_30px_rgba(15,118,110,0.4)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.6)] border border-teal-400/20 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none"
        title="Hubungi Asisten AI"
        aria-label="Toggle Chatbot"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6 group-hover:animate-bounce" />}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[420px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-8rem)] z-50 rounded-2xl shadow-2xl flex flex-col bg-slate-950/95 border border-slate-800 backdrop-blur-xl overflow-hidden transition-all duration-300 origin-bottom-right animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 to-teal-950/80 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100 leading-none">GMT Assistant</h3>
                <span className="text-[10px] text-slate-400">Grounded in Dashboard Live Data</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleResetChat}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition focus:outline-none"
                title="Reset Percakapan"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={handleToggleChat}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition focus:outline-none"
                title="Tutup Chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Context Loading Indicator */}
          {isFetchingContext && (
            <div className="bg-teal-950/30 border-b border-teal-900/30 px-4 py-1.5 flex items-center justify-center gap-2 text-[10px] text-teal-300">
              <Loader2 className="h-3 w-3 animate-spin" />
              Sinkronisasi data Dashboard...
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center px-4 py-6 space-y-4">
                <div className="h-12 w-12 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-400">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div className="space-y-1 max-w-[280px]">
                  <p className="text-sm font-medium text-slate-200">Ada yang bisa saya bantu?</p>
                  <p className="text-xs text-slate-500">
                    Asisten AI terintegrasi dengan data Produk, Artikel, Website, dan Sosial Media GMT Group.
                  </p>
                </div>
                {/* Suggestions List */}
                <div className="grid grid-cols-2 gap-2 w-full pt-2">
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(sug.text)}
                      className="text-left p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-teal-900/50 text-[11px] text-slate-300 hover:text-teal-300 transition-all duration-200 active:scale-98"
                    >
                      <span className="font-semibold block mb-0.5">{sug.label}</span>
                      <span className="text-[10px] text-slate-500 line-clamp-2">{sug.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 border text-slate-100 ${
                      msg.role === "user"
                        ? "bg-gradient-to-tr from-teal-800 to-teal-700/80 border-teal-700/40 text-white rounded-br-none shadow-[0_4px_12px_rgba(15,118,110,0.15)]"
                        : "bg-slate-900/60 border-slate-800 rounded-bl-none shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="space-y-1.5 select-text">{renderMarkdown(msg.content)}</div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1">
                    {msg.role === "user" ? "Anda" : "GMT Assistant"}
                  </span>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 text-slate-400 max-w-[80%] self-start shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-[9px] text-slate-600 mt-1 px-1">GMT Assistant sedang mengetik...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendMessage();
            }}
            className="p-3 border-t border-slate-850 bg-slate-950 flex gap-2 items-center"
          >
            <input
              ref={chatInputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isLoading ? "Sedang memproses..." : "Tanyakan sesuatu..."}
              disabled={isLoading}
              className="flex-1 bg-slate-900/80 hover:bg-slate-900 focus:bg-slate-900 border border-slate-800 focus:border-teal-700/50 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 outline-none placeholder-slate-600 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-md transition-colors active:scale-95 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
