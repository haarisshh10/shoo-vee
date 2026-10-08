import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";

import { buttonVariants } from "#/components/ui/button.tsx";

export type HeroTile = {
  src: string;
  alt: string;
  /** Grid placement: `tall` columns span two rows, `wide` columns span two columns. */
  span: "tall" | "wide" | "single";
};

/**
 * Landing hero. The collage is built from real posts in the database, so the first screen shows the
 * actual work on the platform instead of placeholder art.
 */
export function LandingHero({
  tiles,
  creatorCount,
  shotCount,
  gigCount,
  signedIn,
}: {
  tiles: HeroTile[];
  creatorCount: number;
  shotCount: number;
  gigCount: number;
  signedIn: boolean;
}) {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient light behind the headline, so the page reads as a stage rather than a document. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-[28rem] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]"
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 pt-16 pb-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pt-24">
        <div className="flex flex-col gap-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <SparklesIcon className="size-3.5" aria-hidden="true" />
            One account for hiring, showcasing and gig work
          </span>

          <h1 className="text-5xl leading-[0.95] font-semibold tracking-tighter sm:text-6xl lg:text-7xl">
            Create. <span className="text-muted-foreground">Capture.</span> Sell.
          </h1>

          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Sho-vee is where India&apos;s photographers, videographers, editors and drone pilots
            show their work, set their rates and get booked — while everyone else finds the right
            creative for the job.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/discover" className={buttonVariants({ size: "lg" })}>
              Discover creators
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
            {signedIn ? (
              <Link to="/app" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Go to my Sho-vee
              </Link>
            ) : (
              <Link to="/signup" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Join Sho-vee
              </Link>
            )}
          </div>

          <dl className="flex flex-wrap gap-x-10 gap-y-4 border-t pt-6">
            {[
              { label: "Creators", value: creatorCount },
              { label: "Shots shared", value: shotCount },
              { label: "Open gigs", value: gigCount },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-xs tracking-wider text-muted-foreground uppercase">
                  {stat.label}
                </dt>
                <dd className="text-2xl font-semibold tracking-tight">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <HeroCollage tiles={tiles} />
      </div>
    </section>
  );
}

/** Asymmetric collage: the grid reads as a wall of work rather than a product screenshot. */
function HeroCollage({ tiles }: { tiles: HeroTile[] }) {
  if (tiles.length === 0) {
    return <div className="grid aspect-square grid-cols-2 gap-3 rounded-3xl border bg-card/40" />;
  }

  return (
    <div className="grid grid-cols-4 grid-rows-5 gap-3 sm:gap-4">
      {tiles.map((tile, index) => (
        <div
          key={tile.src}
          className={
            tile.span === "tall" ? "row-span-2" : tile.span === "wide" ? "col-span-2" : "col-span-1"
          }
        >
          <img
            src={tile.src}
            alt={tile.alt}
            // The first two rows are above the fold, so they should not lazy-load.
            loading={index < 4 ? "eager" : "lazy"}
            className="size-full rounded-2xl border object-cover shadow-lg shadow-black/20"
          />
        </div>
      ))}
    </div>
  );
}
