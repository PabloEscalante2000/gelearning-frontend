"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function FailureContent() {
  const searchParams = useSearchParams();
  const pid = searchParams.get("pid");

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <XCircle className="h-10 w-10 text-red-600" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Pago no completado</h1>
        <p className="text-muted-foreground max-w-sm">
          El pago no pudo procesarse. No se realizó ningún cargo. Puedes intentarlo
          de nuevo cuando quieras.
        </p>
      </div>

      <div className="flex gap-3">
        <Link href="/courses/">
          <Button>Volver al catálogo</Button>
        </Link>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Suspense>
        <FailureContent />
      </Suspense>
    </div>
  );
}
