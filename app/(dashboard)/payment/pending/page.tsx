"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePaymentStatus } from "@/hooks/usePayments";
import { Suspense } from "react";

function PendingContent() {
  const searchParams = useSearchParams();
  const pid = searchParams.get("pid");
  const { data } = usePaymentStatus(pid);

  const isApproved = data?.status === "approved";
  const courseId = data?.course_id;

  if (isApproved) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <BookOpen className="h-10 w-10 text-green-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">¡Pago aprobado!</h1>
          <p className="text-muted-foreground">Tu acceso al curso ya está activo.</p>
        </div>
        {courseId && (
          <Link href={`/courses/${courseId}/`}>
            <Button>Ir al curso</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
        <Clock className="h-10 w-10 text-yellow-600" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Pago en proceso</h1>
        <p className="text-muted-foreground max-w-sm">
          Tu pago está siendo revisado. Este proceso puede demorar hasta 24 horas
          dependiendo del método de pago utilizado. Te notificaremos por email
          cuando se acredite.
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Verificando estado...
      </div>

      <Link href="/courses/">
        <Button variant="outline">Volver al catálogo</Button>
      </Link>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
        <PendingContent />
      </Suspense>
    </div>
  );
}
