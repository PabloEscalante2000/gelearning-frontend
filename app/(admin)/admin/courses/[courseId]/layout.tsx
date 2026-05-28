export function generateStaticParams() {
  return [{ courseId: "0" }];
}

export default function AdminCourseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
