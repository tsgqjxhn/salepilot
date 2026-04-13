import type { RouteLocationNormalized } from "vue-router";

const APP_NAME = "SalePilot";
const DEFAULT_TITLE = `${APP_NAME} | AI Sales Workspace`;
const DEFAULT_DESCRIPTION =
  "SalePilot is an AI-powered sales workspace for customer management, follow-ups, daily reports, notifications, and revenue analytics.";
const DEFAULT_KEYWORDS =
  "SalePilot, CRM, sales workspace, customer management, AI sales analysis, sales dashboard, daily report";
const DEFAULT_IMAGE_PATH = "headericon.svg";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const resolveSiteOrigin = () => {
  const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim();
  if (configuredSiteUrl) {
    return trimTrailingSlash(configuredSiteUrl);
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return trimTrailingSlash(window.location.origin);
  }

  return "";
};

const toAbsoluteUrl = (value: string, siteOrigin: string) => {
  if (!value) {
    return "";
  }

  try {
    if (siteOrigin) {
      return new URL(value, `${siteOrigin}/`).toString();
    }

    if (typeof window !== "undefined" && window.location.origin) {
      return new URL(value, window.location.origin).toString();
    }
  } catch {
    return value;
  }

  return value;
};

const ensureMetaTag = (selector: string, attributeName: string, attributeValue: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }

  return element;
};

const setMetaName = (name: string, content: string) => {
  const element = ensureMetaTag(`meta[name="${name}"]`, "name", name);
  element.setAttribute("content", content);
};

const setMetaProperty = (property: string, content: string) => {
  const element = ensureMetaTag(`meta[property="${property}"]`, "property", property);
  element.setAttribute("content", content);
};

const setCanonicalLink = (href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
};

const formatRouteName = (value: string) => (
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
);

const resolveSeoMeta = (route: RouteLocationNormalized) => (
  route.matched.reduce<NonNullable<RouteLocationNormalized["meta"]["seo"]>>((merged, record) => {
    if (!record.meta.seo) {
      return merged;
    }

    return {
      ...merged,
      ...record.meta.seo,
    };
  }, {})
);

export const applyRouteSeo = (route: RouteLocationNormalized) => {
  if (typeof document === "undefined") {
    return;
  }

  const siteOrigin = resolveSiteOrigin();
  const seo = resolveSeoMeta(route);
  const fallbackTitle = typeof route.name === "string" && route.name.trim()
    ? formatRouteName(route.name)
    : APP_NAME;
  const resolvedTitle = seo.title?.trim() || fallbackTitle;
  const fullTitle = resolvedTitle.includes(APP_NAME)
    ? resolvedTitle
    : `${resolvedTitle} | ${APP_NAME}`;
  const description = seo.description?.trim() || DEFAULT_DESCRIPTION;
  const keywords = seo.keywords?.trim() || DEFAULT_KEYWORDS;
  const type = seo.type || "website";
  const noindex = seo.noindex ?? Boolean(route.meta.requiresAuth);
  const canonicalUrl = siteOrigin
    ? toAbsoluteUrl(route.path || "/", siteOrigin)
    : route.path || "/";
  const imageUrl = toAbsoluteUrl(seo.image || DEFAULT_IMAGE_PATH, siteOrigin);

  document.title = resolvedTitle === APP_NAME ? DEFAULT_TITLE : fullTitle;
  document.documentElement.setAttribute("lang", "zh-CN");

  setMetaName("description", description);
  setMetaName("keywords", keywords);
  setMetaName("theme-color", "#f5f2e8");
  setMetaName("robots", noindex ? "noindex,nofollow" : "index,follow");
  setMetaName("application-name", APP_NAME);
  setMetaProperty("og:site_name", APP_NAME);
  setMetaProperty("og:type", type);
  setMetaProperty("og:title", document.title);
  setMetaProperty("og:description", description);
  setMetaProperty("og:url", canonicalUrl);
  setMetaProperty("og:image", imageUrl);
  setMetaName("twitter:card", "summary_large_image");
  setMetaName("twitter:title", document.title);
  setMetaName("twitter:description", description);
  setMetaName("twitter:image", imageUrl);
  setCanonicalLink(canonicalUrl);
};
