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

const callAiJson = async (prompt) => {
  const config = getAiProviderConfig();
  if (!config) throw new Error("Missing Alibaba Model Studio API key.");

  const requestAi = async (useResponseFormat) => fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "system",
          content: "You are a professional social media manager and content creator for GMT Group. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      ...(useResponseFormat ? { response_format: { type: "json_object" } } : {}),
      temperature: 0.55,
      max_tokens: 6000,
    }),
  });

  const readPayload = async (response) => {
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { message: text };
    }
  };

  let response = await requestAi(true);
  let payload = await readPayload(response);

  if (!response.ok) {
    const message = payload.error?.message || payload.message || "";
    if (/response_format|json_object|unsupported|invalid parameter/i.test(message)) {
      response = await requestAi(false);
      payload = await readPayload(response);
    }
  }

  if (!response.ok) {
    throw new Error(payload.error?.message || payload.message || "Alibaba Model Studio request failed.");
  }

  const text = payload.choices?.[0]?.message?.content || "";
  const parsed = extractJsonObject(text);
  if (!parsed) throw new Error("Alibaba Model Studio returned invalid JSON format.");
  return parsed;
};

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

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
    const languageInstruction = isLouderTechnologies
      ? "Always generate content in ENGLISH with simple grammar and clear wording."
      : "Always generate content in BAHASA INDONESIA, with engaging and highly professional copywriting.";
    const schemaLanguage = isLouderTechnologies ? {
      hook: "Simple English hook for the first caption line",
      body: "Main caption body in clear and practical English",
      cta: "Clear call to action in English",
      visual: "visual scene description",
      voiceOver: "voice over / spoken line in simple English",
      onScreenText: "short on-screen text in English",
      article: "Full English markdown article with heading tags (#, ##, ###), intro, body sections, conclusion, and FAQs. ONLY include this string if target contentType is \"artikel\"",
    } : {
      hook: "Copywriting hook untuk baris pertama caption",
      body: "Isi caption utama yang persuasif dan lengkap",
      cta: "Call to action yang jelas",
      visual: "deskripsi visual adegan",
      voiceOver: "dialog / suara pengisi",
      onScreenText: "teks di layar",
      article: "Full markdown string containing the generated article with heading tags (#, ##, ###), intro, body sections, conclusion, and FAQs. ONLY include this string if target contentType is \"artikel\"",
    };

    const prompt = [
      isLouderTechnologies
        ? "You are a Senior Social Media Copywriter and SEO Content Specialist for LouderTechnologies."
        : "You are a Senior Social Media Copywriter and SEO Content Specialist for GMT Group (Indonesia).",
      "Using the following input data, generate a complete content of the specified type.",
      `Target Type: ${contentType}`,
      "",
      "--- INPUT BRIEF DATA ---",
      `Format Awal: ${selectedIdea.format}`,
      `Ide Utama: ${selectedIdea.idea}`,
      `Content Pillar: ${selectedIdea.pillar}`,
      `Objective: ${selectedIdea.objective}`,
      `Format Guide: ${selectedIdea.formatGuide}`,
      `Yang dilakukan: ${selectedIdea.action}`,
      `Kenapa format ini: ${selectedIdea.reason}`,
      `Dampaknya: ${selectedIdea.impact}`,
      account ? `Username: @${account.username}\nBio: ${account.biography}` : "",
      "-------------------------",
      "",
      "Please adapt the brief to the target type and output it as JSON according to the schema rules below.",
      languageInstruction,
      ...(isLouderTechnologies ? getLouderTechnologiesInstructions() : []),
      "Write like a real social media specialist: warm, specific, natural, and ready to post.",
      "Do not prefix normal sentences with '-', '/', '|', bullet symbols, or decorative separators.",
      "Use clean sentences and natural line breaks instead of markdown-style bullets unless the field explicitly needs a short list.",
      contentType === "carousel"
        ? "Carousel requirement: return 5 to 8 distinct carouselSlides. Do not return only one slide. Each slide needs a different headline, visual direction, and copy."
        : "",
      "",
      "JSON Schema:",
      "{",
      '  "contentType": "' + contentType + '",',
      '  "title": "Title / main focus of this content",',
      '  "caption": {',
      `    "hook": "${schemaLanguage.hook}",`,
      `    "body": "${schemaLanguage.body}",`,
      `    "cta": "${schemaLanguage.cta}",`,
      '    "hashtags": ["list", "of", "relevant", "hashtags"]',
      "  },",
      '  "content": {',
      '    "script": [  // ONLY include this array if target contentType is "reals" or "reels" or "video"',
      `      {"timecode": "0-3s", "visual": "${schemaLanguage.visual}", "voiceOver": "${schemaLanguage.voiceOver}", "onScreenText": "${schemaLanguage.onScreenText}"}`,
      "    ],",
      '    "storyFrames": [ // ONLY include this array if target contentType is "story"',
      '      {"frame": "1", "visual": "visual frame", "text": "teks overlay/sticker", "stickerOrCta": "fitur interaksi (poll/question/link)"}',
      "    ],",
      '    "carouselSlides": [ // ONLY include this array if target contentType is "carousel"; MUST contain 5-8 items',
      '      {"slide": "1", "headline": "Hook utama", "visual": "visual slide pembuka", "copy": "kalimat pendek yang natural"},',
      '      {"slide": "2", "headline": "Konteks masalah", "visual": "visual pendukung", "copy": "kalimat pendek yang natural"},',
      '      {"slide": "3", "headline": "Insight penting", "visual": "visual detail", "copy": "kalimat pendek yang natural"},',
      '      {"slide": "4", "headline": "Solusi praktis", "visual": "visual solusi", "copy": "kalimat pendek yang natural"},',
      '      {"slide": "5", "headline": "CTA", "visual": "visual penutup", "copy": "ajakan save/share/comment/DM"}',
      "    ],",
      `    "article": "${schemaLanguage.article.replace(/"/g, '\\"')}"`,
      "  },",
      '  "metadata": {',
      '    "visualDirection": "Visual tone, font guidelines, coloring or audio instructions",',
      '    "shotList": ["shot 1 detail", "shot 2 detail"],',
      '    "publishChecklist": ["qa checklist before publish", "qa checklist 2"]',
      "  }",
      "}",
      "",
      "Generate a rich, thorough, production-ready copywriting or article draft. Avoid using placeholders or short generic sentences.",
      "Return ONLY valid JSON. No markdown fences like ```json. No commentary."
    ].join("\n");

    const result = await callAiJson(prompt);
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
