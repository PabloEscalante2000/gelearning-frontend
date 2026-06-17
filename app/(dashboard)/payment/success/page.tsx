"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePaymentStatus } from "@/hooks/usePayments";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const pid = searchParams.get("pid");
  // MP appends collection_id (= MP payment ID) to the success URL
  const mpId = searchParams.get("collection_id") ?? searchParams.get("payment_id");
  const { data, isLoading } = usePaymentStatus(pid, mpId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Verificando tu pago...</p>
      </div>
    );
  }

  const isApproved = data?.status === "approved";
  const courseId = data?.course_id;

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">
          {isApproved ? "¡Pago aprobado!" : "¡Gracias por tu compra!"}
        </h1>
        <p className="text-muted-foreground max-w-sm">
          {isApproved
            ? "Tu pago fue procesado exitosamente. Ya tienes acceso al curso."
            : "Tu pago está siendo procesado. Recibirás confirmación en breve y el acceso se activará automáticamente."}
        </p>
      </div>

      <div className="flex gap-3">
        {isApproved && courseId && (
          <Link href={`/courses/${courseId}/`}>
            <Button>
              <BookOpen className="mr-2 h-4 w-4" />
              Ir al curso
            </Button>
          </Link>
        )}
        <Link href="/courses/">
          <Button variant="outline">Ver catálogo</Button>
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
