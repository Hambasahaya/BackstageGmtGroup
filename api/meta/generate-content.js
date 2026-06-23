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

    const prompt = [
      "You are a Senior Social Media Copywriter and SEO Content Specialist for GMT Group (Indonesia).",
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
      "Always generate content in BAHASA INDONESIA, with engaging and highly professional copywriting.",
      "",
      "JSON Schema:",
      "{",
      '  "contentType": "' + contentType + '",',
      '  "title": "Title / main focus of this content",',
      '  "caption": {',
      '    "hook": "Copywriting hook untuk baris pertama caption",',
      '    "body": "Isi caption utama yang persuasif dan lengkap",',
      '    "cta": "Call to action yang jelas",',
      '    "hashtags": ["list", "of", "relevant", "hashtags"]',
      "  },",
      '  "content": {',
      '    "script": [  // ONLY include this array if target contentType is "reals" or "reels" or "video"',
      '      {"timecode": "0-3s", "visual": "deskripsi visual adegan", "voiceOver": "dialog / suara pengisi", "onScreenText": "teks di layar"}',
      "    ],",
      '    "storyFrames": [ // ONLY include this array if target contentType is "story"',
      '      {"frame": "1", "visual": "visual frame", "text": "teks overlay/sticker", "stickerOrCta": "fitur interaksi (poll/question/link)"}',
      "    ],",
      '    "carouselSlides": [ // ONLY include this array if target contentType is "carousel"',
      '      {"slide": "1", "headline": "Headline slide", "visual": "visual slide", "copy": "bullet points/keterangan slide"}',
      "    ],",
      '    "article": "Full markdown string containing the generated article with heading tags (#, ##, ###), intro, body sections, conclusion, and FAQs. ONLY include this string if target contentType is \\"artikel\\""',
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
    json(response, 200, result);
  } catch (error) {
    json(response, 500, { error: error.message || "Content generation failed." });
  }
}
