/**
 * WordPress headless CMS client (PRD §11, Phase 7.5).
 * WordPress serves blog/resources/page copy ONLY via REST; all booking logic
 * lives in this codebase. Gracefully disabled until WORDPRESS_URL is set —
 * run `npm run build` with no WP configured to verify the fallback.
 */

export type CmsPost = {
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  updatedAt: string;
};

function baseUrl(): string | null {
  const url = process.env.WORDPRESS_URL?.replace(/\/$/, "");
  return url || null;
}

type WpPost = {
  slug: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  content?: { rendered?: string };
  modified?: string;
};

function mapPost(p: WpPost): CmsPost {
  return {
    slug: p.slug,
    title: p.title?.rendered ?? p.slug,
    excerpt: p.excerpt?.rendered ?? "",
    contentHtml: p.content?.rendered ?? "",
    updatedAt: p.modified ?? new Date(0).toISOString(),
  };
}

/** Latest posts for blog/resources surfaces (ISR tag: "cms"). */
export async function getCmsPosts(perPage = 10): Promise<CmsPost[]> {
  const base = baseUrl();
  if (!base) return [];
  const res = await fetch(`${base}/wp-json/wp/v2/posts?per_page=${perPage}&_fields=slug,title,excerpt,content,modified`, {
    next: { tags: ["cms"], revalidate: 300 },
  });
  if (!res.ok) throw new Error(`CMS HTTP ${res.status}`);
  const data = (await res.json()) as WpPost[];
  return data.map(mapPost);
}

/** Single post/page by slug. Returns null when missing or unconfigured. */
export async function getCmsEntry(slug: string): Promise<CmsPost | null> {
  const base = baseUrl();
  if (!base) return null;
  const res = await fetch(
    `${base}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=slug,title,excerpt,content,modified`,
    { next: { tags: ["cms", `cms:${slug}`], revalidate: 300 } },
  );
  if (!res.ok) throw new Error(`CMS HTTP ${res.status}`);
  const data = (await res.json()) as WpPost[];
  return data.length > 0 ? mapPost(data[0]) : null;
}
