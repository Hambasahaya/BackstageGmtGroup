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
  return JSON.parse(candidate.slice(start, end + 1));
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const isLouderTechnologiesAccount = (account = {}) => {
  const accountText = [
    account.username,
    account.name,
    account.biography,
    account.website,
  ].filter(Boolean).join(" ").toLowerCase();

  return /louder\s*technologies|loudertechnologies|louder-technologies/.test(accountText);
};

const getLouderTechnologiesInstructions = () => [
  "Special rule for LouderTechnologies only:",
  "Write in English only, using simple grammar and clear wording.",
  "Use a Human Experience First approach: start from real user needs, daily problems, project situations, or product challenges.",
  "Include Technical Experience, but keep it clear and light. Explain technical terms in a simple way.",
  "Connect every idea to a specific LouderTechnologies product, system, feature, project, or solution.",
  "Make the content relatable with realistic customer, project, work, or industry situations.",
  "Use storytelling based on the project or product: problem, situation, solution, and result.",
  "Keep the tone professional, helpful, practical, and easy to understand.",
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
          content: "You are a senior social media strategist. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      ...(useResponseFormat ? { response_format: { type: "json_object" } } : {}),
      temperature: 0.4,
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
  if (!parsed) throw new Error("Alibaba Model Studio returned invalid JSON.");
  return parsed;
};

const renderList = (items = []) =>
  items.length
    ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "<p>-</p>";

const renderBriefHtml = ({ account, brief, isLouderTechnologies = false }) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(brief.title || "Reference Brief")}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; line-height: 1.5; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    h2 { font-size: 18px; margin-top: 24px; border-bottom: 1px solid #d1d5db; padding-bottom: 6px; }
    h3 { font-size: 15px; margin-bottom: 4px; }
    p, li { font-size: 12px; }
    .muted { color: #6b7280; }
    .box { border: 1px solid #d1d5db; padding: 10px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>${escapeHtml(brief.title || "Reference Brief")}</h1>
  <p class="muted">${isLouderTechnologies ? "Account" : "Akun"}: ${escapeHtml(account?.username || "-")} | ${isLouderTechnologies ? "Generated with Alibaba Model Studio" : "Dibuat dengan Alibaba Model Studio"}</p>
  <h2>${isLouderTechnologies ? "Strategy Summary" : "Ringkasan Strategi"}</h2>
  <p>${escapeHtml(brief.summary || "-")}</p>
  <h2>${isLouderTechnologies ? "Reference Patterns Used" : "Pola Referensi Yang Dipakai"}</h2>
  ${renderList(brief.referencePatterns || [])}
  <h2>Content Pillars</h2>
  ${renderList(brief.contentPillars || [])}
  <h2>${isLouderTechnologies ? "Brief Recommendations" : "Rekomendasi Brief"}</h2>
  ${(brief.briefs || []).map((item, index) => `
    <div class="box">
      <h3>${index + 1}. ${escapeHtml(item.title || item.format || "Brief")}</h3>
      <p><strong>Format:</strong> ${escapeHtml(item.format || "-")}</p>
      <p><strong>Hook:</strong> ${escapeHtml(item.hook || "-")}</p>
      <p><strong>Angle:</strong> ${escapeHtml(item.angle || "-")}</p>
      <p><strong>${isLouderTechnologies ? "Execution" : "Eksekusi"}:</strong> ${escapeHtml(item.execution || "-")}</p>
      <p><strong>CTA:</strong> ${escapeHtml(item.cta || "-")}</p>
    </div>
  `).join("")}
  <h2>${isLouderTechnologies ? "Production Checklist" : "Checklist Produksi"}</h2>
  ${renderList(brief.productionChecklist || [])}
  <h2>${isLouderTechnologies ? "Publish Checklist" : "Checklist Publish"}</h2>
  ${renderList(brief.publishChecklist || [])}
</body>
</html>`;

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

    const isLouderTechnologies = isLouderTechnologiesAccount(body.account);
    const prompt = [
      isLouderTechnologies
        ? "You are applying the Social Media Manager skill for the LouderTechnologies Instagram account."
        : "You are applying the Social Media Manager skill for an Indonesian Instagram account.",
      "Skill reference: https://claudemarketplaces.com/skills/alirezarezvani/claude-skills/social-media-manager",
      "Create a Word-ready strategic brief from the provided reference cards.",
      "References are inspiration only. Do not copy them, do not treat them as performance data, and adapt all ideas to the selected account.",
      ...(isLouderTechnologies ? getLouderTechnologiesInstructions() : []),
      "Return only valid JSON. No markdown. No commentary.",
      "Schema: {\"title\":\"\",\"summary\":\"\",\"referencePatterns\":[\"\"],\"contentPillars\":[\"\"],\"briefs\":[{\"title\":\"\",\"format\":\"\",\"hook\":\"\",\"angle\":\"\",\"execution\":\"\",\"cta\":\"\"}],\"productionChecklist\":[\"\"],\"publishChecklist\":[\"\"]}",
      isLouderTechnologies ? "For every field, use English only with simple grammar and clear structure." : "For every field, use Bahasa Indonesia.",
      JSON.stringify({
        account: body.account,
        mainRecommendation: body.mainRecommendation,
        selectedBrief: body.selectedBrief,
        references: body.references,
      }),
    ].join("\n");

    const brief = await callAiJson(prompt);
    const filenameBase = (body.account?.username || "instagram-reference-brief").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");

    json(response, 200, {
      filename: `${filenameBase}-reference-brief.doc`,
      html: renderBriefHtml({ account: body.account, brief, isLouderTechnologies }),
    });
  } catch (error) {
    json(response, 500, { error: error.message || "Reference brief generation failed." });
  }
}
