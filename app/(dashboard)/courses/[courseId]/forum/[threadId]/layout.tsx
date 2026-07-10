import { getBuildSitemap } from "@/lib/buildSitemap";

export async function generateStaticParams({
  params,
}: {
  params: { courseId: string };
}) {
  const { threads } = await getBuildSitemap();
  const result = threads
    .filter((t) => String(t.course_id) === params.courseId)
    .map((t) => ({ threadId: String(t.id) }));
  // "0" is a placeholder page: it's always built (even when this course
  // already has real threads) so that .htaccess can route any thread not yet
  // in the static build (e.g. one created after the last deploy) to a page
  // that fetches the real data client-side.
  return [...result, { threadId: "0" }];
}

export default function ForumThreadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
