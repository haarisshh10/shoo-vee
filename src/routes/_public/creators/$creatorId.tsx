import { useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { BookingForm } from "#/components/bookings/booking-form.tsx";
import { $getCreatorById } from "#/lib/creators/functions.ts";

export const Route = createFileRoute("/_public/creators/$creatorId")({
  component: CreatorPage,
});

const creatorQueryOptions = (creatorId: string) =>
  queryOptions({
    queryKey: ["creator", creatorId],
    queryFn: ({ signal }) => $getCreatorById({ data: { creatorId }, signal }),
  });

function CreatorPage() {
  const { creatorId } = Route.useParams();
  const { data, isPending, isError } = useQuery(creatorQueryOptions(creatorId));

  if (isPending) return <p className="p-10 text-sm text-muted-foreground">Loading...</p>;
  if (isError || !data)
    return <p className="p-10 text-sm text-muted-foreground">Creator not found.</p>;

  const { profile, portfolioItems, services, equipment, reviews } = data;
  const avg =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.review.rating, 0) / reviews.length
      : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-4">
        {profile.coverImageUrl && (
          <img src={profile.coverImageUrl} alt="" className="h-48 w-full rounded-xl object-cover" />
        )}
        <div className="flex items-center gap-4">
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
        </div>
        {profile.bio && <p className="text-sm">{profile.bio}</p>}
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
          <ul className="flex flex-col gap-2">
            {services.map((s) => (
              <li key={s.id} className="flex items-baseline justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
                <p className="text-sm font-medium">
                  {s.currency} {s.price.toLocaleString("en-IN")} / {s.pricingUnit}
                </p>
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

      <section>
        <h2 className="mb-3 text-lg font-semibold">Book / Contact</h2>
        <BookingForm creatorId={profile.id} services={services} />
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
