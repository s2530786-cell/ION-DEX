const STORAGE_KEY = "ion-dex-docs-site-language";
const LANGUAGE_PLACEHOLDER = "__LANG__";

const state = {
  index: null,
  current: null,
  pageCache: new Map(),
};

const elements = {};

document.addEventListener("DOMContentLoaded", async () => {
  cacheElements();
  bindEvents();
  await loadIndex();
  renderLanguageOptions();
  navigate();
});

function cacheElements() {
  elements.languageSwitcher = document.getElementById("language-switcher");
  elements.githubRepoLink = document.getElementById("github-repo-link");
  elements.translateRepoLink = document.getElementById("translate-repo-link");
  elements.pageSearch = document.getElementById("page-search");
  elements.pageNav = document.getElementById("page-nav");
  elements.pageKicker = document.getElementById("page-kicker");
  elements.pageTitle = document.getElementById("page-title");
  elements.pageSummary = document.getElementById("page-summary");
  elements.githubPageLink = document.getElementById("github-page-link");
  elements.translatePageLink = document.getElementById("translate-page-link");
  elements.fallbackBanner = document.getElementById("fallback-banner");
  elements.languagePills = document.getElementById("language-pills");
  elements.docContent = document.getElementById("doc-content");
  elements.routeDisplay = document.getElementById("route-display");
  elements.sourcePathLink = document.getElementById("source-path-link");
  elements.pageOutline = document.getElementById("page-outline");
}

function bindEvents() {
  window.addEventListener("hashchange", navigate);
  elements.languageSwitcher.addEventListener("change", () => {
    const route = parseRoute();
    updateHash(route.logicalId, elements.languageSwitcher.value, route.anchor);
  });
  elements.pageSearch.addEventListener("input", () => {
    renderNavigation();
  });
}

async function loadIndex() {
  const response = await fetch("./site-index.json");
  if (!response.ok) {
    throw new Error(`Failed to load site index: ${response.status}`);
  }
  state.index = await response.json();
  elements.githubRepoLink.href = state.index.repoUrl;
}

function renderLanguageOptions() {
  elements.languageSwitcher.innerHTML = state.index.languages
    .map(
      (language) =>
        `<option value="${escapeHtml(language.key)}">${escapeHtml(language.label)}</option>`,
    )
    .join("");
}

function navigate() {
  if (!state.index) {
    return;
  }
  const route = parseRoute();
  const logicalPage = state.index.logicalPages[route.logicalId];
  if (!logicalPage) {
    renderMissingRoute(route);
    return;
  }
  renderResolvedRoute(route, logicalPage).catch((error) => {
    renderFatalError(error);
  });
}

function parseRoute() {
  const rawHash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : "";
  const [pathPart, queryPart = ""] = rawHash.split("?");
  const parts = pathPart.replace(/^\/+/, "").split("/").filter(Boolean);
  const language = normalizeLanguage(parts[0]) || detectPreferredLanguage();
  const section = parts[1];
  let logicalId = "readme";
  if (section === "docs") {
    const slug = decodeURIComponent(parts.slice(2).join("/")) || "index";
    logicalId = `docs/${slug}`;
  } else if (section === "whitepaper") {
    logicalId = "whitepaper";
  } else if (section === "readme" || !section) {
    logicalId = "readme";
  }
  const anchor = new URLSearchParams(queryPart).get("anchor") || "";
  return { language, logicalId, anchor };
}

function normalizeLanguage(candidate) {
  if (!candidate) {
    return null;
  }
  const lowered = candidate.toLowerCase();
  const exact = state.index.languages.find(
    (language) => language.key.toLowerCase() === lowered,
  );
  return exact ? exact.key : null;
}

function detectPreferredLanguage() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && normalizeLanguage(stored)) {
    return normalizeLanguage(stored);
  }
  const browserLocales = Array.isArray(navigator.languages)
    ? navigator.languages
    : [navigator.language];
  for (const locale of browserLocales) {
    if (!locale) {
      continue;
    }
    const lowered = locale.toLowerCase();
    if (lowered.startsWith("zh-tw") || lowered.startsWith("zh-hk")) {
      return "zh-TW";
    }
    if (lowered.startsWith("zh")) {
      return "zh-CN";
    }
    const exact = normalizeLanguage(locale);
    if (exact) {
      return exact;
    }
    const prefix = locale.split("-")[0].toLowerCase();
    const matched = state.index.languages.find(
      (language) => language.key.toLowerCase() === prefix,
    );
    if (matched) {
      return matched.key;
    }
  }
  return "en";
}

async function renderResolvedRoute(route, logicalPage) {
  const sourceId =
    logicalPage.translations[route.language] ||
    logicalPage.translations.en ||
    Object.values(logicalPage.translations)[0];
  const page = await loadPage(sourceId);
  const fallback = !logicalPage.translations[route.language];
  state.current = { route, logicalPage, page, fallback };

  window.localStorage.setItem(STORAGE_KEY, route.language);
  document.documentElement.lang = route.language;
  document.title = `${titleFor(logicalPage, route.language)} | ION DEX Docs`;

  elements.languageSwitcher.value = route.language;
  elements.translateRepoLink.href = buildTranslateUrl(
    route.language,
    state.index.repoUrl,
  );
  elements.pageKicker.textContent = fallback
    ? `Fallback source: ${page.sourceLanguage}`
    : `Localised source: ${route.language}`;
  elements.pageTitle.textContent = titleFor(logicalPage, route.language);
  elements.pageSummary.textContent =
    fallback && route.language !== page.sourceLanguage
      ? `This logical page is opened in ${route.language}, but its public content currently falls back to the ${page.sourceLanguage} source page.`
      : page.excerpt || "Repository-backed public documentation page.";
  elements.githubPageLink.href = page.githubUrl;
  elements.translatePageLink.href = buildTranslateUrl(
    route.language,
    page.githubUrl,
  );
  elements.routeDisplay.textContent = buildRouteHash(
    logicalPage.id,
    route.language,
    route.anchor,
  );
  elements.sourcePathLink.href = page.githubUrl;
  elements.sourcePathLink.textContent = page.repoPath;

  elements.fallbackBanner.hidden = !fallback;
  elements.fallbackBanner.textContent = fallback
    ? `This page does not yet have a dedicated ${route.language} source file in the public repository. The docs site keeps the current language route and serves the ${page.sourceLanguage} source page instead.`
    : "";

  elements.docContent.innerHTML = page.html;
  hydrateArticle(route.language);
  renderLanguagePills(logicalPage, route.language);
  renderOutline(page.headings, logicalPage, route.language);
  renderNavigation();
  scrollToAnchor(route.anchor);
}

async function loadPage(sourceId) {
  if (state.pageCache.has(sourceId)) {
    return state.pageCache.get(sourceId);
  }
  const response = await fetch(`./pages/${sourceId}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load page ${sourceId}: ${response.status}`);
  }
  const page = await response.json();
  state.pageCache.set(sourceId, page);
  return page;
}

function hydrateArticle(language) {
  const links = elements.docContent.querySelectorAll("a[href]");
  for (const link of links) {
    const rawHref = link.getAttribute("href") || "";
    if (rawHref.includes(LANGUAGE_PLACEHOLDER)) {
      link.setAttribute(
        "href",
        rawHref.replaceAll(
          LANGUAGE_PLACEHOLDER,
          encodeURIComponent(language),
        ),
      );
    }
    if (/^https?:\/\//u.test(link.href)) {
      link.target = "_blank";
      link.rel = "noreferrer";
    }
  }

  const headings = elements.docContent.querySelectorAll("h1, h2, h3, h4");
  for (const heading of headings) {
    heading.style.scrollMarginTop = "7rem";
  }
}

function renderLanguagePills(logicalPage, currentLanguage) {
  elements.languagePills.innerHTML = state.index.languages
    .map((language) => {
      const available = Boolean(logicalPage.translations[language.key]);
      const active = language.key === currentLanguage;
      const classes = [
        "language-pill",
        available ? "is-available" : "is-fallback",
        active ? "is-active" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<a class="${classes}" href="${escapeHtml(
        buildRouteHash(logicalPage.id, language.key),
      )}">${escapeHtml(language.label)}</a>`;
    })
    .join("");
}

function renderOutline(headings, logicalPage, language) {
  if (!headings.length) {
    elements.pageOutline.innerHTML =
      '<p class="outline-empty">No heading outline exported for this page.</p>';
    return;
  }
  elements.pageOutline.innerHTML = headings
    .map(
      (heading) => `
        <a class="outline-link outline-level-${heading.level}" href="${escapeHtml(
          buildRouteHash(logicalPage.id, language, heading.id),
        )}">
          ${escapeHtml(heading.text)}
        </a>`,
    )
    .join("");
}

function renderNavigation() {
  const route = state.current?.route || parseRoute();
  const needle = elements.pageSearch.value.trim().toLowerCase();
  const chunks = [];
  for (const group of state.index.groupOrder) {
    const pages = state.index.navOrder
      .map((id) => state.index.logicalPages[id])
      .filter((page) => page.group === group)
      .filter((page) => {
        if (!needle) {
          return true;
        }
        const title = titleFor(page, route.language).toLowerCase();
        return (
          title.includes(needle) ||
          page.slug.toLowerCase().includes(needle) ||
          page.id.toLowerCase().includes(needle)
        );
      });
    if (!pages.length) {
      continue;
    }
    chunks.push(
      `<section class="nav-group">
        <p class="nav-group-title">${escapeHtml(group)}</p>
        ${pages
          .map((page) => {
            const active = state.current?.logicalPage?.id === page.id;
            return `<a class="nav-link ${
              active ? "is-active" : ""
            }" href="${escapeHtml(
              buildRouteHash(page.id, route.language),
            )}">
              <span>${escapeHtml(titleFor(page, route.language))}</span>
              <small>${escapeHtml(page.slug)}</small>
            </a>`;
          })
          .join("")}
      </section>`,
    );
  }
  elements.pageNav.innerHTML =
    chunks.join("") ||
    '<p class="nav-empty">No pages matched the current search.</p>';
}

function renderMissingRoute(route) {
  document.title = "Page Not Found | ION DEX Docs";
  elements.pageTitle.textContent = "Page not found";
  elements.pageSummary.textContent =
    "The requested route does not map to a generated public page. Jump back to the docs site entry and continue from there.";
  elements.docContent.innerHTML = `
    <div class="empty-state">
      <p>The route <code>${escapeHtml(
        buildRouteHash(route.logicalId, route.language, route.anchor),
      )}</code> does not exist in the generated docs map.</p>
      <a class="action-button" href="${escapeHtml(
        buildRouteHash("readme", route.language),
      )}">Open the docs site home</a>
    </div>`;
  elements.fallbackBanner.hidden = true;
  elements.pageOutline.innerHTML = "";
  renderNavigation();
}

function renderFatalError(error) {
  document.title = "Load Error | ION DEX Docs";
  elements.pageTitle.textContent = "Unable to load the current page";
  elements.pageSummary.textContent = error.message;
  elements.docContent.innerHTML = `
    <div class="empty-state">
      <p>The docs site could not finish loading this page.</p>
      <pre>${escapeHtml(error.stack || error.message)}</pre>
    </div>`;
}

function scrollToAnchor(anchor) {
  if (!anchor) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    return;
  }
  requestAnimationFrame(() => {
    const target = document.getElementById(anchor);
    if (target) {
      target.scrollIntoView({ block: "start", behavior: "auto" });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  });
}

function titleFor(logicalPage, language) {
  return (
    logicalPage.titles[language] ||
    logicalPage.titles.en ||
    Object.values(logicalPage.titles)[0] ||
    logicalPage.slug
  );
}

function buildRouteHash(logicalId, language, anchor = "") {
  let path = `#/${encodeURIComponent(language)}/readme`;
  if (logicalId === "whitepaper") {
    path = `#/${encodeURIComponent(language)}/whitepaper`;
  } else if (logicalId !== "readme") {
    path = `#/${encodeURIComponent(language)}/docs/${encodeURIComponent(
      logicalId.replace(/^docs\//u, ""),
    )}`;
  }
  if (anchor) {
    return `${path}?anchor=${encodeURIComponent(anchor)}`;
  }
  return path;
}

function buildTranslateUrl(language, url) {
  const targetLanguage =
    state.index.languages.find((item) => item.key === language)?.translateCode ||
    language;
  const params = new URLSearchParams({
    sl: "auto",
    tl: targetLanguage,
    u: url,
  });
  return `${state.index.translateBase}?${params.toString()}`;
}

function updateHash(logicalId, language, anchor = "") {
  const nextHash = buildRouteHash(logicalId, language, anchor);
  if (window.location.hash === nextHash) {
    return;
  }
  window.location.hash = nextHash;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
