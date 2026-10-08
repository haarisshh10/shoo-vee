import { LoaderCircleIcon } from "lucide-react";

import { Button } from "#/components/ui/button.tsx";

/**
 * Shared chrome for the Studio pages.
 *
 * Every studio screen used to repeat the same bare heading, the same unstyled form and the same
 * one-line empty state. These primitives keep the four pages consistent with each other and with
 * the marketplace, without each one re-deciding its own layout.
 */

export function StudioPage({
  title,
  description,
  count,
  isPending,
  children,
}: {
  title: string;
  description: string;
  /** Optional count badge, e.g. how many items are already published. */
  count?: number;
  isPending?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {count !== undefined ? (
            <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground tabular-nums">
              {count} published
            </span>
          ) : null}
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </header>

      {isPending ? (
        <div className="flex justify-center py-12">
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/** A bordered panel used for composers and secondary blocks inside a Studio page. */
export function StudioPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex flex-col gap-5 rounded-2xl border bg-card p-5 ${className ?? ""}`}>
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/**
 * Empty state that teaches rather than apologising: what this list is for and what a good entry
 * looks like. New creators see this on every Studio page before they have added anything.
 */
export function StudioEmpty({
  title,
  children,
  hint,
}: {
  title: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{children}</p>
      {hint ? <p className="max-w-md text-xs text-muted-foreground/80">{hint}</p> : null}
    </div>
  );
}

/** Sticky submit row, so a long composer never strands the button below the fold. */
export function StudioSubmit({
  isPending,
  pendingLabel,
  children,
}: {
  isPending: boolean;
  pendingLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit" disabled={isPending}>
        {isPending && <LoaderCircleIcon className="animate-spin" aria-hidden="true" />}
        {isPending ? pendingLabel : children}
      </Button>
    </div>
  );
}
