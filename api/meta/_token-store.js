import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const STORE_PATH =
  process.env.META_TOKEN_STORE_PATH ||
  path.join(os.tmpdir(), "gmtgroupbe-meta-token-store.json");

const envTokenBundle = () => {
  const {
    META_ACCESS_TOKEN,
    META_USER_ACCESS_TOKEN,
    META_PAGE_ACCESS_TOKEN,
    META_IG_ACCESS_TOKEN,
    META_PAGE_ID,
    META_IG_USER_ID,
    META_IG_USERNAME,
  } = process.env;
  const userAccessToken = META_USER_ACCESS_TOKEN || META_ACCESS_TOKEN || "";
  const directInstagramToken = META_IG_ACCESS_TOKEN || "";
  const directAccessToken = directInstagramToken || META_PAGE_ACCESS_TOKEN || "";

  if (!userAccessToken && !directAccessToken) {
    return null;
  }

  return {
    userAccessToken,
    pages:
      directAccessToken && META_IG_USER_ID
        ? [
            {
              id: META_PAGE_ID || META_IG_USER_ID,
              name: META_IG_USERNAME ? `@${META_IG_USERNAME}` : "Direct Instagram account",
              access_token: directAccessToken,
              instagram_business_account: {
                id: META_IG_USER_ID,
                username: META_IG_USERNAME || undefined,
              },
            },
          ]
        : [],
    source: "env",
    savedAt: new Date().toISOString(),
  };
};

export const readTokenBundle = async () => {
  const fromEnv = envTokenBundle();

  if (fromEnv) {
    return fromEnv;
  }

  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
};

export const writeTokenBundle = async (bundle) => {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(
    STORE_PATH,
    JSON.stringify({ ...bundle, source: "file", savedAt: new Date().toISOString() }, null, 2),
    "utf8",
  );
};

export const getStorePath = () => STORE_PATH;
