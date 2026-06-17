export function generateStaticParams() {
  const params = [];
  for (let m = 1; m <= 5; m++) {
    for (let l = 1; l <= 25; l++) {
      params.push({ moduleId: String(m), lessonId: String(l) });
    }
  }
  return params;
}

export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
