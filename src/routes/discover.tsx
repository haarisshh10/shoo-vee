import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import type { CreatorSearch } from "#/lib/discovery/functions.ts";
import { searchCreatorsQueryOptions } from "#/lib/discovery/queries.ts";

export const Route = createFileRoute("/discover")({
  component: DiscoverPage,
});

const CREATOR_TYPES = [
  "photographer",
  "videographer",
  "editor",
  "drone_operator",
  "product_creator",
  "wedding_creator",
  "event_creator",
  "content_creator",
] as const;

function DiscoverPage() {
  const [filters, setFilters] = useState<CreatorSearch>({
    query: "",
    location: "",
    creatorTypes: [],
    equipment: "",
    verifiedOnly: false,
    sort: "recommended",
  });

  const { data: creators, isPending, isError } = useQuery(searchCreatorsQueryOptions(filters));

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const str = (key: string) => {
      const v = formData.get(key);
      return typeof v === "string" ? v : "";
    };
    const types = formData.getAll("creatorTypes").filter((v): v is string => typeof v === "string");

    setFilters({
      query: str("query"),
      location: str("location"),
      creatorTypes: types,
      equipment: str("equipment"),
      maxPrice: str("maxPrice") !== "" ? Number(str("maxPrice")) : undefined,
      verifiedOnly: formData.get("verifiedOnly") === "on",
      sort: str("sort") as CreatorSearch["sort"],
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Discover creators</h1>
        <p className="text-sm text-muted-foreground">
          Find photographers, videographers, editors and more.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border p-4">
        <div className="grid gap-2">
          <Label htmlFor="query">Search</Label>
          <Input id="query" name="query" placeholder="Name, specialty, bio..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="Mumbai" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="equipment">Equipment</Label>
            <Input id="equipment" name="equipment" placeholder="Sony FX3" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="maxPrice">Max starting price</Label>
            <Input id="maxPrice" name="maxPrice" type="number" min={0} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sort">Sort</Label>
            <select
              id="sort"
              name="sort"
              defaultValue="recommended"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="recommended">Recommended</option>
              <option value="rating">Rating</option>
              <option value="price_low">Price: low to high</option>
              <option value="price_high">Price: high to low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Creator types</legend>
          <div className="flex flex-wrap gap-3">
            {CREATOR_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="creatorTypes" value={t} className="size-4" />
                {t.replaceAll("_", " ")}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="verifiedOnly" className="size-4" />
          Verified only
        </label>
        <Button type="submit" className="w-fit">
          Search
        </Button>
      </form>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading creators...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load creators.</p>
      ) : creators && creators.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((c) => (
            <li key={c.id}>
              <Link
                to="/creators/$creatorId"
                params={{ creatorId: c.id }}
                className="flex flex-col gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                {c.previewImage ? (
                  <img
                    src={c.previewImage}
                    alt={c.displayName}
                    className="aspect-[4/3] w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="aspect-[4/3] w-full rounded-md bg-muted" />
                )}
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{c.displayName}</p>
                  {c.verificationStatus === "verified" && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.creatorTypes.map((t) => t.replaceAll("_", " ")).join(", ")}
                </p>
                <p className="text-xs text-muted-foreground">{c.location ?? "Location not set"}</p>
                <p className="text-sm">
                  {c.avgRating !== null ? (
                    <>
                      ★ {c.avgRating.toFixed(1)}{" "}
                      <span className="text-xs text-muted-foreground">({c.reviewCount})</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">No reviews yet</span>
                  )}
                  {c.startingPrice !== null && (
                    <span className="float-right font-medium">
                      {c.currency} {c.startingPrice.toLocaleString("en-IN")}+
                    </span>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No creators match your filters.</p>
      )}
    </div>
  );
}
