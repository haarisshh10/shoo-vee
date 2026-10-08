import { Link } from "@tanstack/react-router";
import { BriefcaseIcon, IndianRupeeIcon, MapPinIcon } from "lucide-react";

import { Badge } from "#/components/ui/badge.tsx";

/** Gig card used on the public gigs page, the landing page and the signed-in home. */
export function GigCard({
  gig,
  posterName,
}: {
  gig: {
    id: string;
    title: string;
    roleNeeded: string;
    location: string | null;
    pay: number | null;
    currency: string | null;
    date: Date | string | null;
    status: string;
  };
  posterName?: string | null;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border bg-card p-5 transition-colors hover:border-foreground/25">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight">
          <Link to="/gigs" className="hover:underline">
            {gig.title}
          </Link>
        </h3>
        {gig.status !== "open" ? <Badge variant="secondary">{gig.status}</Badge> : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <BriefcaseIcon className="size-4" aria-hidden="true" />
          {gig.roleNeeded}
        </span>
        {gig.location ? (
          <span className="flex items-center gap-1.5">
            <MapPinIcon className="size-4" aria-hidden="true" />
            {gig.location}
          </span>
        ) : null}
        {posterName ? <span>Posted by {posterName}</span> : null}
      </div>

      <div className="mt-auto flex items-end justify-between border-t pt-3">
        <p className="flex items-center gap-1 text-base font-semibold">
          {gig.pay !== null ? (
            <>
              <IndianRupeeIcon className="size-4" aria-hidden="true" />
              {gig.pay.toLocaleString("en-IN")}
              <span className="text-xs font-normal text-muted-foreground">
                {gig.currency ?? "INR"}
              </span>
            </>
          ) : (
            <span className="text-sm font-normal text-muted-foreground">Negotiable</span>
          )}
        </p>
        {gig.date ? (
          <p className="text-xs text-muted-foreground">
            {new Date(gig.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </p>
        ) : null}
      </div>
    </article>
  );
}
