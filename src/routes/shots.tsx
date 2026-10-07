import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { feedQueryOptions } from "#/lib/posts/queries.ts";

export const Route = createFileRoute("/shots")({
  component: ShotsPage,
});

function ShotsPage() {
  const { data: feed, isPending, isError } = useQuery(feedQueryOptions());

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Shots</h1>
        <p className="text-sm text-muted-foreground">Work from creators on Sho-vee.</p>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load the feed.</p>
      ) : feed && feed.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {feed.map(({ post, creator }) => (
            <li key={post.id} className="flex flex-col gap-2">
              {post.mediaType === "image" ? (
                <img
                  src={post.mediaUrl}
                  alt={post.caption ?? "Post"}
                  className="aspect-square w-full rounded-md object-cover"
                />
              ) : (
                <video
                  src={post.mediaUrl}
                  className="aspect-square w-full rounded-md object-cover"
                  controls
                  muted
                >
                  <track kind="captions" label="No captions available" />
                </video>
              )}
              {post.caption && (
                <p className="line-clamp-2 text-sm text-muted-foreground">{post.caption}</p>
              )}
              <Link
                to="/creators/$creatorId"
                params={{ creatorId: creator.id }}
                className="text-sm font-medium hover:underline"
              >
                {creator.displayName}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No posts yet. Be the first to share work.</p>
      )}
    </div>
  );
}
