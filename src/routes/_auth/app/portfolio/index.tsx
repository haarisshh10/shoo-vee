import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircleIcon, Trash2Icon } from "lucide-react";

import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { toast } from "#/components/ui/toast.tsx";
import {
  $createPortfolioItem,
  $deletePortfolioItem,
  type PortfolioItemInput,
} from "#/lib/portfolio/functions.ts";
import { myPortfolioQueryOptions } from "#/lib/portfolio/queries.ts";

export const Route = createFileRoute("/_auth/app/portfolio/")({
  component: PortfolioPage,
});

const CATEGORIES = [
  "wedding",
  "portrait",
  "fashion",
  "automotive",
  "product",
  "event",
  "travel",
  "food",
  "real_estate",
  "commercial",
  "social_media",
  "other",
] as const;

function PortfolioPage() {
  const queryClient = useQueryClient();
  const { data: items, isPending } = useQuery(myPortfolioQueryOptions());

  const { mutate: addItem, isPending: isAdding } = useMutation({
    mutationFn: async (data: PortfolioItemInput) => await $createPortfolioItem({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myPortfolioQueryOptions().queryKey });
      toast.add({ type: "success", description: "Portfolio item added." });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : "Could not add the item.",
      });
    },
  });

  const { mutate: removeItem } = useMutation({
    mutationFn: async (id: string) => await $deletePortfolioItem({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myPortfolioQueryOptions().queryKey });
      toast.add({ type: "success", description: "Item removed." });
    },
    onError: () => toast.add({ type: "error", description: "Could not remove the item." }),
  });

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isAdding) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    const str = (key: string) => {
      const value = formData.get(key);
      return typeof value === "string" ? value : "";
    };

    addItem(
      {
        title: str("title"),
        description: str("description") || undefined,
        mediaUrl: str("mediaUrl"),
        mediaType: (str("mediaType") || "image") as PortfolioItemInput["mediaType"],
        category: (str("category") || "other") as PortfolioItemInput["category"],
        tags: str("tags")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
      { onSuccess: () => form.reset() },
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Portfolio</h1>
        <p className="text-sm text-muted-foreground">
          Add your best work. Strong visuals help customers find you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-busy={isAdding}>
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required maxLength={120} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            rows={2}
            maxLength={2000}
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="mediaUrl">Media URL</Label>
          <Input id="mediaUrl" name="mediaUrl" type="url" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="mediaType">Media type</Label>
            <select
              id="mediaType"
              name="mediaType"
              defaultValue="image"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              defaultValue="other"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input id="tags" name="tags" placeholder="wedding, cinematic" />
        </div>
        <Button type="submit" disabled={isAdding}>
          {isAdding && <LoaderCircleIcon className="animate-spin" aria-hidden="true" />}
          {isAdding ? "Adding..." : "Add to portfolio"}
        </Button>
      </form>

      {isPending ? (
        <div className="flex justify-center p-6">
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        </div>
      ) : items && items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-1">
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
                  muted
                >
                  <track kind="captions" label="No captions available" />
                </video>
              )}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${item.title}`}
                >
                  <Trash2Icon className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No portfolio items yet.</p>
      )}
    </div>
  );
}
