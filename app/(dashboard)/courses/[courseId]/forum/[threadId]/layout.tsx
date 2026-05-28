export function generateStaticParams() {
  return [{ threadId: "0" }];
}

export default function ForumThreadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
