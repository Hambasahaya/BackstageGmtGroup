import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const STORE_PATH = process.env.CONTENT_BRIEF_KNOWLEDGE_BASE_STORE_PATH || path.join(os.tmpdir(), "gmtgroupbe-model-knowledge-base.json");

export const readKnowledgeBaseStore = async () => {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    if (error?.code === "ENOENT") return {};
    return {};
  }
};

export const writeKnowledgeBaseStore = async (payload) => {
  const safePayload = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(safePayload, null, 2), "utf8");
  return safePayload;
};
