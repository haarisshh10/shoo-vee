import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { CreatorCard } from "#/components/creator/creator-card.tsx";
import { buttonVariants } from "#/components/ui/button.tsx";
import { featuredCreatorsQueryOptions } from "#/lib/discovery/queries.ts";

export const Route = createFileRoute("/_public/creators/")({
  component: CreatorsIndexPage,
});

/**
 * Directory of every creator on the platform. `/discover` is the search-and-filter surface; this is
 * the browse surface that the public navigation links to.
 */
function CreatorsIndexPage() {
  const { data: creators, isPending, isError } = useQuery(featuredCreatorsQueryOptions(24));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Creators</h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Every creator with an active Sho-vee profile, ordered by verification and rating.
          </p>
        </div>
        <Link to="/discover" className={buttonVariants({ variant: "outline" })}>
          Search and filter
        </Link>
      </header>

      {isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-96 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load creators.</p>
      ) : creators && creators.length > 0 ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {creators.map((creator) => (
            <li key={creator.id}>
              <CreatorCard creator={creator} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No creator profiles yet. Be the first to publish one.
          </p>
          <Link to="/signup" className="mt-2 inline-block text-sm underline underline-offset-4">
            Join Sho-vee
          </Link>
        </div>
      )}
    </div>
  );
}
