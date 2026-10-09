import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { ReportButton } from "#/components/reports/report-button.tsx";
import { ShotCard } from "#/components/shots/shot-card.tsx";
import { useAuth } from "#/lib/auth/hooks.ts";
import { feedQueryOptions } from "#/lib/posts/queries.ts";
import { followingFeedQueryOptions } from "#/lib/social/queries.ts";

export const Route = createFileRoute("/_public/shots")({
  component: ShotsPage,
});

function ShotsPage() {
  const { user, isPending: authPending } = useAuth();
  const [tab, setTab] = useState<"latest" | "following">("latest");

  const latest = useQuery({ ...feedQueryOptions(), enabled: tab === "latest" });
  const following = useQuery({
    ...followingFeedQueryOptions(),
    enabled: tab === "following" && !!user,
  });
  const { data: feed, isPending, isError } = tab === "following" ? following : latest;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Shots</h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Fresh work from creators across India. Follow the ones you like to shape your own feed.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Feed"
            className="flex w-fit items-center gap-1 rounded-full border p-1 text-sm"
          >
            {(["latest", "following"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={`rounded-full px-3 py-1.5 font-medium capitalize transition-colors ${
                  tab === value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          {tab === "latest" && feed && feed.length > 0 ? (
            <p className="text-xs text-muted-foreground">{feed.length} recent posts</p>
          ) : null}
        </div>
      </header>

      <div className="mt-8">
        {tab === "following" && !authPending && !user ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Sign in to see posts from the creators you follow.
            </p>
            <Link to="/login" className="mt-2 inline-block text-sm underline underline-offset-4">
              Sign in
            </Link>
          </div>
        ) : isPending ? (
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
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            {tab === "following" ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Your Following feed is empty. Follow creators to see their latest work here.
                </p>
                <Link
                  to="/discover"
                  className="mt-2 inline-block text-sm underline underline-offset-4"
                >
                  Discover creators
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No posts yet — check back soon.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
