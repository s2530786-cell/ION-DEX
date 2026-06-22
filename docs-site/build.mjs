import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "..");
const sourceDir = path.join(currentDir, "src");
const distDir = path.join(currentDir, "dist");

const repoUrl = "https://github.com/s2530786-cell/ION-DEX";
const repoBranch = "main";
const siteUrl = "https://s2530786-cell.github.io/ION-DEX/";
const translateBase = "https://translate.google.com/translate";
const rawBase = `https://raw.githubusercontent.com/s2530786-cell/ION-DEX/${repoBranch}`;
const blobBase = `${repoUrl}/blob/${repoBranch}`;
const languagePlaceholder = "__LANG__";

const languages = [
  { key: "en", label: "English", readmeFile: "README.md", docsDir: null, whitepaperDir: null, translateCode: "en" },
  { key: "zh-CN", label: "Chinese (Simplified)", readmeFile: "README.zh-CN.md", docsDir: "zh-CN", whitepaperDir: "zh", translateCode: "zh-CN" },
  { key: "zh-TW", label: "Chinese (Traditional)", readmeFile: "README.zh-TW.md", docsDir: "zh-TW", whitepaperDir: "zh-TW", translateCode: "zh-TW" },
  { key: "ru", label: "Russian", readmeFile: "README.ru.md", docsDir: "ru", whitepaperDir: "ru", translateCode: "ru" },
  { key: "es", label: "Spanish", readmeFile: "README.es.md", docsDir: "es", whitepaperDir: "es", translateCode: "es" },
  { key: "pt", label: "Portuguese", readmeFile: "README.pt.md", docsDir: "pt", whitepaperDir: "pt", translateCode: "pt" },
  { key: "ar", label: "Arabic", readmeFile: "README.ar.md", docsDir: "ar", whitepaperDir: "ar", translateCode: "ar" },
  { key: "fr", label: "French", readmeFile: "README.fr.md", docsDir: "fr", whitepaperDir: "fr", translateCode: "fr" },
  { key: "de", label: "German", readmeFile: "README.de.md", docsDir: "de", whitepaperDir: "de", translateCode: "de" },
  { key: "ja", label: "Japanese", readmeFile: "README.ja.md", docsDir: "ja", whitepaperDir: "ja", translateCode: "ja" },
  { key: "ko", label: "Korean", readmeFile: "README.ko.md", docsDir: "ko", whitepaperDir: "ko", translateCode: "ko" },
  { key: "hi", label: "Hindi", readmeFile: "README.hi.md", docsDir: "hi", whitepaperDir: "hi", translateCode: "hi" },
  { key: "tr", label: "Turkish", readmeFile: "README.tr.md", docsDir: "tr", whitepaperDir: "tr", translateCode: "tr" },
  { key: "it", label: "Italian", readmeFile: "README.it.md", docsDir: "it", whitepaperDir: "it", translateCode: "it" },
  { key: "id", label: "Indonesian", readmeFile: "README.id.md", docsDir: "id", whitepaperDir: "id", translateCode: "id" },
  { key: "vi", label: "Vietnamese", readmeFile: "README.vi.md", docsDir: "vi", whitepaperDir: "vi", translateCode: "vi" },
  { key: "th", label: "Thai", readmeFile: "README.th.md", docsDir: "th", whitepaperDir: "th", translateCode: "th" },
  { key: "pl", label: "Polish", readmeFile: "README.pl.md", docsDir: "pl", whitepaperDir: "pl", translateCode: "pl" },
];

const localizedDocsDirs = new Set(
  languages.filter((language) => language.docsDir).map((language) => language.docsDir),
);

const groupOrder = [
  "Entry",
  "Integration",
  "Architecture",
  "Verification",
  "Workflow",
  "More",
];

const extraEnglishPages = [
  {
    repoPath: "contracts/README.md",
    logicalId: "docs/contracts-layout",
    section: "docs",
    slug: "contracts-layout",
    order: 66,
  },
  {
    repoPath: "contracts/ion/test/test-cases.md",
    logicalId: "docs/contracts-test-cases",
    section: "docs",
    slug: "contracts-test-cases",
    order: 67,
  },
  {
    repoPath: "contracts/ion/deploy/compile-and-deploy.md",
    logicalId: "docs/ion-compile-and-deploy-commands",
    section: "docs",
    slug: "ion-compile-and-deploy-commands",
    order: 68,
  },
  {
    repoPath: "contracts/ion/deploy/LIVE-DEPLOY.md",
    logicalId: "docs/ion-live-deploy-operator-manual",
    section: "docs",
    slug: "ion-live-deploy-operator-manual",
    order: 69,
  },
];

const actualPages = new Map();
const logicalPages = new Map();

marked.use({
  gfm: true,
  breaks: false,
});

await build();

async function build() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  const pageMetas = await collectPageMetas();
  for (const pageMeta of pageMetas) {
    await ingestPage(pageMeta);
  }

  const navOrder = [...logicalPages.values()]
    .sort(compareLogicalPages)
    .map((page) => page.id);

  const siteIndex = {
    generatedAt: new Date().toISOString(),
    repoUrl,
    siteUrl,
    translateBase,
    languages,
    groupOrder,
    navOrder,
    logicalPages: Object.fromEntries(
      [...logicalPages.entries()].map(([id, page]) => [id, page]),
    ),
  };

  await writeJson(path.join(distDir, "site-index.json"), siteIndex);
  await cp(path.join(sourceDir, "index.html"), path.join(distDir, "index.html"));
  await cp(path.join(sourceDir, "app.js"), path.join(distDir, "app.js"));
  await cp(path.join(sourceDir, "styles.css"), path.join(distDir, "styles.css"));

  console.log(
    `Built docs-site/dist with ${actualPages.size} page variants and ${logicalPages.size} logical routes.`,
  );
}

async function collectPageMetas() {
  const metas = [];

  for (const language of languages) {
    metas.push({
      repoPath: toPosix(language.readmeFile),
      sourceLanguage: language.key,
      logicalId: "readme",
      section: "readme",
      slug: "readme",
      order: 0,
    });
  }

  const docsEntries = await readdir(path.join(repoRoot, "docs"), {
    withFileTypes: true,
  });
  const rootDocs = docsEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort();

  for (const fileName of rootDocs) {
    const slug = fileName.slice(0, -3);
    const logicalId =
      fileName === "README.md"
        ? "docs/index"
        : fileName === "WHITEPAPER.md"
          ? "whitepaper"
          : `docs/${slug}`;
    const section = logicalId === "whitepaper" ? "whitepaper" : "docs";
    metas.push({
      repoPath: `docs/${fileName}`,
      sourceLanguage: "en",
      logicalId,
      section,
      slug: logicalId === "docs/index" ? "index" : slug,
      order: rootDocs.indexOf(fileName) + 10,
    });
  }

  for (const page of extraEnglishPages) {
    metas.push({
      ...page,
      sourceLanguage: "en",
    });
  }

  for (const language of languages.filter((item) => item.key !== "en")) {
    const dir = path.join(repoRoot, "docs", language.docsDir);
    const entries = await readdir(dir, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name)
      .sort();
    for (const fileName of files) {
      const slug = fileName.slice(0, -3);
      metas.push({
        repoPath: `docs/${language.docsDir}/${fileName}`,
        sourceLanguage: language.key,
        logicalId: fileName === "index.md" ? "docs/index" : `docs/${slug}`,
        section: "docs",
        slug: fileName === "index.md" ? "index" : slug,
        order: rootDocs.indexOf(fileName) + 10,
      });
    }
  }

  for (const language of languages.filter((item) => item.key !== "en")) {
    const whitepaperFile = `docs/whitepaper/${language.whitepaperDir}/WHITEPAPER.${language.key}.md`;
    metas.push({
      repoPath: whitepaperFile,
      sourceLanguage: language.key,
      logicalId: "whitepaper",
      section: "whitepaper",
      slug: "whitepaper",
      order: 5,
    });
  }

  return metas;
}

async function ingestPage(pageMeta) {
  const repoPath = toPosix(pageMeta.repoPath);
  const source = await readFile(path.join(repoRoot, ...repoPath.split("/")), "utf8");
  const cleaned = stripRepoChrome(source);
  const rewrittenMarkdown = rewriteMarkdownLinks(cleaned, pageMeta);
  const htmlWithRawBlocks = marked.parse(rewrittenMarkdown);
  const html = decorateHtml(htmlWithRawBlocks);
  const title = extractTitle(cleaned, pageMeta);
  const excerpt = extractExcerpt(cleaned);
  const headings = extractHeadings(cleaned);
  const pageRecord = {
    title,
    excerpt,
    headings,
    html,
    githubUrl: `${blobBase}/${encodeRepoPath(repoPath)}`,
    repoPath,
    sourceLanguage: pageMeta.sourceLanguage,
  };

  actualPages.set(repoPath, pageRecord);
  await writeJson(path.join(distDir, "pages", `${repoPath}.json`), pageRecord);

  const logical = logicalPages.get(pageMeta.logicalId) || {
    id: pageMeta.logicalId,
    section: pageMeta.section,
    slug: pageMeta.slug,
    group: classifyGroup(pageMeta),
    order: pageMeta.order,
    translations: {},
    titles: {},
  };
  logical.translations[pageMeta.sourceLanguage] = repoPath;
  logical.titles[pageMeta.sourceLanguage] = title;
  logicalPages.set(pageMeta.logicalId, logical);
}

function stripRepoChrome(markdown) {
  return markdown
    .replace(/<!-- AUTO-LANGUAGE-NAV START -->[\s\S]*?<!-- AUTO-LANGUAGE-NAV END -->\s*/gu, "")
    .replace(/<!-- AUTO-TRANSLATION-NOTE START -->[\s\S]*?<!-- AUTO-TRANSLATION-NOTE END -->\s*/gu, "")
    .replace(/^\*\*Languages:\*\*.*(?:\r?\n){1,2}/u, "")
    .trim();
}

function rewriteMarkdownLinks(markdown, pageMeta) {
  const withMarkdownLinks = markdown.replace(
    /(!?)\[([^\]]+)\]\((?:<([^>]+)>|([^) \t]+))(?:\s+"([^"]*)")?\)/gu,
    (match, bang, text, angleHref, plainHref, title) => {
      const href = angleHref || plainHref || "";
      const resolved = resolveHref(href, pageMeta, bang === "!");
      const titlePart = title ? ` "${title}"` : "";
      return bang === "!"
        ? `![${text}](${resolved}${titlePart})`
        : `[${text}](${resolved}${titlePart})`;
    },
  );

  return withMarkdownLinks.replace(
    /\b(href|src)=["']([^"']+)["']/gu,
    (match, attribute, href) => `${attribute}="${resolveHref(href, pageMeta, attribute === "src")}"`,
  );
}

function resolveHref(rawHref, pageMeta, assetOnly) {
  const href = rawHref.trim();
  if (!href) {
    return href;
  }
  if (/^(https?:|mailto:|data:|tel:)/u.test(href)) {
    return href;
  }
  if (href.startsWith("#")) {
    return buildRouteHref(pageMeta.logicalId, href.slice(1));
  }

  const [pathPart, anchor = ""] = href.split("#");
  const currentDir = path.posix.dirname(pageMeta.repoPath);
  const resolvedPath = toPosix(path.posix.normalize(path.posix.join(currentDir, pathPart)));
  if (/\.md$/iu.test(pathPart) && !assetOnly) {
    const targetMeta = findLogicalTarget(resolvedPath);
    if (targetMeta) {
      return buildRouteHref(targetMeta.logicalId, anchor);
    }
  }

  if (isImagePath(pathPart) || assetOnly) {
    return `${rawBase}/${encodeRepoPath(resolvedPath)}`;
  }
  if (
    resolvedPath.startsWith("docs/") ||
    resolvedPath.startsWith("assets/") ||
    resolvedPath.startsWith("contracts/")
  ) {
    return `${blobBase}/${encodeRepoPath(resolvedPath)}`;
  }
  return href;
}

function findLogicalTarget(repoPath) {
  if (repoPath === "contracts/README.md") {
    return { logicalId: "docs/contracts-layout" };
  }
  if (repoPath === "contracts/ion/test/test-cases.md") {
    return { logicalId: "docs/contracts-test-cases" };
  }
  if (repoPath === "contracts/ion/deploy/compile-and-deploy.md") {
    return { logicalId: "docs/ion-compile-and-deploy-commands" };
  }
  if (repoPath === "contracts/ion/deploy/LIVE-DEPLOY.md") {
    return { logicalId: "docs/ion-live-deploy-operator-manual" };
  }
  if (repoPath === "docs/WHITEPAPER.md") {
    return { logicalId: "whitepaper" };
  }
  if (repoPath === "docs/README.md") {
    return { logicalId: "docs/index" };
  }
  if (repoPath === "README.md" || /^README\.[^.]+\.md$/u.test(path.posix.basename(repoPath))) {
    return { logicalId: "readme" };
  }
  if (repoPath.startsWith("docs/whitepaper/")) {
    return { logicalId: "whitepaper" };
  }

  const parts = repoPath.split("/");
  if (parts[0] === "docs" && parts.length >= 2) {
    const maybeLang = parts[1];
    if (localizedDocsDirs.has(maybeLang) && parts.length >= 3) {
      const fileName = parts[2];
      return {
        logicalId: fileName === "index.md" ? "docs/index" : `docs/${fileName.slice(0, -3)}`,
      };
    }
    if (parts.length === 2) {
      const fileName = parts[1];
      if (fileName === "WHITEPAPER.md") {
        return { logicalId: "whitepaper" };
      }
      return {
        logicalId: fileName === "README.md" ? "docs/index" : `docs/${fileName.slice(0, -3)}`,
      };
    }
  }
  return null;
}

function buildRouteHref(logicalId, anchor = "") {
  const encodedAnchor = anchor ? `?anchor=${encodeURIComponent(anchor)}` : "";
  if (logicalId === "readme") {
    return `#/${languagePlaceholder}/readme${encodedAnchor}`;
  }
  if (logicalId === "whitepaper") {
    return `#/${languagePlaceholder}/whitepaper${encodedAnchor}`;
  }
  return `#/${languagePlaceholder}/docs/${encodeURIComponent(
    logicalId.replace(/^docs\//u, ""),
  )}${encodedAnchor}`;
}

function decorateHtml(html) {
  return ensureHeadingIds(html);
}

function ensureHeadingIds(html) {
  const counts = new Map();
  return html.replace(/<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gu, (match, level, attributes, innerHtml) => {
    if (/\sid=/u.test(attributes)) {
      return match;
    }
    const plainText = stripTags(innerHtml);
    const baseId = slugify(plainText) || `heading-${level}`;
    const seen = counts.get(baseId) || 0;
    counts.set(baseId, seen + 1);
    const uniqueId = seen ? `${baseId}-${seen + 1}` : baseId;
    return `<h${level}${attributes} id="${uniqueId}">${innerHtml}</h${level}>`;
  });
}

function extractTitle(markdown, pageMeta) {
  const headingMatch = markdown.match(/^#\s+(.+)$/mu);
  if (headingMatch) {
    return cleanupInlineText(headingMatch[1]);
  }
  if (pageMeta.logicalId === "readme") {
    return pageMeta.sourceLanguage === "en"
      ? "ION DEX README"
      : `${pageMeta.sourceLanguage} README`;
  }
  if (pageMeta.logicalId === "whitepaper") {
    return "ION DEX Whitepaper";
  }
  return titleCase(pageMeta.slug.replaceAll("-", " ").replaceAll(".", " "));
}

function extractExcerpt(markdown) {
  const paragraphs = markdown
    .split(/\r?\n\r?\n/u)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .filter((chunk) => !chunk.startsWith("#"))
    .filter((chunk) => !chunk.startsWith(">"))
    .filter((chunk) => !chunk.startsWith("|"))
    .filter((chunk) => !chunk.startsWith("<"));
  if (!paragraphs.length) {
    return "";
  }
  return cleanupInlineText(paragraphs[0]).slice(0, 220);
}

function extractHeadings(markdown) {
  const lines = markdown.split(/\r?\n/u);
  const headings = [];
  const counts = new Map();
  for (const line of lines) {
    const match = /^(#{2,4})\s+(.+)$/u.exec(line.trim());
    if (!match) {
      continue;
    }
    const text = cleanupInlineText(match[2]);
    const baseId = slugify(text);
    const seen = counts.get(baseId) || 0;
    counts.set(baseId, seen + 1);
    headings.push({
      level: match[1].length,
      text,
      id: seen ? `${baseId}-${seen + 1}` : baseId,
    });
  }
  return headings;
}

function cleanupInlineText(value) {
  return stripTags(
    value
      .replace(/`/gu, "")
      .replace(/\[(.*?)\]\((?:<[^>]+>|[^)]+)\)/gu, "$1")
      .replace(/\*\*/gu, "")
      .replace(/__/gu, "")
      .replace(/[_*]/gu, ""),
  ).trim();
}

function classifyGroup(pageMeta) {
  if (pageMeta.logicalId === "readme" || pageMeta.logicalId === "whitepaper") {
    return "Entry";
  }
  const slug = pageMeta.slug;
  if (
    new Set([
      "index",
      "whitepaper-index",
      "developer-index",
      "api-overview",
      "contracts-overview",
      "sdk-overview",
      "quick-start",
      "merchant-onboarding",
      "payment-access",
      "settlement-integration",
      "ecosystem-entry",
      "public-structure",
    ]).has(slug)
  ) {
    return "Integration";
  }
  if (/(architecture|roadmap|prd|overview|tokenomics|scope|ecosystem|flywheel|logic|official-addresses)/u.test(slug)) {
    return "Architecture";
  }
  if (/(verification|security|deploy|compile|operator|coverage|e2e|test|minimum-output|layout|visual|ci-agent)/u.test(slug)) {
    return "Verification";
  }
  if (/(cursor|workflow|autonomous|daily|hyperframes|compose|mcp|progress)/u.test(slug)) {
    return "Workflow";
  }
  return "More";
}

function compareLogicalPages(left, right) {
  if (left.order !== right.order) {
    return left.order - right.order;
  }
  return left.slug.localeCompare(right.slug);
}

function titleCase(value) {
  return value.replace(/\b([a-z])/gu, (match) => match.toUpperCase());
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&[#a-z0-9]+;/gu, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

function stripTags(value) {
  return value.replace(/<[^>]+>/gu, "");
}

function encodeRepoPath(repoPath) {
  return repoPath.split("/").map(encodeURIComponent).join("/");
}

function isImagePath(value) {
  return /\.(?:png|jpe?g|gif|webp|svg|mp4)$/iu.test(value);
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

async function writeJson(target, payload) {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}
