import { apiRequest, buildApiUrl, clientName, getAuthToken } from "./api";

export type ChatbotMessage = {
  role: "user" | "assistant";
  content: string;
};

export type StreamChatbotPayload = {
  session_id?: string;
  message: string;
  history?: ChatbotMessage[];
  context?: string;
  client_key?: string;
};

export async function streamChatbot(
  payload: StreamChatbotPayload,
  onToken: (token: string) => void,
) {
  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  });
  const token = getAuthToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildApiUrl("/api/chatbot"), {
    method: "POST",
    headers,
    body: JSON.stringify({
      client_key: clientName,
      ...payload,
    }),
  });

  if (!response.ok || !response.body) {
    let message = "Chatbot error";
    try {
      const errorBody = await response.json();
      message = errorBody.message || errorBody.error || message;
    } catch {
      // Keep fallback for non-JSON errors.
    }
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() || "";

    for (const event of events) {
      const dataLines = event
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace(/^data:\s?/, ""));
      const data = dataLines.join("\n").trim();

      if (!data || data === "[DONE]") continue;

      try {
        const json = JSON.parse(data);
        const token = json.choices?.[0]?.delta?.content || "";
        if (token) onToken(token);
      } catch {
        // Ignore malformed/incomplete SSE events.
      }
    }
  }
}

export async function fetchChatbotContext(clientKey = clientName) {
  const result = await apiRequest<{ success?: boolean; data?: { context?: string } | string; context?: string }>(
    "/api/chatbot/context",
    {
      method: "GET",
      query: { client_key: clientKey },
    },
  );

  if (typeof result.data === "string") return result.data;
  return result.data?.context || result.context || "";
}

export async function createChatbotSession(payload: { title: string; client_key?: string }) {
  return apiRequest<{ success?: boolean; data?: { id?: string; session_id?: string } }>("/api/chatbot/sessions", {
    method: "POST",
    body: JSON.stringify({
      client_key: clientName,
      ...payload,
    }),
  });
}
