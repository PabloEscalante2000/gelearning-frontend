export function generateStaticParams() {
  return [{ courseId: "0" }];
}

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
