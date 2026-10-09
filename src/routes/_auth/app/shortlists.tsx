import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LoaderCircleIcon } from "lucide-react";

import { CreatorCard } from "#/components/creator/creator-card.tsx";
import { SaveCreatorButton } from "#/components/social/creator-social-buttons.tsx";
import { savedCreatorsQueryOptions } from "#/lib/social/queries.ts";

export const Route = createFileRoute("/_auth/app/shortlists")({
  component: ShortlistsPage,
});

function ShortlistsPage() {
  const { data, isPending, isError } = useQuery(savedCreatorsQueryOptions());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Shortlists</h1>
        <p className="text-sm text-muted-foreground">
          Creators you saved to hire later. Only you can see this list.
        </p>
      </div>

      {isPending ? (
        <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load your shortlist.</p>
      ) : data && data.length > 0 ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((creator) => (
            <li key={creator.id}>
              <CreatorCard
                creator={creator}
                action={<SaveCreatorButton creatorId={creator.id} />}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing saved yet. Use the bookmark on any creator to keep them here.
          </p>
          <Link to="/discover" className="mt-2 inline-block text-sm underline underline-offset-4">
            Browse creators
          </Link>
        </div>
      )}
    </div>
  );
}
