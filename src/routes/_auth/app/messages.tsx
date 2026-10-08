import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquareIcon } from "lucide-react";

import { buttonVariants } from "#/components/ui/button.tsx";

export const Route = createFileRoute("/_auth/app/messages")({
  component: MessagesPage,
});

/**
 * Messages is not built yet. The entry point exists so the marketplace navigation is honest about
 * where the feature will live instead of omitting it.
 */
function MessagesPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-dashed p-12 text-center">
      <span className="grid size-12 place-items-center rounded-2xl border bg-card">
        <MessageSquareIcon className="size-6" aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Messages are not here yet</h1>
      <p className="text-sm text-muted-foreground">
        Direct messaging between customers and creators is on the roadmap. Until then, booking
        requests and gig applications are the way to get in touch.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/app/bookings" className={buttonVariants()}>
          Go to bookings
        </Link>
        <Link to="/gigs" className={buttonVariants({ variant: "outline" })}>
          Browse gigs
        </Link>
      </div>
    </div>
  );
}
