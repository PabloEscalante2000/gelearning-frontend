import { getBuildSitemap } from "@/lib/buildSitemap";

export async function generateStaticParams() {
  const { courses } = await getBuildSitemap();
  // "0" is a placeholder page: it's always built so that .htaccess can route
  // any courseId not yet in the static build (e.g. a course created after the
  // last deploy) to a page that fetches the real data client-side.
  return [...courses.map((id) => ({ courseId: String(id) })), { courseId: "0" }];
}

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
