import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "#/components/ui/button.tsx";
import { myApplicationsQueryOptions, myGigsQueryOptions } from "#/lib/gigs/queries.ts";

export const Route = createFileRoute("/_auth/app/gigs/")({
  component: MyGigsPage,
});

function MyGigsPage() {
  const gigs = useQuery(myGigsQueryOptions());
  const applications = useQuery(myApplicationsQueryOptions());

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">My gigs</h1>
        <p className="text-sm text-muted-foreground">Gigs you posted and your applications.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Posted by me</h2>
        {gigs.data && gigs.data.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {gigs.data.map((g) => (
              <li key={g.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{g.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.roleNeeded} · {g.status}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link to="/app/gigs/$gigId" params={{ gigId: g.id }} />}
                  nativeButton={false}
                >
                  Manage
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">You have not posted any gigs.</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">My applications</h2>
        {applications.data && applications.data.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {applications.data.map(({ application: a, gig: g }) => (
              <li key={a.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{g.title}</p>
                  <p className="text-xs text-muted-foreground">{a.status}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">You have not applied to any gigs.</p>
        )}
      </section>
    </div>
  );
}
