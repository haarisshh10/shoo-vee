import { Link } from "@tanstack/react-router";
import {
  CameraIcon,
  CompassIcon,
  HandshakeIcon,
  SparklesIcon,
  StoreIcon,
  UserRoundIcon,
  VideoIcon,
} from "lucide-react";

import { buttonVariants } from "#/components/ui/button.tsx";

const STEPS = [
  {
    icon: CompassIcon,
    title: "Discover creators",
    body: "Filter by craft, city, gear and rate. Every profile shows real work and real reviews.",
  },
  {
    icon: HandshakeIcon,
    title: "Book or hire",
    body: "Send a request with your dates and budget. Creators accept, decline or counter.",
  },
  {
    icon: CameraIcon,
    title: "Showcase your work",
    body: "Activate a creator profile whenever you are ready — one account covers both sides.",
  },
  {
    icon: VideoIcon,
    title: "Pick up gigs",
    body: "Browse short-term crew work near you and apply with a single tap.",
  },
];

const HIGHLIGHTS = [
  {
    icon: StoreIcon,
    title: "A real marketplace",
    body: "Services, starting prices and availability are published on every creator profile.",
  },
  {
    icon: VideoIcon,
    title: "Work in every format",
    body: "Photos, films, edits, drone passes, product and event coverage.",
  },
  {
    icon: UserRoundIcon,
    title: "One account, no silos",
    body: "Hire, showcase and apply to gigs without managing separate accounts.",
  },
  {
    icon: SparklesIcon,
    title: "Verified community",
    body: "Moderators verify creators and keep the marketplace clean.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y bg-card/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
        <div className="mb-10 flex flex-col gap-3">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            How Sho-vee works
          </p>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            From browsing to booked, without the back-and-forth.
          </h2>
        </div>

        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl border bg-background">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-base font-semibold tracking-tight">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>

        <ul className="mt-12 grid gap-6 border-t pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((item) => (
            <li key={item.title} className="flex flex-col gap-2">
              <item.icon className="size-5 text-muted-foreground" aria-hidden="true" />
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function JoinCta({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24">
      <div className="relative overflow-hidden rounded-3xl border bg-card px-6 py-14 text-center sm:px-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_100%_at_50%_0%,color-mix(in_oklch,var(--primary)_20%,transparent),transparent)]"
        />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {signedIn ? "Your creator profile is one step away" : "Join the marketplace"}
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            {signedIn
              ? "Activate a creator profile to publish your portfolio, list services and start taking bookings."
              : "Create one free account to hire creators, showcase your work or find gig work. Pick what you need — change it whenever you like."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {signedIn ? (
              <Link to="/app/profile/creator" className={buttonVariants({ size: "lg" })}>
                Create your creator profile
              </Link>
            ) : (
              <>
                <Link to="/signup" className={buttonVariants({ size: "lg" })}>
                  Join Sho-vee
                </Link>
                <Link to="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
