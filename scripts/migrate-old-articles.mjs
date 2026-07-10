#!/usr/bin/env node

const DEFAULT_USER_AGENT = "GMTGroupArticleMigrator/1.0 (+https://gmtgroup2.vercel.app)";

const args = parseArgs(process.argv.slice(2));
const oldSiteUrl = normalizeBaseUrl(args.oldSite || process.env.OLD_ARTICLE_SITE_URL);
const targetBaseUrl = normalizeBaseUrl(args.apiBaseUrl || process.env.API_BASE_URL || process.env.VITE_API_BASE_URL);
const targetEndpoint = args.endpoint || process.env.ARTICLE_IMPORT_ENDPOINT || "/api/articles";
const token = args.token || process.env.ARTICLE_IMPORT_TOKEN || process.env.API_TOKEN || "";
const loginEmail = args.email || process.env.ARTICLE_IMPORT_EMAIL || "";
const loginPassword = args.password || process.env.ARTICLE_IMPORT_PASSWORD || "";
const loginClient = args.client || process.env.ARTICLE_IMPORT_CLIENT || process.env.CLIENT_NAME || "website_utama";
const limit = toPositiveInt(args.limit || process.env.ARTICLE_IMPORT_LIMIT);
const concurrency = toPositiveInt(args.concurrency || process.env.ARTICLE_IMPORT_CONCURRENCY) || 3;
const sampleSize = toNonNegativeInt(args.sampleSize || process.env.ARTICLE_IMPORT_SAMPLE_SIZE, 5);
const dryRun = args.dryRun !== "false" && process.env.ARTICLE_IMPORT_DRY_RUN !== "false";
const includeDrafts = args.includeDrafts === "true" || process.env.ARTICLE_IMPORT_INCLUDE_DRAFTS === "true";
const status = args.status || process.env.ARTICLE_IMPORT_STATUS || "draft";
const directUrls = parseDirectUrls(args.url || args.urls || process.env.ARTICLE_IMPORT_URLS);

if (!oldSiteUrl && !directUrls.length) {
  exitWithUsage("OLD_ARTICLE_SITE_URL/--old-site atau ARTICLE_IMPORT_URLS/--url wajib diisi.");
}

if (!targetBaseUrl && !dryRun) {
  exitWithUsage("API_BASE_URL/VITE_API_BASE_URL atau --api-base-url wajib diisi saat --dry-run=false.");
}

const authToken = dryRun ? token : token || await login();
const sourceUrls = directUrls.length ? directUrls : await discoverArticleUrls(oldSiteUrl);
const selectedUrls = limit ? sourceUrls.slice(0, limit) : sourceUrls;

if (!selectedUrls.length) {
  console.log("Tidak ada artikel yang ditemukan dari WordPress REST API atau sitemap.");
  process.exit(0);
}

console.log(`Ditemukan ${sourceUrls.length} URL artikel. Diproses: ${selectedUrls.length}. Mode: ${dryRun ? "dry-run" : "import"}.`);

const scraped = await runPool(selectedUrls, concurrency, async (url, index) => {
  try {
    const article = await scrapeArticle(url);
    console.log(`[${index + 1}/${selectedUrls.length}] OK ${article.title || article.source_url}`);
    return { ok: true, article };
  } catch (error) {
    console.warn(`[${index + 1}/${selectedUrls.length}] GAGAL ${url}: ${error.message}`);
    return { ok: false, url, error: error.message };
  }
});

const articles = scraped.filter((item) => item.ok).map((item) => item.article);

if (dryRun) {
  console.log(JSON.stringify({
    count: articles.length,
    sample: articles.slice(0, sampleSize),
    failed: scraped.filter((item) => !item.ok),
  }, null, 2));
  process.exit(0);
}

let imported = 0;
let failed = 0;

for (const article of articles) {
  try {
    await saveArticle(article, authToken);
    imported += 1;
    console.log(`IMPORT OK: ${article.title}`);
  } catch (error) {
    failed += 1;
    console.warn(`IMPORT GAGAL: ${article.source_url}: ${error.message}`);
  }
}

console.log(`Selesai. Imported: ${imported}. Gagal scrape/import: ${failed + scraped.filter((item) => !item.ok).length}.`);

function parseArgs(rawArgs) {
  const parsed = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const item = rawArgs[index];
    if (!item.startsWith("--")) continue;

    const [rawKey, inlineValue] = item.slice(2).split("=");
    const key = rawKey.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const next = rawArgs[index + 1];
    if (inlineValue !== undefined) {
      parsed[key] = inlineValue;
    } else if (next && !next.startsWith("--")) {
      parsed[key] = next;
      index += 1;
    } else {
      parsed[key] = "true";
    }
  }
  return parsed;
}

function exitWithUsage(message) {
  console.error(message);
  console.error(`
Contoh:
  npm run articles:migrate -- --url=https://website-lama.com/artikel/contoh --dry-run=true
  npm run articles:migrate -- --urls=https://website-lama.com/a,https://website-lama.com/b --dry-run=true
  npm run articles:migrate -- --old-site=https://website-lama.com --dry-run=true
  npm run articles:migrate -- --old-site=https://website-lama.com --api-base-url=https://api.example.com --endpoint=/api/articles --token=JWT --dry-run=false

Env yang didukung:
  OLD_ARTICLE_SITE_URL
  ARTICLE_IMPORT_URLS
  API_BASE_URL / VITE_API_BASE_URL
  ARTICLE_IMPORT_ENDPOINT
  ARTICLE_IMPORT_TOKEN
  ARTICLE_IMPORT_EMAIL
  ARTICLE_IMPORT_PASSWORD
  ARTICLE_IMPORT_CLIENT
  ARTICLE_IMPORT_LIMIT
  ARTICLE_IMPORT_CONCURRENCY
  ARTICLE_IMPORT_DRY_RUN
`);
  process.exit(1);
}

function normalizeBaseUrl(value) {
  if (!value) return "";
  return String(value).trim().replace(/\/$/, "");
}

function toPositiveInt(value) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : 0;
}

function toNonNegativeInt(value, fallback) {
  if (value === undefined || value === "") return fallback;
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 0 ? numeric : fallback;
}

function parseDirectUrls(value) {
  if (!value) return [];

  return String(value)
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => /^https?:\/\//i.test(item));
}

async function requestText(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "User-Agent": DEFAULT_USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "User-Agent": DEFAULT_USER_AGENT,
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

async function discoverArticleUrls(baseUrl) {
  const urls = new Set();

  await discoverWordPressUrls(baseUrl, urls);
  if (!urls.size) {
    await discoverSitemapUrls(baseUrl, urls);
  }

  return [...urls].filter((url) => {
    if (!includeDrafts && /\/(tag|category|author|page|wp-content|wp-json)\//i.test(url)) return false;
    return /^https?:\/\//i.test(url);
  });
}

async function discoverWordPressUrls(baseUrl, urls) {
  for (let page = 1; page <= 100; page += 1) {
    const url = `${baseUrl}/wp-json/wp/v2/posts?per_page=100&page=${page}&_fields=link`;
    try {
      const posts = await requestJson(url);
      if (!Array.isArray(posts) || !posts.length) break;
      posts.forEach((post) => {
        if (post?.link) urls.add(post.link);
      });
      if (posts.length < 100) break;
    } catch {
      break;
    }
  }
}

async function discoverSitemapUrls(baseUrl, urls) {
  const sitemapCandidates = [
    `${baseUrl}/post-sitemap.xml`,
    `${baseUrl}/sitemap-posts.xml`,
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
  ];

  const sitemapQueue = [...sitemapCandidates];
  const visited = new Set();

  while (sitemapQueue.length) {
    const sitemapUrl = sitemapQueue.shift();
    if (!sitemapUrl || visited.has(sitemapUrl)) continue;
    visited.add(sitemapUrl);

    try {
      const xml = await requestText(sitemapUrl);
      const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => decodeHtml(match[1].trim()));

      locs.forEach((loc) => {
        if (/sitemap/i.test(loc) && /\.xml(\?|$)/i.test(loc)) {
          sitemapQueue.push(loc);
        } else {
          urls.add(loc);
        }
      });
    } catch {
      // Try the next sitemap candidate.
    }
  }
}

async function scrapeArticle(url) {
  const html = await requestText(url);
  const wordpressArticle = await scrapeWordPressArticle(url, html);
  if (wordpressArticle) {
    return wordpressArticle;
  }

  const jsonLd = extractJsonLd(html);
  const title = cleanText(
    jsonLd.headline ||
    getMeta(html, "og:title") ||
    getTagContent(html, "h1") ||
    getTagContent(html, "title")
  );
  const description = cleanText(jsonLd.description || getMeta(html, "description") || getMeta(html, "og:description"));
  const image = jsonLd.image || getMeta(html, "og:image");
  const publishedAt = jsonLd.datePublished || getMeta(html, "article:published_time") || "";
  const updatedAt = jsonLd.dateModified || getMeta(html, "article:modified_time") || "";
  const author = cleanText(jsonLd.author || getMeta(html, "author") || "");
  const rawContent = extractArticleHtml(html);
  const content = normalizeContent(rawContent);
  const slug = slugify(new URL(url).pathname.split("/").filter(Boolean).pop() || title);

  if (!title || !content) {
    throw new Error("judul atau konten kosong");
  }

  return {
    title,
    slug,
    excerpt: description,
    content,
    featured_image: image,
    author,
    source_url: url,
    status,
    published_at: normalizeDate(publishedAt),
    updated_at: normalizeDate(updatedAt),
    seo: {
      title,
      description,
      canonical_url: getMeta(html, "canonical") || url,
    },
  };
}

async function scrapeWordPressArticle(sourceUrl, html) {
  const apiUrl = getWordPressPostApiUrl(html);
  if (!apiUrl) return null;

  try {
    const post = await requestJson(withQuery(apiUrl, "_embed", "1"));
    const yoast = post.yoast_head_json || {};
    const embedded = post._embedded || {};
    const featuredMedia = Array.isArray(embedded["wp:featuredmedia"]) ? embedded["wp:featuredmedia"][0] : null;
    const author = Array.isArray(embedded.author) ? embedded.author[0] : null;
    const title = cleanText(post.title?.rendered || yoast.title || getMeta(html, "og:title"));
    const excerpt = cleanText(post.excerpt?.rendered || yoast.description || getMeta(html, "description"));
    const content = cleanRenderedArticleContent(post.content?.rendered || "");

    if (!title || !content) return null;

    return {
      title,
      slug: slugify(post.slug || title),
      excerpt,
      content,
      featured_image: featuredMedia?.source_url || yoast.og_image?.[0]?.url || getMeta(html, "og:image"),
      author: cleanText(author?.name || yoast.author || getMeta(html, "author") || ""),
      source_url: post.link || sourceUrl,
      status,
      published_at: normalizeDate(post.date_gmt || post.date || yoast.article_published_time),
      updated_at: normalizeDate(post.modified_gmt || post.modified || yoast.article_modified_time),
      seo: {
        title,
        description: excerpt,
        canonical_url: yoast.canonical || getMeta(html, "canonical") || sourceUrl,
      },
    };
  } catch {
    return null;
  }
}

function getWordPressPostApiUrl(html) {
  const alternate = html.match(/<link\b[^>]*rel=["']alternate["'][^>]*type=["']application\/json["'][^>]*href=["']([^"']+\/wp-json\/wp\/v2\/posts\/\d+[^"']*)["'][^>]*>/i);
  if (alternate?.[1]) return decodeHtml(alternate[1]);

  const shortlink = html.match(/<link\b[^>]*rel=["']shortlink["'][^>]*href=["'][^"']*[?&]p=(\d+)["'][^>]*>/i);
  const apiRoot = html.match(/<link\b[^>]*rel=["']https:\/\/api\.w\.org\/["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (shortlink?.[1] && apiRoot?.[1]) {
    return `${decodeHtml(apiRoot[1]).replace(/\/$/, "")}/wp/v2/posts/${shortlink[1]}`;
  }

  return "";
}

function withQuery(url, key, value) {
  const parsed = new URL(url);
  parsed.searchParams.set(key, value);
  return parsed.toString();
}

function cleanRenderedArticleContent(rendered) {
  const raw = String(rendered || "");
  const contentSource = /<article\b/i.test(raw) ? extractArticleHtml(raw) : raw;
  return normalizeContent(trimWordPressFooter(trimBeforeMainHeading(contentSource)));
}

function trimBeforeMainHeading(value) {
  const content = String(value || "");
  const headingIndex = content.search(/<h1\b/i);
  if (headingIndex <= 0) return content;
  return content.slice(headingIndex);
}

function trimWordPressFooter(value) {
  const markers = [
    /<h3[^>]*>\s*Bagikan ini:/i,
    /<h3[^>]*>\s*Menyukai ini:/i,
    /<!--\s*wpcom_wp_footer\s*-->/i,
    /<h2[^>]*>\s*Eksplorasi konten lain/i,
  ];

  let endIndex = String(value || "").length;
  for (const marker of markers) {
    const matchIndex = String(value || "").search(marker);
    if (matchIndex >= 0) {
      endIndex = Math.min(endIndex, matchIndex);
    }
  }

  return String(value || "").slice(0, endIndex);
}

function extractJsonLd(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(stripHtmlComments(script[1]).trim());
      const items = Array.isArray(parsed) ? parsed : [parsed, ...(parsed["@graph"] || [])];
      const article = items.find((item) => {
        const type = item?.["@type"];
        return Array.isArray(type)
          ? type.some((entry) => /Article|Posting/i.test(entry))
          : /Article|Posting/i.test(String(type || ""));
      });
      if (article) {
        return {
          headline: article.headline || article.name,
          description: article.description,
          datePublished: article.datePublished,
          dateModified: article.dateModified,
          image: Array.isArray(article.image) ? article.image[0]?.url || article.image[0] : article.image?.url || article.image,
          author: Array.isArray(article.author) ? article.author[0]?.name : article.author?.name || article.author,
        };
      }
    } catch {
      // Ignore invalid JSON-LD and fall back to HTML/meta extraction.
    }
  }

  return {};
}

function stripHtmlComments(value) {
  return String(value || "").replace(/<!--|-->/g, "");
}

function getMeta(html, name) {
  if (name === "canonical") {
    const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
    return canonical ? decodeHtml(canonical[1]) : "";
  }

  const escaped = escapeRegExp(name);
  const patterns = [
    new RegExp(`<meta\\b[^>]*(?:name|property)=["']${escaped}["'][^>]*content=["']([^"']*)["'][^>]*>`, "i"),
    new RegExp(`<meta\\b[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${escaped}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtml(match[1]);
  }

  return "";
}

function getTagContent(html, tagName) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = html.match(pattern);
  return match ? stripTags(match[1]) : "";
}

function extractArticleHtml(html) {
  const selectors = [
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    /<div\b[^>]*class=["'][^"']*(?:entry-content|post-content|article-content|content-area|single-post-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const selector of selectors) {
    const match = html.match(selector);
    if (match?.[1]) return match[1];
  }

  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return body?.[1] || html;
}

function normalizeContent(value) {
  return String(value || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "")
    .replace(/<form\b[\s\S]*?<\/form>/gi, "")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, "")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, "")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "")
    .replace(/<link\b[^>]*>/gi, "")
    .replace(/<meta\b[^>]*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s(?:class|style|id|data-[a-z0-9-]+)=["'][^"']*["']/gi, "")
    .replace(/<\s*(div|section|header|footer|aside|span)\b[^>]*>/gi, "")
    .replace(/<\s*\/\s*(div|section|header|footer|aside|span)\s*>/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/>\s+</g, "><")
    .trim();
}

function stripTags(value) {
  return decodeHtml(String(value || "").replace(/<[^>]+>/g, " "));
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function cleanText(value) {
  return stripTags(value).replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function normalizeDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function runPool(items, poolSize, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  await Promise.all(Array.from({ length: Math.min(poolSize, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }));

  return results;
}

async function login() {
  if (!loginEmail || !loginPassword) {
    throw new Error("ARTICLE_IMPORT_TOKEN atau ARTICLE_IMPORT_EMAIL + ARTICLE_IMPORT_PASSWORD wajib diisi untuk import.");
  }

  const response = await requestJson(`${targetBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: loginEmail,
      password: loginPassword,
      client: loginClient,
    }),
  });

  if (!response.token) {
    throw new Error("Login berhasil tetapi token tidak ditemukan di response.");
  }

  return response.token;
}

async function saveArticle(article, bearerToken) {
  const headers = {
    "User-Agent": DEFAULT_USER_AGENT,
    "Content-Type": "application/json",
  };

  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  const response = await fetch(`${targetBaseUrl}${targetEndpoint.startsWith("/") ? targetEndpoint : `/${targetEndpoint}`}`, {
    method: "POST",
    headers,
    body: JSON.stringify(article),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);
  }

  return response.json().catch(() => ({}));
}
