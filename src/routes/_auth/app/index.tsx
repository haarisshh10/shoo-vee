import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ApertureIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  CompassIcon,
  SparklesIcon,
  UserRoundPlusIcon,
} from "lucide-react";

import { CreatorCard } from "#/components/creator/creator-card.tsx";
import { GigCard } from "#/components/gigs/gig-card.tsx";
import { ShotCard } from "#/components/shots/shot-card.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { buttonVariants } from "#/components/ui/button.tsx";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";
import { myCreatorProfileQueryOptions } from "#/lib/creators/queries.ts";
import { featuredCreatorsQueryOptions } from "#/lib/discovery/queries.ts";
import { gigsQueryOptions } from "#/lib/gigs/queries.ts";
import { myInterestsQueryOptions } from "#/lib/onboarding/queries.ts";
import { feedQueryOptions } from "#/lib/posts/queries.ts";
import { cn } from "#/lib/utils.ts";

export const Route = createFileRoute("/_auth/app/")({
  component: MarketplaceHome,
});

const QUICK_ACTIONS = [
  {
    to: "/discover",
    label: "Find a creator",
    description: "Search by craft, city and rate",
    icon: CompassIcon,
  },
  {
    to: "/shots",
    label: "Browse work",
    description: "See what creators are shooting",
    icon: ApertureIcon,
  },
  {
    to: "/gigs",
    label: "Find a gig",
    description: "Short-term crew work near you",
    icon: BriefcaseIcon,
  },
] as const;

/**
 * Signed-in home. Everyone lands here after signup — buyers and creators alike — so a new account
 * opens on the marketplace instead of an empty dashboard.
 */
function MarketplaceHome() {
  const { user } = useAuthSuspense();
  const creators = useQuery(featuredCreatorsQueryOptions(4));
  const feed = useQuery(feedQueryOptions());
  const gigs = useQuery(gigsQueryOptions());
  const interests = useQuery(myInterestsQueryOptions());
  const profile = useQuery(myCreatorProfileQueryOptions());

  const firstName = user?.name?.split(" ")[0];
  const hasProfile = !!profile.data;
  const shots = (feed.data ?? []).slice(0, 4);
  const openGigs = (gigs.data ?? []).slice(0, 2);

  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Your Sho-vee
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {firstName ? `Welcome back, ${firstName}` : "Welcome to Sho-vee"}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Hire creators for your next shoot, keep an eye on your bookings, or pick up gig work.
            Activate a creator profile whenever you want the other side of the marketplace too.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <li key={action.to}>
              <Link
                to={action.to}
                className="group flex h-full flex-col gap-2 rounded-2xl border bg-card p-5 transition-colors hover:border-foreground/25"
              >
                <span className="grid size-10 place-items-center rounded-xl border">
                  <action.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="flex items-center gap-1 text-base font-semibold tracking-tight">
                  {action.label}
                  <ArrowRightIcon
                    className="size-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </span>
                <span className="text-sm text-muted-foreground">{action.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </header>

      {!hasProfile ? (
        <section
          className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 ${
            interests.data?.showcaseWork ? "ring-1 ring-foreground/20" : ""
          }`}
        >
          {interests.data?.showcaseWork ? (
            <Badge className="mb-3 gap-1.5">
              <SparklesIcon className="size-3.5" aria-hidden="true" />
              You picked “Showcase my work”
            </Badge>
          ) : null}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                <UserRoundPlusIcon className="size-5" aria-hidden="true" />
                Create your creator profile
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Publish a portfolio, list your services and gear, and get discovered by customers
                booking through Sho-vee. Same account, no separate creator login.
              </p>
            </div>
            <Link
              to="/app/profile/creator"
              className={cn(buttonVariants({ size: "lg" }), "shrink-0")}
            >
              Create your creator profile
            </Link>
          </div>
        </section>
      ) : null}

      <HomeSection
        title="Recommended creators"
        description="Verified profiles with published rates."
        action={{ label: "See all", to: "/discover" }}
        isPending={creators.isPending}
        isEmpty={(creators.data ?? []).length === 0}
        emptyMessage="No creator profiles yet."
      >
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(creators.data ?? []).map((creator) => (
            <li key={creator.id}>
              <CreatorCard creator={creator} />
            </li>
          ))}
        </ul>
      </HomeSection>

      <HomeSection
        title="Fresh shots"
        description="The latest work posted by the community."
        action={{ label: "See all", to: "/shots" }}
        isPending={feed.isPending}
        isEmpty={(feed.data ?? []).length === 0}
        emptyMessage="No shots posted yet."
      >
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {shots.map((shot) => (
            <li key={shot.post.id}>
              <ShotCard post={shot.post} creator={shot.creator} className="aspect-square" />
            </li>
          ))}
        </ul>
      </HomeSection>

      <HomeSection
        title="Gigs worth a look"
        description="Short-term work posted by creators and studios."
        action={{ label: "See all", to: "/gigs" }}
        isPending={gigs.isPending}
        isEmpty={(gigs.data ?? []).length === 0}
        emptyMessage="No open gigs right now."
      >
        <ul className="grid gap-4 sm:grid-cols-2">
          {openGigs.map((gig) => (
            <li key={gig.gig.id}>
              <GigCard gig={gig.gig} posterName={gig.poster.name} />
            </li>
          ))}
        </ul>
      </HomeSection>

      <section className="flex flex-col gap-3 rounded-2xl border bg-card p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">Your bookings and applications</h2>
          <p className="text-sm text-muted-foreground">
            Requests you sent, requests sent to you, and gigs you applied to.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/app/bookings" className={buttonVariants({ variant: "outline" })}>
            Bookings
          </Link>
          <Link to="/app/gigs" className={buttonVariants({ variant: "outline" })}>
            My gigs &amp; applications
          </Link>
          {hasProfile ? (
            <Link to="/app/studio" className={buttonVariants({ variant: "outline" })}>
              Open Studio
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function HomeSection({
  title,
  description,
  action,
  isPending,
  isEmpty,
  emptyMessage,
  children,
}: {
  title: string;
  description: string;
  action: { label: string; to: string };
  isPending: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Link to={action.to} className="shrink-0 text-sm text-muted-foreground hover:underline">
          {action.label}
        </Link>
      </div>
      {isPending ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : isEmpty ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        children
      )}
    </section>
  );
}
