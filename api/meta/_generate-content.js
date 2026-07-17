import "./_load-env.js";
import { json } from "./_meta-client.js";

const getAiProviderConfig = () => {
  const apiKey =
    process.env.ALIBABA_MODEL_STUDIO_API_KEY ||
    process.env.ALIBABA_API_KEY ||
    process.env.DASHSCOPE_API_KEY;

  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl: (process.env.ALIBABA_MODEL_STUDIO_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1").replace(/\/$/, ""),
    model: process.env.ALIBABA_MODEL || "qwen3.7-plus",
  };
};

const extractJsonObject = (text) => {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced || text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch (err) {
    console.error("Failed to parse extracted JSON:", err);
    return null;
  }
};

const isLouderTechnologiesAccount = (account = {}) => {
  const accountText = [
    account.username,
    account.name,
    account.biography,
    account.website,
  ].filter(Boolean).join(" ").toLowerCase();

  return /louder\s*technologies|loudertechnologies|louder-technologies/.test(accountText);
};

const cleanAiText = (value) => {
  if (typeof value !== "string") return "";

  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line
      .replace(/^\s*[-–—/\\|•*]+\s*/g, "")
      .replace(/\s+([,.!?;:])/g, "$1")
      .replace(/[ \t]{2,}/g, " ")
      .trim())
    .filter(Boolean)
    .join("\n")
    .trim();
};

const cleanStringArray = (value, limit = 12) =>
  Array.isArray(value)
    ? value.map(cleanAiText).filter(Boolean).slice(0, limit)
    : [];

const cleanObjectArray = (value, shape, limit = 12) =>
  Array.isArray(value)
    ? value.slice(0, limit).map((item) => Object.fromEntries(
      Object.keys(shape).map((key) => [key, cleanAiText(item?.[key])]),
    )).filter((item) => Object.values(item).some(Boolean))
    : [];

const getCarouselSlideTemplate = (index, selectedIdea = {}, isEnglish = false) => {
  const idea = cleanAiText(selectedIdea.idea) || (isEnglish ? "main idea" : "ide utama");
  const pillar = cleanAiText(selectedIdea.pillar) || (isEnglish ? "context" : "konteks");
  const objective = cleanAiText(selectedIdea.objective) || (isEnglish ? "audience action" : "aksi audiens");
  const slides = isEnglish
    ? [
      ["Start with the real problem", `Open with the audience situation behind: ${idea}`, "A clear lifestyle/product image that shows the problem"],
      ["Why it matters now", `Explain the pain point in one practical sentence and connect it to ${pillar}.`, "Close-up detail or comparison visual"],
      ["What usually goes wrong", "Mention the common mistake without sounding judgmental.", "Simple visual contrast between old habit and better option"],
      ["A better way to approach it", "Give one useful step that feels easy to apply today.", "Product/process visual with clean text overlay"],
      ["Proof or reason to believe", `Show why this matters for ${objective}.`, "Testimonial, result, or feature-detail visual"],
      ["What to do next", "Invite the audience to save, share, comment, or DM with a clear reason.", "Brand/product visual with soft CTA area"],
    ]
    : [
      ["Mulai dari masalah audiens", `Buka dengan situasi nyata di balik: ${idea}`, "Visual lifestyle/produk yang langsung menunjukkan masalah"],
      ["Kenapa ini penting sekarang", `Jelaskan pain point secara praktis dan hubungkan dengan ${pillar}.`, "Close-up detail atau visual perbandingan"],
      ["Kesalahan yang sering terjadi", "Sebutkan kebiasaan yang kurang tepat tanpa terasa menggurui.", "Kontras visual antara cara lama dan cara yang lebih baik"],
      ["Cara yang lebih enak dilakukan", "Berikan satu langkah yang mudah dipraktikkan hari ini.", "Visual produk/proses dengan overlay teks bersih"],
      ["Alasan audiens percaya", `Tunjukkan kenapa ini relevan untuk ${objective}.`, "Visual bukti, hasil, testimoni, atau detail fitur"],
      ["Ajak audiens bergerak", "Minta audiens save, share, komentar, atau DM dengan alasan yang jelas.", "Visual brand/produk dengan area CTA yang rapi"],
    ];
  const [headline, copy, visual] = slides[index % slides.length];

  return {
    slide: String(index + 1),
    headline,
    visual,
    copy,
  };
};

const ensureCarouselSlides = ({ slides, selectedIdea, isEnglish }) => {
  const cleaned = cleanObjectArray(slides, {
    slide: "",
    headline: "",
    visual: "",
    copy: "",
  }, 8);
  const targetCount = Math.max(5, Math.min(8, cleaned.length || 6));

  while (cleaned.length < targetCount) {
    cleaned.push(getCarouselSlideTemplate(cleaned.length, selectedIdea, isEnglish));
  }

  return cleaned.slice(0, targetCount).map((slide, index) => ({
    slide: String(index + 1),
    headline: slide.headline || getCarouselSlideTemplate(index, selectedIdea, isEnglish).headline,
    visual: slide.visual || getCarouselSlideTemplate(index, selectedIdea, isEnglish).visual,
    copy: slide.copy || getCarouselSlideTemplate(index, selectedIdea, isEnglish).copy,
  }));
};

const normalizeGeneratedContent = ({ result, selectedIdea, contentType, isEnglish }) => {
  const normalizedType = String(contentType || result?.contentType || "").toLowerCase();
  const content = result?.content && typeof result.content === "object" ? result.content : {};
  const caption = result?.caption && typeof result.caption === "object" ? result.caption : {};
  const metadata = result?.metadata && typeof result.metadata === "object" ? result.metadata : {};

  const normalized = {
    contentType: normalizedType,
    title: cleanAiText(result?.title) || cleanAiText(selectedIdea.idea) || (isEnglish ? "Content draft" : "Draf konten"),
    caption: {
      hook: cleanAiText(caption.hook),
      body: cleanAiText(caption.body),
      cta: cleanAiText(caption.cta),
      hashtags: cleanStringArray(caption.hashtags, 18).map((tag) => tag.startsWith("#") ? tag : `#${tag.replace(/^#+/, "")}`),
    },
    content: {
      script: cleanObjectArray(content.script, {
        timecode: "",
        visual: "",
        voiceOver: "",
        onScreenText: "",
      }),
      storyFrames: cleanObjectArray(content.storyFrames, {
        frame: "",
        visual: "",
        text: "",
        stickerOrCta: "",
      }),
      carouselSlides: [],
      article: cleanAiText(content.article),
    },
    metadata: {
      visualDirection: cleanAiText(metadata.visualDirection),
      shotList: cleanStringArray(metadata.shotList),
      publishChecklist: cleanStringArray(metadata.publishChecklist),
    },
  };

  if (normalizedType === "carousel") {
    const assistantSlides = selectedIdea?.assistant?.carouselSlides;
    normalized.content.carouselSlides = ensureCarouselSlides({
      slides: content.carouselSlides?.length ? content.carouselSlides : assistantSlides,
      selectedIdea,
      isEnglish,
    });
  }

  return normalized;
};

const getLouderTechnologiesInstructions = () => [
  "Special rule for LouderTechnologies only:",
  "Write all generated content in English with simple, easy-to-understand grammar.",
  "Use a Human Experience First approach: start from real user needs, daily problems, project situations, or product challenges.",
  "Include Technical Experience, but explain it in a clear and light way. Avoid heavy technical language unless it is needed.",
  "Connect the story to a specific LouderTechnologies product, system, feature, project, or solution. Avoid generic content.",
  "Make the content relatable by using realistic work, customer, project, or industry situations.",
  "Use storytelling based on the project or product: problem, situation, solution, and result.",
  "Keep the tone professional, helpful, practical, and easy to follow.",
];

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== "POST") {
    json(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await new Promise((resolve, reject) => {
      let raw = "";
      request.on("data", (chunk) => {
        raw += chunk;
      });
      request.on("end", () => {
        try {
          resolve(raw ? JSON.parse(raw) : {});
        } catch (error) {
          reject(error);
        }
      });
      request.on("error", reject);
    });

    const { selectedIdea, contentType, account } = body;
    if (!selectedIdea || !contentType) {
      json(response, 400, { error: "Missing selectedIdea or contentType" });
      return;
    }

    const isLouderTechnologies = isLouderTechnologiesAccount(account);
    const authHeader = request.headers.authorization || request.headers.Authorization;

    const apiBaseUrl = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:8080";
    const targetUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/meta/generate-content`;

    const backendResponse = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {})
      },
      body: JSON.stringify(body)
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      throw new Error(errorText || `Backend returned status ${backendResponse.status}`);
    }

    const result = await backendResponse.json();

    json(response, 200, normalizeGeneratedContent({
      result,
      selectedIdea,
      contentType,
      isEnglish: isLouderTechnologies,
    }));
  } catch (error) {
    json(response, 500, { error: error.message || "Content generation failed." });
  }
}
