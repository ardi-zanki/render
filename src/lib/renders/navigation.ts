export type RenderDetailBackLink = {
  href: string;
  label: string;
};

/**
 * Resolve a browser-provided return target without allowing an open redirect.
 * A render can return only to its own project or to the render-history page.
 */
export function renderDetailBackLink(
  returnTo: string | undefined,
  projectId: string,
  projectName: string,
): RenderDetailBackLink {
  const fallback = { href: "/renders", label: "Semua render" };
  if (!returnTo?.startsWith("/") || returnTo.startsWith("//")) return fallback;

  try {
    const target = new URL(returnTo, "https://renderai.local");
    const href = `${target.pathname}${target.search}`;
    if (target.pathname === "/renders") return { href, label: "Semua render" };
    if (target.pathname === `/projects/${projectId}`) {
      return { href, label: projectName };
    }
  } catch {
    return fallback;
  }

  return fallback;
}
