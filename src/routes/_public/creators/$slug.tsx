import { useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { BookingForm } from "#/components/bookings/booking-form.tsx";
import { ReportButton } from "#/components/reports/report-button.tsx";
import { CreatorSocialActions } from "#/components/social/creator-social-buttons.tsx";
import { AVAILABILITY_COPY } from "#/lib/bookings/transitions.ts";
import { $getCreatorBySlug } from "#/lib/creators/functions.ts";

export const Route = createFileRoute("/_public/creators/$slug")({
  component: CreatorPage,
});

const creatorQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["creator", slug],
    queryFn: ({ signal }) => $getCreatorBySlug({ data: { slug }, signal }),
  });

function CreatorPage() {
  const { slug } = Route.useParams();
  const { data, isPending, isError } = useQuery(creatorQueryOptions(slug));
  // Set when a service is chosen from the list, so the booking form opens on it.
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();

  if (isPending) return <p className="p-10 text-sm text-muted-foreground">Loading...</p>;
  if (isError || !data)
    return <p className="p-10 text-sm text-muted-foreground">Creator not found.</p>;

  const { profile, portfolioItems, services, equipment, reviews } = data;
  const avg =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.review.rating, 0) / reviews.length
      : null;
  const availability = AVAILABILITY_COPY[profile.availabilityStatus];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-4">
        {profile.coverImageUrl && (
          <img src={profile.coverImageUrl} alt="" className="h-48 w-full rounded-xl object-cover" />
        )}
        <div className="flex flex-wrap items-center gap-4">
          {profile.profileImageUrl ? (
            <img
              src={profile.profileImageUrl}
              alt={profile.displayName}
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <div className="size-16 rounded-full bg-muted" />
          )}
          <div>
            <h1 className="text-2xl font-semibold">{profile.displayName}</h1>
            <p className="text-sm text-muted-foreground">
              {profile.creatorTypes.map((t) => t.replaceAll("_", " ")).join(", ")}
              {profile.location ? ` · ${profile.location}` : ""}
            </p>
            <p className="text-sm">
              {avg !== null ? `★ ${avg.toFixed(1)} (${reviews.length})` : "No reviews yet"}
              {profile.startingPrice !== null &&
                ` · From ${profile.currency} ${profile.startingPrice.toLocaleString("en-IN")}`}
            </p>
          </div>
          <div className="ms-auto flex flex-wrap items-center gap-2">
            <AvailabilityBadge status={profile.availabilityStatus} />
            <CreatorSocialActions creatorId={profile.id} />
            <ReportButton targetType="creator_profile" targetId={profile.id} />
          </div>
        </div>
        {profile.bio && <p className="text-sm">{profile.bio}</p>}
        {profile.availabilityStatus !== "available" ? (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            {availability.hint}. Booking requests are closed while{" "}
            {availability.label.toLowerCase()}.
          </p>
        ) : null}
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Portfolio</h2>
        {portfolioItems.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {portfolioItems.map((item) => (
              <li key={item.id}>
                {item.mediaType === "image" ? (
                  <img
                    src={item.mediaUrl}
                    alt={item.title}
                    className="aspect-square w-full rounded-md object-cover"
                  />
                ) : (
                  <video
                    src={item.mediaUrl}
                    className="aspect-square w-full rounded-md object-cover"
                    controls
                    muted
                  >
                    <track kind="captions" label="No captions available" />
                  </video>
                )}
                <p className="mt-1 text-xs text-muted-foreground">{item.title}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No portfolio items yet.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Services</h2>
        {services.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {services.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedServiceId(s.id);
                    document
                      .getElementById("book")
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="flex h-full w-full flex-col gap-2 rounded-xl border p-4 text-left transition-colors hover:border-foreground/30"
                >
                  <p className="text-sm font-medium">{s.title}</p>
                  {s.description ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
                  ) : null}
                  <p className="mt-auto text-sm font-semibold">
                    {s.currency} {s.price.toLocaleString("en-IN")}
                    <span className="text-xs font-normal text-muted-foreground">
                      {" "}
                      / {s.pricingUnit}
                    </span>
                  </p>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No services listed.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Equipment</h2>
        {equipment.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {equipment.map(({ equipment: e }) => (
              <li key={e.id} className="rounded-full border px-3 py-1 text-sm">
                {e.brand ? `${e.brand} ` : ""}
                {e.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No equipment listed.</p>
        )}
      </section>

      <section id="book">
        <h2 className="mb-3 text-lg font-semibold">Request a booking</h2>
        <BookingForm
          creatorId={profile.id}
          services={services}
          initialServiceId={selectedServiceId}
          disabledReason={
            profile.availabilityStatus === "available"
              ? undefined
              : `${profile.displayName} is not taking new bookings right now. Come back later or find another creator in Discover.`
          }
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">About</h2>
        <p className="text-sm text-muted-foreground">
          {profile.experienceYears !== null
            ? `${profile.experienceYears} years of experience · `
            : ""}
          {profile.languages.length > 0 ? profile.languages.join(", ") : ""}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Reviews</h2>
        {reviews.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {reviews.map((r) => (
              <li key={r.review.id} className="rounded-md border p-3">
                <p className="text-sm font-medium">
                  ★ {r.review.rating} · {r.reviewerName}
                </p>
                {r.review.comment && (
                  <p className="mt-1 text-sm text-muted-foreground">{r.review.comment}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        )}
      </section>
    </div>
  );
}

/** Public availability, so a customer knows before they fill in a booking form. */
function AvailabilityBadge({
  status,
  className,
}: {
  status: keyof typeof AVAILABILITY_COPY;
  className?: string;
}) {
  const copy = AVAILABILITY_COPY[status];
  const tone =
    status === "available"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : status === "busy"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-border bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${tone} ${className ?? ""}`}
    >
      <span
        className="size-1.5 rounded-full bg-current"
        // The colour already encodes the state; this is for anyone who cannot see it.
        role="img"
        aria-label={copy.hint}
      />
      {copy.label}
    </span>
  );
}
