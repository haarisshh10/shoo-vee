import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";

import { CreatorCard } from "#/components/creator/creator-card.tsx";
import { GigCard } from "#/components/gigs/gig-card.tsx";
import { HowItWorks, JoinCta } from "#/components/landing/how-it-works.tsx";
import { LandingHero, type HeroTile } from "#/components/landing/landing-hero.tsx";
import { LandingSection } from "#/components/landing/landing-section.tsx";
import { ShotCard } from "#/components/shots/shot-card.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { useAuth } from "#/lib/auth/hooks.ts";
import {
  featuredCreatorsQueryOptions,
  popularCategoriesQueryOptions,
} from "#/lib/discovery/queries.ts";
import { gigsQueryOptions } from "#/lib/gigs/queries.ts";
import { feedQueryOptions } from "#/lib/posts/queries.ts";

export const Route = createFileRoute("/_public/")({
  component: LandingPage,
});

/** Mixed spans keep the collage from settling into a regular checkerboard. */
const SPANS: HeroTile["span"][] = ["tall", "single", "wide", "single", "tall", "single"];

function LandingPage() {
  const { user } = useAuth();
  const feed = useQuery(feedQueryOptions());
  // A wide limit so the headline counts reflect the whole platform, not just the featured four.
  const creators = useQuery(featuredCreatorsQueryOptions(24));
  const categories = useQuery(popularCategoriesQueryOptions());
  const gigs = useQuery(gigsQueryOptions());

  const shots = (feed.data ?? []).slice(0, 12);
  const featured = (creators.data ?? []).slice(0, 4);
  const openGigs = (gigs.data ?? []).slice(0, 4);
  const topCategories = (categories.data ?? []).filter((c) => c.creators > 0).slice(0, 8);

  // The hero reuses the feed, so an empty database still renders a coherent page.
  const tiles: HeroTile[] = shots.slice(0, 6).map((shot, index) => ({
    src: shot.post.mediaUrl,
    alt: shot.post.caption ?? `Shot by ${shot.creator.displayName}`,
    span: SPANS[index % SPANS.length],
  }));

  return (
    <div>
      <LandingHero
        tiles={tiles}
        creatorCount={creators.data?.length ?? 0}
        shotCount={feed.data?.length ?? 0}
        gigCount={gigs.data?.length ?? 0}
        signedIn={!!user}
      />

      {featured.length > 0 ? (
        <LandingSection
          eyebrow="Featured creators"
          title="Crews people keep booking"
          description="Verified creators with published rates, real portfolios and reviews from past work."
          action={{ label: "Browse all creators", to: "/discover" }}
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        </LandingSection>
      ) : null}

      {shots.length > 0 ? (
        <LandingSection
          eyebrow="Trending shots"
          title="Fresh from the community"
          description="Work posted by creators on Sho-vee this week."
          action={{ label: "See every shot", to: "/shots" }}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {shots.slice(0, 8).map((shot) => (
              <ShotCard
                key={shot.post.id}
                post={shot.post}
                creator={shot.creator}
                className="aspect-square"
              />
            ))}
          </div>
        </LandingSection>
      ) : null}

      {topCategories.length > 0 ? (
        <LandingSection
          eyebrow="Popular categories"
          title="Find a specialist"
          description="Browse the marketplace by the craft you need."
        >
          <ul className="flex flex-wrap gap-3">
            {topCategories.map((category) => (
              <li key={category.slug}>
                <Link
                  to="/discover"
                  search={{ types: category.slug }}
                  className="flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm transition-colors hover:border-foreground/30"
                >
                  <span className="font-medium capitalize">{category.label}</span>
                  <Badge variant="secondary" className="rounded-full">
                    {category.creators}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </LandingSection>
      ) : null}

      {openGigs.length > 0 ? (
        <LandingSection
          eyebrow="Creator gigs"
          title="Short-term crew work, posted now"
          description="Gigs are the fastest way into a network: one shoot, one edit, one delivery."
          action={{ label: "Browse all gigs", to: "/gigs" }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {openGigs.map((gig) => (
              <GigCard key={gig.gig.id} gig={gig.gig} posterName={gig.poster.name} />
            ))}
          </div>
        </LandingSection>
      ) : null}

      <HowItWorks />

      <LandingSection
        eyebrow="Creator stories"
        title="Ready when you are"
        description="Anyone can hire on Sho-vee. Activating a creator profile is a single step and never a separate account."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Hire creators",
              body: "Search by craft and city, compare rates and send a booking request in a couple of clicks.",
              to: "/discover",
              cta: "Start searching",
            },
            {
              title: "Showcase your work",
              body: "Publish a portfolio, list your services and equipment, and let customers find you.",
              to: user ? "/app/profile/creator" : "/signup",
              cta: user ? "Create a profile" : "Join as a creator",
            },
            {
              title: "Find gig work",
              body: "Apply to short-term crew work posted by studios and other creators near you.",
              to: "/gigs",
              cta: "See open gigs",
            },
          ].map((item) => (
            <Link
              key={item.title}
              to={item.to}
              className="group flex flex-col gap-2 rounded-2xl border bg-card p-6 transition-colors hover:border-foreground/25"
            >
              <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.body}</p>
              <span className="mt-4 flex items-center gap-1 text-sm font-medium">
                {item.cta}
                <ArrowRightIcon
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>
      </LandingSection>

      <JoinCta signedIn={!!user} />
    </div>
  );
}
