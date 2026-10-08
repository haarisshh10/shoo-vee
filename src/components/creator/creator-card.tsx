import { Link } from "@tanstack/react-router";
import { BadgeCheckIcon, MapPinIcon, StarIcon } from "lucide-react";

import { Badge } from "#/components/ui/badge.tsx";

function formatPrice(value: number | null, currency: string | null) {
  if (value === null) return "Price on request";
  return `${currency ?? "INR"} ${value.toLocaleString("en-IN")}+`;
}

/**
 * The one creator card used by discovery, the landing page and the signed-in home, so a creator
 * looks identical everywhere they appear.
 */
export function CreatorCard({
  creator,
}: {
  creator: {
    id: string;
    displayName: string;
    location: string | null;
    creatorTypes: string[];
    specialties: string[];
    verificationStatus: string;
    startingPrice: number | null;
    currency: string | null;
    avgRating: number | null;
    reviewCount: number;
    previewImage: string | null;
    previewImages?: string[];
  };
}) {
  const strip = (creator.previewImages ?? [])
    .filter((src) => src !== creator.previewImage)
    .slice(0, 2);

  return (
    <Link
      to="/creators/$creatorId"
      params={{ creatorId: creator.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:border-foreground/25 hover:shadow-xl hover:shadow-black/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {creator.previewImage ? (
          <img
            src={creator.previewImage}
            alt={`Work by ${creator.displayName}`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-muted to-muted/40" />
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">
          {creator.verificationStatus === "verified" ? (
            <Badge className="gap-1 border-white/20 bg-black/50 text-white backdrop-blur-sm">
              <BadgeCheckIcon className="size-3.5" aria-hidden="true" />
              Verified
            </Badge>
          ) : null}
        </div>

        {creator.avgRating !== null ? (
          <span className="absolute end-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <StarIcon className="size-3 fill-amber-400 text-amber-400" aria-hidden="true" />
            {creator.avgRating.toFixed(1)}
            <span className="text-white/70">({creator.reviewCount})</span>
          </span>
        ) : null}

        <div className="absolute inset-x-3 bottom-3">
          <p className="truncate text-lg font-semibold tracking-tight text-white">
            {creator.displayName}
          </p>
          <p className="flex items-center gap-1 truncate text-xs text-white/75">
            <MapPinIcon className="size-3 shrink-0" aria-hidden="true" />
            {creator.location ?? "Location not set"}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {creator.creatorTypes.slice(0, 3).map((type) => (
            <Badge key={type} variant="secondary" className="rounded-full font-normal capitalize">
              {type.replaceAll("_", " ")}
            </Badge>
          ))}
        </div>

        {creator.specialties.length > 0 ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {creator.specialties.join(" · ")}
          </p>
        ) : null}

        {strip.length > 0 ? (
          <div className="flex gap-1.5">
            {strip.map((src) => (
              <img
                key={src}
                src={src}
                alt=""
                loading="lazy"
                className="h-12 w-16 rounded-md object-cover opacity-80"
              />
            ))}
          </div>
        ) : null}

        <p className="mt-auto border-t pt-3 text-sm">
          <span className="font-semibold">
            {formatPrice(creator.startingPrice, creator.currency)}
          </span>
          <span className="text-xs text-muted-foreground"> starting</span>
        </p>
      </div>
    </Link>
  );
}
