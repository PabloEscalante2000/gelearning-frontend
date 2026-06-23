"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BookOpen, MessageSquare, Video, TrendingUp, Loader2,
  Users, Award, ShoppingCart, CheckCircle, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ModuleAccordion from "@/components/courses/ModuleAccordion";
import ProgressBar from "@/components/courses/ProgressBar";
import { useCourse, useCourseProgress } from "@/hooks/useCourses";
import { useCreatePaymentPreference } from "@/hooks/usePayments";
import { useQueryClient } from "@tanstack/react-query";

function formatPrice(price: string | null | undefined): string {
  if (price === null || price === undefined) return "";
  const n = parseFloat(price);
  if (n === 0) return "Gratis";
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;
}

// ── Non-enrolled view ─────────────────────────────────────────────────────────

function CoursePreview({
  courseId,
  course,
}: {
  courseId: string;
  course: NonNullable<ReturnType<typeof useCourse>["data"]>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const buyMutation = useCreatePaymentPreference();

  const price = course.price;
  const priceLabel = formatPrice(price);
  const isFree = price !== null && parseFloat(price ?? "0") === 0;
  const isPurchasable = price !== null;

  async function handleBuy() {
    const result = await buyMutation.mutateAsync(course.id);
    if (result.free || result.enrolled) {
      await queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
      router.refresh();
    } else if (result.init_point) {
      window.location.href = result.init_point;
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ── Main column ── */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground mt-3 leading-relaxed text-base">
            {course.description}
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {course.instructor.name}
            </span>
            <Badge variant="default">Publicado</Badge>
          </div>
        </div>

        <Separator />

        {/* Access status banner */}
        <div className="flex items-start gap-4 rounded-lg border bg-muted/40 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No tienes acceso a este curso</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isPurchasable
                ? isFree
                  ? "Este curso es gratuito. Inscríbete para acceder al contenido completo."
                  : `Adquiere el curso por ${priceLabel} para acceder a todas las lecciones y materiales.`
                : "Este curso está disponible solo por invitación. Contactá al administrador para solicitar acceso."}
            </p>
          </div>
        </div>

        {/* What you'll get */}
        <div className="rounded-lg border p-5 space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Al inscribirte obtenés
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              Acceso completo a todas las lecciones
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              Materiales descargables y recursos del curso
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              Participación en el foro del curso
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              Certificado de finalización
            </li>
          </ul>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <div className="space-y-4">
        <div className="rounded-lg border overflow-hidden sticky top-24">
          {course.thumbnail_url && (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full aspect-video object-cover"
            />
          )}
          <div className="p-6 space-y-5">
          {isPurchasable ? (
            <>
              <div className="text-center space-y-1">
                <p className="text-4xl font-bold text-primary">{priceLabel}</p>
                {!isFree && (
                  <p className="text-xs text-muted-foreground">Pago único · Acceso de por vida</p>
                )}
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleBuy}
                disabled={buyMutation.isPending}
              >
                {buyMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isFree ? (
                  <CheckCircle className="mr-2 h-4 w-4" />
                ) : (
                  <ShoppingCart className="mr-2 h-4 w-4" />
                )}
                {isFree ? "Inscribirse gratis" : "Comprar con MercadoPago"}
              </Button>

              {buyMutation.isError && (
                <p className="text-xs text-destructive text-center">
                  Error al procesar. Intentá de nuevo.
                </p>
              )}
            </>
          ) : (
            <div className="text-center space-y-2 py-2">
              <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">Acceso por invitación</p>
              <p className="text-xs text-muted-foreground">
                Contactá al administrador para obtener acceso a este curso.
              </p>
            </div>
          )}

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Instructor</span>
              <span className="font-medium">{course.instructor.name}</span>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Enrolled view ─────────────────────────────────────────────────────────────

function CourseFullView({
  courseId,
  course,
}: {
  courseId: string;
  course: NonNullable<ReturnType<typeof useCourse>["data"]>;
}) {
  const { data: progress } = useCourseProgress(courseId);
  const modules = course.modules ?? [];
  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <Badge>{course.status}</Badge>
          </div>
          <p className="text-muted-foreground mt-2">{course.description}</p>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {course.instructor.name}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {totalLessons} lecciones
            </span>
          </div>
        </div>

        {progress && (
          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="text-sm font-medium mb-2">Tu progreso</p>
            <ProgressBar value={progress.percent} />
            <p className="text-xs text-muted-foreground mt-2">
              {progress.completed}/{progress.total} lecciones completadas
            </p>
          </div>
        )}

        <Separator />

        <div className="flex flex-wrap gap-3">
          <Link href={`/courses/${courseId}/forum/`}>
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              Foro
            </Button>
          </Link>
          <Link href={`/courses/${courseId}/live-sessions/`}>
            <Button variant="outline" size="sm">
              <Video className="mr-2 h-4 w-4" />
              Clases en vivo
            </Button>
          </Link>
          <Link href={`/courses/${courseId}/progress/`}>
            <Button variant="outline" size="sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              Mi progreso
            </Button>
          </Link>
          {progress?.percent === 100 && (
            <Link href={`/courses/${courseId}/certificate/`}>
              <Button variant="outline" size="sm">
                <Award className="mr-2 h-4 w-4" />
                Mi certificado
              </Button>
            </Link>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Contenido del curso</h2>
          {modules.length > 0 ? (
            <ModuleAccordion modules={modules} courseId={courseId} />
          ) : (
            <p className="text-muted-foreground text-sm">No hay módulos disponibles.</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border overflow-hidden sticky top-24">
          {course.thumbnail_url && (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full aspect-video object-cover"
            />
          )}
          <div className="p-6 space-y-4">
          {modules[0]?.lessons?.[0] && (
            <Link
              href={`/courses/${courseId}/modules/${modules[0].id}/lessons/${modules[0].lessons![0].id}/`}
            >
              <Button className="w-full">
                {progress && progress.completed > 0 ? "Continuar curso" : "Empezar curso"}
              </Button>
            </Link>
          )}

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Módulos</span>
              <span>{modules.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lecciones</span>
              <span>{totalLessons}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Instructor</span>
              <span>{course.instructor.name}</span>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: course, isLoading } = useCourse(courseId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return <p className="text-muted-foreground">Curso no encontrado.</p>;
  }

  if (course.is_enrolled === false) {
    return <CoursePreview courseId={courseId} course={course} />;
  }

  return <CourseFullView courseId={courseId} course={course} />;
}
