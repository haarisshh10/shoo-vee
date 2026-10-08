import { Link } from "@tanstack/react-router";
import { MapPinIcon, PlayIcon } from "lucide-react";

/**
 * Image-first card for the shots feed and the landing collage. Text is deliberately secondary to the
 * media: this is the surface that has to look like a creative community, not a listing.
 */
export function ShotCard({
  post,
  creator,
  className,
  children,
}: {
  post: {
    id: string;
    caption: string | null;
    mediaUrl: string;
    mediaType: string;
    location: string | null;
    tags: string[];
  };
  creator: { id: string; displayName: string };
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <figure className={`group relative overflow-hidden rounded-2xl bg-muted ${className ?? ""}`}>
      {post.mediaType === "video" ? (
        <>
          <video
            src={post.mediaUrl}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            muted
            playsInline
            preload="metadata"
          />
          <span className="absolute start-3 top-3 grid size-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm">
            <PlayIcon className="size-4 fill-current" aria-hidden="true" />
          </span>
        </>
      ) : (
        <img
          src={post.mediaUrl}
          alt={post.caption ?? `Shot by ${creator.displayName}`}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3">
        {post.caption ? (
          <p className="line-clamp-2 text-sm font-medium text-white">{post.caption}</p>
        ) : null}
        <div className="flex items-center gap-2 text-xs text-white/70">
          <Link
            to="/creators/$creatorId"
            params={{ creatorId: creator.id }}
            className="pointer-events-auto font-medium text-white/90 hover:underline"
          >
            {creator.displayName}
          </Link>
          {post.location ? (
            <span className="flex items-center gap-0.5">
              <MapPinIcon className="size-3" aria-hidden="true" />
              {post.location}
            </span>
          ) : null}
        </div>
      </figcaption>

      {children ? (
        // The media underneath can be almost any brightness, so the action sits on its own scrim.
        <div className="absolute end-2 top-2 rounded-full bg-black/55 p-0.5 backdrop-blur-sm">
          {children}
        </div>
      ) : null}
    </figure>
  );
}
