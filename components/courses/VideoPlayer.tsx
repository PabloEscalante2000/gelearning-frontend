"use client";

interface VideoPlayerProps {
  url: string;
  title?: string;
}

export default function VideoPlayer({ url, title }: VideoPlayerProps) {
  const isIframe =
    url.includes("iframe.mediadelivery.net") ||
    url.includes("youtube.com") ||
    url.includes("vimeo.com");

  if (isIframe) {
    const embedUrl = url
      .replace("watch?v=", "embed/")
      .replace("vimeo.com/", "player.vimeo.com/video/");

    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          src={embedUrl}
          title={title ?? "Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video
        src={url}
        controls
        className="h-full w-full"
        title={title}
      >
        Tu navegador no soporta la reproducción de video.
      </video>
    </div>
  );
}
