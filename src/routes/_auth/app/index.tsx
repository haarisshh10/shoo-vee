import { useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "#/components/ui/button.tsx";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";
import { $getDashboardSummary } from "#/lib/dashboard/functions.ts";

export const Route = createFileRoute("/_auth/app/")({
  component: AppIndex,
});

const dashboardQueryOptions = () =>
  queryOptions({
    queryKey: ["dashboard"],
    queryFn: ({ signal }) => $getDashboardSummary({ signal }),
  });

function AppIndex() {
  const { user } = useAuthSuspense();
  const { data, isPending } = useQuery(dashboardQueryOptions());

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading overview...</p>;
  }

  if (!data?.hasProfile) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Welcome to Sho-vee, {user?.name}</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Set up your creator profile to appear in discovery, list services and equipment, and start
          receiving bookings.
        </p>
        <Button render={<Link to="/app/profile/creator" />} nativeButton={false}>
          Create creator profile
        </Button>
      </div>
    );
  }

  const stats = [
    { label: "Portfolio items", value: data.portfolioCount, to: "/app/portfolio" },
    { label: "Services", value: data.serviceCount, to: "/app/services" },
    { label: "Equipment", value: data.equipmentCount, to: "/app/equipment" },
    { label: "Posts", value: data.postCount, to: "/app/posts" },
    { label: "Pending requests", value: data.incomingPending, to: "/app/bookings" },
    { label: "My applications", value: data.applicationsCount, to: "/app/gigs" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Hello, {data.profile.displayName}</h1>
        <p className="text-sm text-muted-foreground">
          Verification status: {data.profile.verificationStatus}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Recent booking requests</h2>
        {data.recentIncoming.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {data.recentIncoming.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <span className="line-clamp-1 text-muted-foreground">
                  {b.message ?? "Custom request"}
                </span>
                <span className="text-xs text-muted-foreground">{b.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No booking requests yet.</p>
        )}
      </section>
    </div>
  );
}
