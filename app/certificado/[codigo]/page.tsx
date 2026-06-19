"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { CheckCircle, Shield, XCircle, Loader2 } from "lucide-react";
import { useVerifyDiploma } from "@/hooks/useDiplomaVerifications";

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", {
    day: "numeric", month: "long", year: "numeric",
  });
}

const INSTITUTIONS = [
  { abbr: "IRG",  name: "Instituto Raimon Gaja",                        city: "Barcelona, España"  },
  { abbr: "EAAP", name: "European Association of Applied Psychology",    city: "Sofía, Bulgaria"    },
  { abbr: "IAT",  name: "International Association of Therapists",       city: "Dublín, Irlanda"    },
];

export default function CertificadoPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const { data: diploma, isLoading, isError } = useVerifyDiploma(codigo);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <Image
            src="/img/logo_fondo_claro.png"
            alt="Grupo EADES"
            width={150}
            height={40}
            priority
          />
          <div className="border-l pl-4 hidden sm:block">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Verificación oficial de diploma
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-5">

        {/* ── Loading ───────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Verificando diploma…</p>
          </div>
        )}

        {/* ── Not found ─────────────────────────────────────────────────── */}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center space-y-3">
            <XCircle className="h-12 w-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-semibold text-red-700">Código no válido</h2>
            <p className="text-sm text-red-600">
              El código{" "}
              <span className="font-mono font-medium">{codigo}</span>{" "}
              no fue encontrado en nuestros registros.
            </p>
            <p className="text-xs text-red-400">
              Verifica que el código sea correcto o contacta a Grupo EADES.
            </p>
          </div>
        )}

        {/* ── Valid diploma ─────────────────────────────────────────────── */}
        {diploma && (
          <>
            <p className="text-center text-sm text-muted-foreground">
              Este documento ha sido emitido por Grupo EADES como constancia de culminación y
              aprobación de un programa de formación especializada con certificación internacional.
            </p>

            {/* Status */}
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-8 w-8 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-bold text-emerald-800 text-lg leading-tight">
                    Diploma válido y verificado
                  </p>
                  <p className="text-sm text-emerald-700">
                    <span className="font-medium">Estado:</span> Válido y autenticado
                  </p>
                  <p className="text-sm text-emerald-700">
                    <span className="font-medium">Código de certificado:</span>{" "}
                    <span className="font-mono">{diploma.code}</span>
                  </p>
                  <p className="text-sm text-emerald-700">
                    <span className="font-medium">Fecha de emisión:</span>{" "}
                    {formatDate(diploma.issued_at)}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-center gap-1 pt-1">
                  <Shield className="h-7 w-7 text-emerald-600" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide text-center leading-tight">
                    Documento<br />autenticado
                  </span>
                </div>
              </div>
            </div>

            {/* Person */}
            <div className="rounded-xl bg-white border p-5 sm:p-6 space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Persona certificada
              </h3>
              <p className="text-2xl font-bold">{diploma.student_name}</p>
              {diploma.student_document && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Documento de identidad:</span>{" "}
                  {diploma.student_document}
                </p>
              )}
            </div>

            {/* Program */}
            <div className="rounded-xl bg-white border p-5 sm:p-6 space-y-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Datos del programa
              </h3>
              <p className="text-lg font-bold leading-snug">
                Más allá del diagnóstico: Neurociencias en el aula
              </p>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Periodo de formación</p>
                  <p className="font-medium">Junio a julio de 2026</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duración</p>
                  <p className="font-medium">18 horas académicas</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Modalidad</p>
                  <p className="font-medium">Formación especializada</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Área</p>
                  <p className="font-medium">Educación, neurociencias y aula</p>
                </div>
              </div>
            </div>

            {/* Institutions */}
            <div className="rounded-xl bg-white border p-5 sm:p-6 space-y-4">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Instituciones certificadoras
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Respaldo y certificación internacional
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {INSTITUTIONS.map((inst) => (
                  <div
                    key={inst.abbr}
                    className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-gray-50 border"
                  >
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}
                    >
                      {inst.abbr}
                    </div>
                    <p className="text-xs font-semibold leading-tight">{inst.name}</p>
                    <p className="text-xs text-muted-foreground">{inst.city}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation text */}
            <div className="rounded-xl bg-white border p-5 sm:p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Grupo EADES certifica que{" "}
                <span className="font-semibold text-foreground">{diploma.student_name}</span> ha
                culminado y aprobado satisfactoriamente el programa de formación especializada{" "}
                <em>"Más allá del diagnóstico: Neurociencias en el aula"</em>, desarrollado durante
                los meses de junio a julio de 2026, con una duración total de 18 horas académicas.
              </p>
              <p>
                El presente diploma cuenta con respaldo internacional de las instituciones indicadas.
                La autenticidad de este diploma puede verificarse únicamente mediante este código de
                certificado y el enlace oficial de validación de Grupo EADES.
              </p>
            </div>

            {/* Signature */}
            <div className="rounded-xl bg-white border p-5 sm:p-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Emitido por
              </p>
              <p className="font-bold text-lg">César Escalante Sifuentes</p>
              <p className="text-sm text-muted-foreground">Director del Grupo EADES</p>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground pb-4">
              © Grupo EADES · Verificación oficial · grupoeades.org
            </p>
          </>
        )}
      </main>
    </div>
  );
}
