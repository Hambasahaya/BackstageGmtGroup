import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const STORE_PATH =
  process.env.META_TOKEN_STORE_PATH ||
  path.join(os.tmpdir(), "gmtgroupbe-meta-token-store.json");

const parseInstagramAccounts = (raw) => {
  if (!raw) return [];

  try {
    const accounts = JSON.parse(raw);
    if (!Array.isArray(accounts)) return [];

    return accounts
      .map((account, index) => {
        const accessToken =
          account.pageAccessToken ||
          account.page_access_token ||
          account.accessToken ||
          account.access_token ||
          account.token ||
          account.igAccessToken ||
          account.ig_access_token ||
          "";
        const igUserId =
          account.igUserId ||
          account.ig_user_id ||
          account.instagramUserId ||
          account.instagram_user_id ||
          account.id ||
          "";

        if (!accessToken || !igUserId) return null;

        return {
          id: account.pageId || account.page_id || igUserId,
          name: account.pageName || account.page_name || account.name || (account.username ? `@${account.username}` : `Instagram account ${index + 1}`),
          access_token: accessToken,
          token_source: "configured_accounts",
          instagram_business_account: {
            id: igUserId,
            username: account.username || undefined,
            profile_picture_url: account.profilePictureUrl || account.profile_picture_url || undefined,
          },
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

const envTokenBundle = () => {
  const {
    META_ACCESS_TOKEN,
    META_USER_ACCESS_TOKEN,
    META_PAGE_ACCESS_TOKEN,
    META_IG_ACCESS_TOKEN,
    META_PAGE_ID,
    META_IG_USER_ID,
    META_IG_USERNAME,
    META_INSTAGRAM_ACCOUNTS,
  } = process.env;
  const userAccessToken = META_USER_ACCESS_TOKEN || META_ACCESS_TOKEN || "";
  const directInstagramToken = META_IG_ACCESS_TOKEN || "";
  const directAccessToken = directInstagramToken || META_PAGE_ACCESS_TOKEN || "";
  const directAccounts = parseInstagramAccounts(META_INSTAGRAM_ACCOUNTS);
  const legacyDirectAccount =
    directAccessToken && META_IG_USER_ID
      ? [
          {
            id: META_PAGE_ID || META_IG_USER_ID,
            name: META_IG_USERNAME ? `@${META_IG_USERNAME}` : "Direct Instagram account",
            access_token: directAccessToken,
            token_source: directInstagramToken ? "legacy_instagram_token" : "legacy_page_token",
            instagram_business_account: {
              id: META_IG_USER_ID,
              username: META_IG_USERNAME || undefined,
            },
          },
        ]
      : [];

  if (!userAccessToken && !directAccessToken && !directAccounts.length) {
    return null;
  }

  return {
    userAccessToken,
    pages: [...directAccounts, ...legacyDirectAccount],
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
