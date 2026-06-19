"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Plus, Download, Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useDiplomaVerifications, useCreateDiplomaVerification } from "@/hooks/useDiplomaVerifications";
import type { DiplomaVerification } from "@/types";

const VERIFY_BASE = "https://grupoeades.org/learning/certificado";
const FIXED_COURSE_ID = 1;

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function downloadCanvas(id: string, filename: string) {
  const canvas = document.getElementById(id) as HTMLCanvasElement | null;
  if (!canvas) return;
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  link.click();
}

// ── QR modal for existing verifications ──────────────────────────────────────
function QRModal({ diploma }: { diploma: DiplomaVerification }) {
  const [open, setOpen] = useState(false);
  const canvasId = `qr-modal-${diploma.code}`;
  const url = `${VERIFY_BASE}/${diploma.code}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <QrCode className="h-3 w-3 mr-1.5" />QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Código QR</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 pt-1">
          <div className="border rounded-lg p-3">
            <QRCodeCanvas id={canvasId} value={url} size={200} level="H" includeMargin />
          </div>
          <p className="text-xs font-mono text-muted-foreground text-center break-all">{diploma.code}</p>
          <Button className="w-full" onClick={() => downloadCanvas(canvasId, `diploma-${diploma.code}.png`)}>
            <Download className="mr-2 h-4 w-4" />Descargar PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminCertificadosPage() {
  const { data: verifications, isLoading } = useDiplomaVerifications();
  const create = useCreateDiplomaVerification();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    student_name: "",
    student_document: "",
    issued_at: new Date().toISOString().split("T")[0],
  });
  const [created, setCreated] = useState<DiplomaVerification | null>(null);

  function resetDialog() {
    setCreated(null);
    setForm({ student_name: "", student_document: "", issued_at: new Date().toISOString().split("T")[0] });
    create.reset();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const diploma = await create.mutateAsync({
      student_name: form.student_name.trim(),
      student_document: form.student_document.trim() || undefined,
      course_id: FIXED_COURSE_ID,
      issued_at: form.issued_at,
    });
    setCreated(diploma);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Verificaciones de Diploma</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Más allá del diagnóstico: Neurociencias en el aula
          </p>
        </div>

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetDialog(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Crear verificación</Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            {!created ? (
              <>
                <DialogHeader>
                  <DialogTitle>Nueva verificación de diploma</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nombre completo del estudiante</Label>
                    <Input
                      id="name"
                      value={form.student_name}
                      onChange={(e) => setForm((f) => ({ ...f, student_name: e.target.value }))}
                      placeholder="Ej: Valeria Arbulu"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="doc">
                      Documento de identidad{" "}
                      <span className="text-muted-foreground font-normal">(opcional)</span>
                    </Label>
                    <Input
                      id="doc"
                      value={form.student_document}
                      onChange={(e) => setForm((f) => ({ ...f, student_document: e.target.value }))}
                      placeholder="Ej: ***4567 (parcial, por privacidad)"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="date">Fecha de emisión</Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.issued_at}
                      onChange={(e) => setForm((f) => ({ ...f, issued_at: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                    Curso:{" "}
                    <span className="font-medium text-foreground">
                      Más allá del diagnóstico: Neurociencias en el aula
                    </span>
                  </div>

                  {create.isError && (
                    <p className="text-sm text-destructive">Error al crear la verificación. Intenta de nuevo.</p>
                  )}

                  <Button type="submit" className="w-full" disabled={create.isPending}>
                    {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generar verificación
                  </Button>
                </form>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Verificación creada</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 pt-1">
                  <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
                    {created.code}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Estudiante: <span className="font-medium text-foreground">{created.student_name}</span>
                  </p>
                  <div className="border rounded-lg p-3">
                    <QRCodeCanvas
                      id={`qr-new-${created.code}`}
                      value={`${VERIFY_BASE}/${created.code}`}
                      size={200}
                      level="H"
                      includeMargin
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center break-all">
                    {VERIFY_BASE}/{created.code}
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => downloadCanvas(`qr-new-${created.code}`, `diploma-${created.code}.png`)}
                  >
                    <Download className="mr-2 h-4 w-4" />Descargar QR
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Código</th>
              <th className="px-4 py-3 text-left font-medium">Estudiante</th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Documento</th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Fecha emisión</th>
              <th className="px-4 py-3 text-left font-medium">QR</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </td>
              </tr>
            )}
            {!isLoading && (!verifications || verifications.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No hay verificaciones todavía. Crea la primera.
                </td>
              </tr>
            )}
            {verifications?.map((v) => (
              <tr key={v.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{v.code}</td>
                <td className="px-4 py-3 font-medium">{v.student_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{v.student_document ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(v.issued_at)}</td>
                <td className="px-4 py-3">
                  <QRModal diploma={v} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
