import { Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";

/** Shared rhythm for every landing section: eyebrow, headline, optional link, then content. */
export function LandingSection({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { label: string; to: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto w-full max-w-6xl px-4 py-14 sm:py-20 ${className ?? ""}`}>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          {eyebrow ? (
            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
          ) : null}
        </div>
        {action ? (
          <Link
            to={action.to}
            className="flex shrink-0 items-center gap-1 text-sm font-medium hover:underline"
          >
            {action.label}
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
