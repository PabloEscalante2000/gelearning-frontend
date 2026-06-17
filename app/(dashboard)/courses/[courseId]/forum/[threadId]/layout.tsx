export function generateStaticParams() {
  return Array.from({ length: 25 }, (_, i) => ({ threadId: String(i + 1) }));
}

export default function ForumThreadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
