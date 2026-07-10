export type BuildSitemap = {
  courses: number[];
  modules: { id: number; course_id: number }[];
  lessons: { id: number; module_id: number }[];
  threads: { id: number; course_id: number }[];
};

// Only used by generateStaticParams during `next build` (Node, never bundled
// for the client). Next.js memoizes identical fetch() calls within a build,
// so this only hits the backend once even though every layout calls it.
export async function getBuildSitemap(): Promise<BuildSitemap> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/build/sitemap`, {
    headers: { "X-Build-Secret": process.env.BUILD_SITEMAP_SECRET ?? "" },
  });

  if (!res.ok) {
    throw new Error(
      `generateStaticParams: no se pudo obtener /api/v1/build/sitemap (${res.status}). ` +
        `Verifica NEXT_PUBLIC_API_URL y BUILD_SITEMAP_SECRET.`
    );
  }

  const json = await res.json();
  return json.data as BuildSitemap;
}
