import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LoaderCircleIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { useAuth } from "#/lib/auth/hooks.ts";
import { $applyToGig, $createGig, type CreateGigInput } from "#/lib/gigs/functions.ts";
import { gigsQueryOptions } from "#/lib/gigs/queries.ts";

export const Route = createFileRoute("/_public/gigs")({
  component: GigsPage,
});

function GigsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: gigs, isPending, isError } = useQuery(gigsQueryOptions());
  const [showForm, setShowForm] = useState(false);

  const { mutate: createGig, isPending: isCreating } = useMutation({
    mutationFn: async (data: CreateGigInput) => await $createGig({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gigs"] });
      toast.add({ type: "success", description: "Gig posted." });
      setShowForm(false);
    },
    onError: (error) =>
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : "Could not post the gig.",
      }),
  });

  const { mutate: apply, isPending: isApplying } = useMutation({
    mutationFn: async (data: { gigId: string; message?: string }) => await $applyToGig({ data }),
    onSuccess: () => toast.add({ type: "success", description: "Application sent." }),
    onError: (error) =>
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : "Could not apply.",
      }),
  });

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isCreating) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    const str = (key: string) => {
      const v = formData.get(key);
      return typeof v === "string" ? v : "";
    };
    createGig(
      {
        title: str("title"),
        description: str("description") || undefined,
        roleNeeded: str("roleNeeded"),
        location: str("location") || undefined,
        pay: str("pay") !== "" ? Number(str("pay")) : undefined,
        currency: str("currency") || "INR",
        date: str("date") ? new Date(str("date")).toISOString() : undefined,
      },
      { onSuccess: () => form.reset() },
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gigs</h1>
          <p className="text-sm text-muted-foreground">
            Second shooters, assistants, editors — gain experience.
          </p>
        </div>
        {user && (
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Post a gig"}
          </Button>
        )}
      </div>

      {showForm && user && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border p-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              maxLength={160}
              placeholder="Need second photographer for wedding"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="roleNeeded">Role needed</Label>
            <Input id="roleNeeded" name="roleNeeded" required placeholder="Second photographer" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pay">Pay</Label>
              <Input id="pay" name="pay" type="number" min={0} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" />
            </div>
          </div>
          <Button type="submit" disabled={isCreating}>
            {isCreating && <LoaderCircleIcon className="animate-spin" aria-hidden="true" />}
            Post gig
          </Button>
        </form>
      )}

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load gigs.</p>
      ) : gigs && gigs.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {gigs.map(({ gig: g, poster }) => (
            <li key={g.id} className="rounded-md border p-4">
              <div className="flex items-start justify-between gap-2">
                <Link
                  to="/app/gigs/$gigId"
                  params={{ gigId: g.id }}
                  className="font-medium hover:underline"
                >
                  {g.title}
                </Link>
                {g.pay !== null && (
                  <p className="text-sm font-medium">
                    {g.currency} {g.pay.toLocaleString("en-IN")}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {g.roleNeeded}
                {g.location ? ` · ${g.location}` : ""}
                {g.date ? ` · ${g.date.toLocaleDateString()}` : ""}
                {` · by ${poster.name}`}
              </p>
              {g.description && <p className="mt-1 line-clamp-2 text-sm">{g.description}</p>}
              {user && user.id !== poster.id && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  disabled={isApplying}
                  onClick={() => {
                    const message = window.prompt("Message to the poster (optional)");
                    if (message !== null) apply({ gigId: g.id, message: message || undefined });
                  }}
                >
                  Apply
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No open gigs yet.</p>
      )}
    </div>
  );
}
