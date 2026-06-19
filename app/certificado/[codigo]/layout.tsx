export function generateStaticParams() {
  const params = [];
  for (const year of ["2026", "2027", "2028"]) {
    for (let i = 1; i <= 100; i++) {
      params.push({ codigo: `GE-${year}-NEURO-AULA-${String(i).padStart(4, "0")}` });
    }
  }
  return params;
}

export default function CertificadoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
