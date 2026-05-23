/**
 * Tiny helper for serving Pexels images at the right size per viewport.
 *
 * Pexels CDN accepts `?w=` (and optionally `&h=`) to scale & crop on the fly,
 * so we can derive a `srcset` from any single Pexels URL just by rewriting
 * the width parameter. This is how we keep one source of truth in our JSON
 * data files while serving 480 / 800 / 1200 pixel-wide variants on demand.
 */

const DEFAULT_WIDTHS = [480, 800, 1200] as const;

/** Returns true for URLs we know how to resize via `?w=` query rewriting. */
export function isPexels(url: string): boolean {
  return typeof url === "string" && url.includes("images.pexels.com");
}

/** Replace (or insert) the `w=` and `h=` query params, preserving aspect ratio. */
function withWidth(url: string, w: number): string {
  if (!isPexels(url)) return url;
  let u: URL;
  try { u = new URL(url); } catch { return url; }

  // Preserve the original w/h ratio so the crop stays consistent.
  const baseW = parseInt(u.searchParams.get("w") || "1200", 10);
  const baseH = parseInt(u.searchParams.get("h") || "0", 10);
  u.searchParams.set("w", String(w));
  if (baseH > 0 && baseW > 0) {
    u.searchParams.set("h", String(Math.max(1, Math.round((w * baseH) / baseW))));
  }
  return u.toString();
}

/** Produce a srcset string like "url 480w, url 800w, url 1200w". */
export function pexelsSrcset(url: string, widths: readonly number[] = DEFAULT_WIDTHS): string {
  if (!isPexels(url)) return "";
  return widths.map((w) => `${withWidth(url, w)} ${w}w`).join(", ");
}

/** Produce a single resized URL (handy for the `src=` default). */
export function pexelsSrc(url: string, width: number): string {
  return withWidth(url, width);
}
