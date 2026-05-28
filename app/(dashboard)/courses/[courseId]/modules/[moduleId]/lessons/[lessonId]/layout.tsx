export function generateStaticParams() {
  return [{ moduleId: "0", lessonId: "0" }];
}

export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
