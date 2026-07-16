import url from "node:url";

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

const json = (res, status, data) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
};

export default async function handler(request, response) {
  // CORS Headers
  response.setHeader("Access-Control-Allow-Origin", "*");
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

    const { message, history = [], context = "" } = body;

    if (!message) {
      json(response, 400, { error: "Message is required" });
      return;
    }

    const config = getAiProviderConfig();
    if (!config) {
      json(response, 500, { error: "Missing Alibaba Model Studio API key configuration." });
      return;
    }

    // Build the messages array
    const systemPrompt = [
      "You are 'GMT Group Assistant', a helpful, professional, and friendly chatbot. You answer questions about GMT Group products, articles, websites, and social media analytics using the live context provided below.",
      "Always reply in Indonesian. Be concise, informative, and format your answers with nice Markdown (such as bullet points, bold text, or lists).",
      "If the answer cannot be found in the provided context, answer politely based on general knowledge but notify the user that it is outside the current dashboard data.",
      "",
      "--- LIVE DASHBOARD CONTEXT ---",
      context || "No context data is currently loaded.",
      "------------------------------"
    ].join("\n");

    const apiMessages = [
      { role: "system", content: systemPrompt }
    ];

    // Append history (limit to last 10 messages to save context space)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role && msg.content) {
        apiMessages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content
        });
      }
    }

    // Append the current message
    apiMessages.push({ role: "user", content: message });

    const aiResponse = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    const text = await aiResponse.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { error: { message: text } };
    }

    if (!aiResponse.ok) {
      const errorMsg = payload.error?.message || payload.message || "Failed to call AI model.";
      throw new Error(errorMsg);
    }

    const reply = payload.choices?.[0]?.message?.content || "";
    json(response, 200, { reply });
  } catch (error) {
    console.error("Chatbot API error:", error);
    json(response, 500, { error: error.message || "Internal server error" });
  }
}
