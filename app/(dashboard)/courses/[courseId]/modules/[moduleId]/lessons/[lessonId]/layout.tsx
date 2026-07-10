import { getBuildSitemap } from "@/lib/buildSitemap";

export async function generateStaticParams({
  params,
}: {
  params: { courseId: string };
}) {
  const { modules, lessons } = await getBuildSitemap();
  const moduleIds = new Set(
    modules.filter((m) => String(m.course_id) === params.courseId).map((m) => m.id)
  );
  const result = lessons
    .filter((l) => moduleIds.has(l.module_id))
    .map((l) => ({ moduleId: String(l.module_id), lessonId: String(l.id) }));
  // "0/0" is a placeholder page: it's always built (even when this course
  // already has real lessons) so that .htaccess can route any lesson not yet
  // in the static build (e.g. one created after the last deploy) to a page
  // that fetches the real data client-side.
  return [...result, { moduleId: "0", lessonId: "0" }];
}

export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
