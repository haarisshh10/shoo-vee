import { BadgeCheckIcon, MapPinIcon, StarIcon } from "lucide-react";

import { Badge } from "#/components/ui/badge.tsx";
import { cn } from "#/lib/utils.ts";

export type ProfilePreview = {
  displayName: string;
  bio: string;
  location: string;
  experienceYears: string;
  specialties: string[];
  languages: string[];
  creatorTypes: string[];
  startingPrice: string;
  currency: string;
  availability: string;
  profileImageUrl: string;
  coverImageUrl: string;
};

/**
 * Live preview of a creator profile in the shape customers see on the public page.
 *
 * Editing a profile blind is demotivating: this makes the payoff of each field visible while it is
 * being typed, and doubles as the activation page's "here is what you are signing up for" moment.
 */
export function CreatorProfilePreview({
  preview,
  verificationStatus,
  isNew,
}: {
  preview: ProfilePreview;
  verificationStatus?: string | null;
  isNew: boolean;
}) {
  const hasName = preview.displayName.trim().length > 0;
  const price =
    preview.startingPrice.trim() === ""
      ? null
      : `${preview.currency || "INR"} ${Number(preview.startingPrice).toLocaleString("en-IN")}+`;
  const availabilityTone: Record<string, string> = {
    available: "text-emerald-400",
    busy: "text-amber-400",
    unavailable: "text-muted-foreground",
  };

  return (
    <aside className="lg:sticky lg:top-24">
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Preview</h2>
        <p className="text-xs text-muted-foreground">
          {isNew
            ? "This is how your profile will appear in Discover."
            : "This is how your profile appears in Discover."}
        </p>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border bg-card">
        <div className="relative h-32 bg-gradient-to-br from-muted to-muted/40">
          {preview.coverImageUrl ? (
            <img
              src={preview.coverImageUrl}
              alt=""
              className="size-full object-cover"
              // A pasted URL may 404 or be an enormous file; this is only a preview.
              loading="lazy"
            />
          ) : null}
        </div>

        <div className="-mt-8 flex flex-col gap-3 p-4">
          <div className="flex items-end gap-3">
            {preview.profileImageUrl ? (
              <img
                src={preview.profileImageUrl}
                alt=""
                className="size-16 rounded-full border-2 border-card object-cover"
                loading="lazy"
              />
            ) : (
              <span className="grid size-16 place-items-center rounded-full border-2 border-card bg-muted text-lg font-semibold text-muted-foreground">
                {(preview.displayName.trim()[0] ?? "?").toUpperCase()}
              </span>
            )}

            <div className="flex min-w-0 flex-col gap-0.5 pb-1">
              <p
                className={cn(
                  "truncate text-lg font-semibold tracking-tight",
                  !hasName && "text-muted-foreground italic",
                )}
              >
                {hasName ? preview.displayName : "Your name here"}
              </p>
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPinIcon className="size-3 shrink-0" aria-hidden="true" />
                {preview.location || "Location not set"}
              </p>
            </div>

            {verificationStatus === "verified" ? (
              <Badge className="ms-auto mb-1.5 gap-1">
                <BadgeCheckIcon className="size-3" aria-hidden="true" />
                Verified
              </Badge>
            ) : null}
          </div>

          {preview.bio ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">{preview.bio}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Add a bio so customers know what you shoot.
            </p>
          )}

          {preview.creatorTypes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {preview.creatorTypes.slice(0, 4).map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="rounded-full font-normal capitalize"
                >
                  {type.replaceAll("_", " ")}
                </Badge>
              ))}
            </div>
          ) : null}

          <dl className="grid gap-1.5 border-t pt-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Starting at</dt>
              <dd className="font-medium">{price ?? "Set a price"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Experience</dt>
              <dd className="font-medium">
                {preview.experienceYears ? `${preview.experienceYears} yrs` : "Not set"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Availability</dt>
              <dd className={cn("font-medium capitalize", availabilityTone[preview.availability])}>
                {preview.availability}
              </dd>
            </div>
            {preview.languages.length > 0 ? (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Languages</dt>
                <dd className="line-clamp-1 font-medium">{preview.languages.join(", ")}</dd>
              </div>
            ) : null}
            {preview.specialties.length > 0 ? (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Specialties</dt>
                <dd className="line-clamp-1 font-medium">{preview.specialties.join(", ")}</dd>
              </div>
            ) : null}
          </dl>

          <p className="flex items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
            <StarIcon className="size-3.5" aria-hidden="true" />
            Reviews appear here once a booking is completed.
          </p>
        </div>
      </div>
    </aside>
  );
}
