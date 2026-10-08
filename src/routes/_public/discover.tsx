import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheckIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { CreatorCard } from "#/components/creator/creator-card.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import type { CreatorType } from "#/lib/db/schema/types.ts";
import type { CreatorSearch } from "#/lib/discovery/functions.ts";
import { searchCreatorsQueryOptions } from "#/lib/discovery/queries.ts";

const searchParamsSchema = z.object({
  q: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  // Comma-separated so links stay readable: ?types=drone_operator,editor
  types: z.string().optional(),
  verified: z.boolean().optional(),
  equipment: z.string().trim().max(120).optional(),
  maxPrice: z.number().int().min(0).optional(),
  minRating: z.number().min(0).max(5).optional(),
  sort: z.enum(["recommended", "rating", "price_low", "price_high", "newest"]).optional(),
});

export const Route = createFileRoute("/_public/discover")({
  validateSearch: searchParamsSchema,
  component: DiscoverPage,
});

const CREATOR_TYPES: CreatorType[] = [
  "photographer",
  "videographer",
  "editor",
  "drone_operator",
  "product_creator",
  "wedding_creator",
  "event_creator",
  "content_creator",
];

const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Rating" },
  { value: "price_low", label: "Price: low to high" },
  { value: "price_high", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
] as const;

const PAGE_SIZE = 12;

function DiscoverPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [showFilters, setShowFilters] = useState(false);

  const filters: CreatorSearch = {
    query: search.q ?? "",
    location: search.location ?? "",
    creatorTypes: (search.types ?? "").split(",").filter(Boolean),
    verifiedOnly: search.verified ?? false,
    equipment: search.equipment ?? "",
    specialty: "",
    maxPrice: search.maxPrice,
    minRating: search.minRating,
    limit,
    sort: search.sort ?? "recommended",
  };

  const { data: creators, isPending, isError } = useQuery(searchCreatorsQueryOptions(filters));
  const activeTypes = (search.types ?? "").split(",").filter(Boolean);

  const submit = (formData: FormData) => {
    const str = (key: string) => {
      const value = formData.get(key);
      return typeof value === "string" ? value.trim() : "";
    };
    const number = (key: string) => {
      const value = str(key);
      return value === "" ? undefined : Number(value);
    };

    setLimit(PAGE_SIZE);
    void navigate({
      search: (prev) => ({
        ...prev,
        q: str("query") || undefined,
        location: str("location") || undefined,
        equipment: str("equipment") || undefined,
        maxPrice: number("maxPrice"),
        minRating: number("minRating"),
      }),
    });
  };

  const updateSearch = (patch: Partial<typeof search>) => {
    setLimit(PAGE_SIZE);
    void navigate({ search: (prev) => ({ ...prev, ...patch }) });
  };

  const toggleType = (type: CreatorType) => {
    updateSearch({
      types: (activeTypes.includes(type)
        ? activeTypes.filter((t) => t !== type)
        : [...activeTypes, type]
      ).join(","),
    });
  };

  const hasFilters =
    !!search.q ||
    !!search.location ||
    !!search.equipment ||
    activeTypes.length > 0 ||
    !!search.verified ||
    search.maxPrice !== undefined ||
    search.minRating !== undefined;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Discover creators</h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Photographers, videographers, editors, drone pilots and studios across India — with
            published rates, real portfolios and reviews.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(new FormData(e.currentTarget));
          }}
          className="flex flex-col gap-3 rounded-2xl border bg-card p-3 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <SearchIcon
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              name="query"
              defaultValue={search.q ?? ""}
              placeholder="Search by name or specialty"
              aria-label="Search creators"
              className="ps-9"
            />
          </div>
          <Input
            name="location"
            defaultValue={search.location ?? ""}
            placeholder="City"
            aria-label="Location"
            className="sm:w-36"
          />
          <Button type="submit" size="lg">
            Search
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => setShowFilters((open) => !open)}
            aria-expanded={showFilters}
          >
            <SlidersHorizontalIcon className="size-4" aria-hidden="true" />
            More filters
          </Button>
        </form>

        {showFilters ? (
          <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="maxPrice">Max starting price</Label>
              <Input id="maxPrice" name="maxPrice" type="number" min={0} placeholder="50000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="minRating">Minimum rating</Label>
              <Input
                id="minRating"
                name="minRating"
                type="number"
                min={0}
                max={5}
                placeholder="4"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="equipment">Equipment</Label>
              <Input id="equipment" name="equipment" placeholder="Sony FX3" />
            </div>
            <Button type="submit" variant="outline" className="sm:col-span-3 sm:w-fit">
              Apply filters
            </Button>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {CREATOR_TYPES.map((type) => {
            const active = activeTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-sm capitalize transition-colors ${
                  active
                    ? "border-foreground/40 bg-foreground text-background"
                    : "bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground"
                }`}
              >
                {type.replaceAll("_", " ")}
              </button>
            );
          })}
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="size-4"
              checked={search.verified ?? false}
              onChange={(e) => updateSearch({ verified: e.target.checked || undefined })}
            />
            <BadgeCheckIcon className="size-4" aria-hidden="true" />
            Verified only
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            Sort
            <select
              value={search.sort ?? "recommended"}
              onChange={(e) =>
                updateSearch({
                  sort: e.target.value as NonNullable<typeof search.sort>,
                })
              }
              className="h-8 rounded-md border border-input bg-transparent px-2 text-sm text-foreground"
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {hasFilters ? (
            <Link to="/discover" className="text-muted-foreground underline underline-offset-4">
              Clear all filters
            </Link>
          ) : null}
        </div>
      </header>

      <div className="mt-8">
        {isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-96 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">Could not load creators.</p>
        ) : creators && creators.length > 0 ? (
          <>
            <p className="mb-4 text-xs text-muted-foreground">
              {creators.length} creator{creators.length === 1 ? "" : "s"}
              {activeTypes.length > 0 ? " matching your filters" : ""}
            </p>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {creators.map((creator) => (
                <li key={creator.id}>
                  <CreatorCard creator={creator} />
                </li>
              ))}
            </ul>
            {creators.length >= filters.limit ? (
              <Button
                variant="outline"
                className="mt-8"
                onClick={() => setLimit((current) => Math.min(50, current + PAGE_SIZE))}
              >
                Load more creators
              </Button>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">No creators match these filters.</p>
            <Link to="/discover" className="mt-2 inline-block text-sm underline underline-offset-4">
              Clear filters
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
