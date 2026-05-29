"use client";

import { ExternalLink, Video, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  url: string;
  title?: string;
}

// ── URL detection ─────────────────────────────────────────────────────────────

function isGoogleMeet(url: string) {
  return url.includes("meet.google.com");
}

function isGoogleDrive(url: string) {
  return url.includes("drive.google.com") || url.includes("docs.google.com");
}

function isYouTube(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function isVimeo(url: string) {
  return url.includes("vimeo.com");
}

// ── Embed URL builders ────────────────────────────────────────────────────────

function getDriveEmbedUrl(url: string): string {
  // drive.google.com/file/d/FILE_ID/view  →  .../preview
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;

  // docs.google.com/document/d/DOC_ID/...
  const docsMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docsMatch) return `https://docs.google.com/document/d/${docsMatch[1]}/preview`;

  // Already a preview URL or unknown pattern — return as-is
  return url;
}

function getYouTubeEmbedUrl(url: string): string {
  return url
    .replace("watch?v=", "embed/")
    .replace("youtu.be/", "youtube.com/embed/");
}

function getVimeoEmbedUrl(url: string): string {
  return url.replace("vimeo.com/", "player.vimeo.com/video/");
}

// ── Button card for non-embeddable content ────────────────────────────────────

function LaunchCard({
  url,
  title,
  label,
  icon: Icon,
  description,
}: {
  url: string;
  title?: string;
  label: string;
  icon: React.ElementType;
  description: string;
}) {
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-5 rounded-lg border bg-muted/30">
      <div className="flex flex-col items-center gap-2 text-center px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <p className="font-semibold">{title ?? label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button asChild>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" />
          {label}
        </a>
      </Button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VideoPlayer({ url, title }: VideoPlayerProps) {
  // Google Meet — can't be embedded
  if (isGoogleMeet(url)) {
    return (
      <LaunchCard
        url={url}
        title={title}
        label="Unirse a Google Meet"
        icon={Video}
        description="Esta sesión se abre en Google Meet."
      />
    );
  }

  // Google Drive — embed via preview URL
  if (isGoogleDrive(url)) {
    const embedUrl = getDriveEmbedUrl(url);
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          src={embedUrl}
          title={title ?? "Contenido de Google Drive"}
          allow="autoplay"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  // YouTube embed
  if (isYouTube(url)) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          src={getYouTubeEmbedUrl(url)}
          title={title ?? "Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  // Vimeo embed
  if (isVimeo(url)) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          src={getVimeoEmbedUrl(url)}
          title={title ?? "Video"}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  // Direct video file (.mp4, .webm, etc.)
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video src={url} controls className="h-full w-full" title={title}>
        Tu navegador no soporta la reproducción de video.
      </video>
    </div>
  );
}
