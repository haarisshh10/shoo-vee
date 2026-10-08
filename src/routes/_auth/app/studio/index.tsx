import { useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheckIcon, PlusIcon } from "lucide-react";

import { buttonVariants } from "#/components/ui/button.tsx";
import { $getDashboardSummary } from "#/lib/dashboard/functions.ts";

export const Route = createFileRoute("/_auth/app/studio/")({
  component: StudioOverview,
});

const studioSummaryQueryOptions = () =>
  queryOptions({
    queryKey: ["studio", "summary"],
    queryFn: ({ signal }) => $getDashboardSummary({ signal }),
  });

/** Studio overview: what is happening on the creator side, in one screen. */
function StudioOverview() {
  const { data, isPending } = useQuery(studioSummaryQueryOptions());

  if (isPending || !data) {
    return <p className="text-sm text-muted-foreground">Loading your studio...</p>;
  }

  if (!data.hasProfile) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-dashed p-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create your creator profile</h1>
        <p className="text-sm text-muted-foreground">
          Studio needs a creator profile. It takes a minute, and your marketplace account stays
          exactly as it is.
        </p>
        <Link to="/app/profile/creator" className={buttonVariants()}>
          Create your creator profile
        </Link>
      </div>
    );
  }

  const stats = [
    { label: "Pending requests", value: data.incomingPending, to: "/app/bookings" },
    { label: "Portfolio items", value: data.portfolioCount, to: "/app/portfolio" },
    { label: "Services", value: data.serviceCount, to: "/app/services" },
    { label: "Posts", value: data.postCount, to: "/app/posts" },
    { label: "Equipment", value: data.equipmentCount, to: "/app/equipment" },
    { label: "My applications", value: data.applicationsCount, to: "/app/gigs" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{data.profile.displayName}</h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {data.profile.location ?? "Location not set"}
            {data.profile.verificationStatus === "verified" ? (
              <BadgeCheckIcon className="size-4 text-emerald-400" aria-label="Verified" />
            ) : (
              <span className="rounded-full border px-2 py-0.5 text-xs">
                {data.profile.verificationStatus}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/creators/$creatorId"
            params={{ creatorId: data.profile.id }}
            className={buttonVariants({ variant: "outline" })}
          >
            View public profile
          </Link>
          <Link to="/app/posts" className={buttonVariants()}>
            <PlusIcon aria-hidden="true" />
            Post a shot
          </Link>
        </div>
      </header>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link
              to={stat.to}
              className="flex flex-col gap-1 rounded-2xl border bg-card p-4 transition-colors hover:border-foreground/25"
            >
              <span className="text-2xl font-semibold tracking-tight tabular-nums">
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recent booking requests</h2>
          <Link to="/app/bookings" className="text-sm text-muted-foreground hover:underline">
            See all
          </Link>
        </div>
        {data.recentIncoming.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {data.recentIncoming.map((booking) => (
              <li
                key={booking.id}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 text-sm"
              >
                <span className="line-clamp-1 text-muted-foreground">
                  {booking.message ?? "Custom request"}
                </span>
                <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                  {booking.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No booking requests yet. Publishing a portfolio is the fastest way to get discovered.
          </p>
        )}
      </section>
    </div>
  );
}
