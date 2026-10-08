import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { ReportButton } from "#/components/reports/report-button.tsx";
import { ShotCard } from "#/components/shots/shot-card.tsx";
import { feedQueryOptions } from "#/lib/posts/queries.ts";

export const Route = createFileRoute("/_public/shots")({
  component: ShotsPage,
});

function ShotsPage() {
  const { data: feed, isPending, isError } = useQuery(feedQueryOptions());

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Shots</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Latest work posted by creators on Sho-vee. Follow a creator to see more like this.
          </p>
        </div>
        {feed && feed.length > 0 ? (
          <p className="text-xs text-muted-foreground">{feed.length} recent posts</p>
        ) : null}
      </header>

      {isPending ? (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              key={index}
              className="mb-4 aspect-square w-full animate-pulse break-inside-avoid rounded-2xl bg-muted"
            />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load the feed.</p>
      ) : feed && feed.length > 0 ? (
        // Masonry by CSS columns: uneven post ratios stay visible instead of being cropped.
        <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {feed.map(({ post, creator }) => (
            <li key={post.id} className="mb-4 break-inside-avoid">
              <ShotCard post={post} creator={creator} className="aspect-[4/5]">
                <ReportButton targetType="post" targetId={post.id} />
              </ShotCard>
              {post.tags.length > 0 ? (
                <p className="mt-2 flex flex-wrap gap-1.5 px-1">
                  {post.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-xs text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">No posts yet. Be the first to share work.</p>
          <Link to="/signup" className="mt-2 inline-block text-sm underline underline-offset-4">
            Join Sho-vee
          </Link>
        </div>
      )}
    </div>
  );
}
