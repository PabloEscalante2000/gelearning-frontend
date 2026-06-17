export function generateStaticParams() {
  return Array.from({ length: 20 }, (_, i) => ({ courseId: String(i + 1) }));
}

export default function AdminCourseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
