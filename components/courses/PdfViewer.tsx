"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfViewerProps {
  url: string;
  title?: string;
}

function isGoogleDrive(url: string) {
  return url.includes("drive.google.com") || url.includes("docs.google.com");
}

function getDriveEmbedUrl(url: string): string {
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  const docsMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docsMatch) return `https://docs.google.com/document/d/${docsMatch[1]}/preview`;
  return url;
}

export default function PdfViewer({ url, title }: PdfViewerProps) {
  const embedUrl = isGoogleDrive(url) ? getDriveEmbedUrl(url) : `${url}#toolbar=1&navpanes=0`;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full overflow-hidden rounded-lg border bg-muted" style={{ height: "70vh" }}>
        <iframe
          src={embedUrl}
          title={title ?? "Documento"}
          className="h-full w-full"
          allow="autoplay"
        />
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir en Google Drive
          </a>
        </Button>
      </div>
    </div>
  );
}
