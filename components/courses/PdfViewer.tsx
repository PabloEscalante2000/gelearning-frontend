"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfViewerProps {
  url: string;
  title?: string;
}

export default function PdfViewer({ url, title }: PdfViewerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full overflow-hidden rounded-lg border bg-muted" style={{ height: "70vh" }}>
        <iframe
          src={`${url}#toolbar=1&navpanes=0`}
          title={title ?? "Documento PDF"}
          className="h-full w-full"
        />
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir en nueva pestaña
          </a>
        </Button>
      </div>
    </div>
  );
}
