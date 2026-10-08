import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2Icon } from "lucide-react";

import { StudioChips, MediaField } from "#/components/studio/studio-fields.tsx";
import {
  StudioEmpty,
  StudioPage,
  StudioPanel,
  StudioSubmit,
} from "#/components/studio/studio-page.tsx";
import { Badge } from "#/components/ui/badge.tsx";
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
  ["wedding", "Wedding"],
  ["portrait", "Portrait"],
  ["fashion", "Fashion"],
  ["automotive", "Automotive"],
  ["product", "Product"],
  ["event", "Event"],
  ["travel", "Travel"],
  ["food", "Food"],
  ["real_estate", "Real estate"],
  ["commercial", "Commercial"],
  ["social_media", "Social media"],
  ["other", "Other"],
] as const;

const MEDIA_TYPES = [
  ["image", "Image"],
  ["video", "Video"],
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

  const total = items?.length ?? 0;

  return (
    <StudioPage
      title="Portfolio"
      description="The work customers judge you on. It fills the preview strip on your profile card and the gallery on your public page."
      count={total}
      isPending={isPending}
    >
      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-8">
        <form
          onSubmit={handleSubmit}
          className="lg:sticky lg:top-24 lg:self-start"
          aria-busy={isAdding}
        >
          <StudioPanel
            title="Add a piece"
            description="One strong image beats five average ones."
            className="flex flex-col gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                required
                maxLength={120}
                className="h-9"
                placeholder="Golden hour at the fort"
              />
            </div>

            <MediaField
              id="mediaUrl"
              name="mediaUrl"
              label="Media URL"
              mediaType="image"
              hint="Paste a link to your image or video. Uploading from your camera roll is next."
            />

            <div className="grid gap-4">
              <StudioChips
                legend="Media type"
                name="mediaType"
                options={MEDIA_TYPES}
                type="radio"
                defaultValue="image"
              />
              <StudioChips
                legend="Category"
                name="category"
                options={CATEGORIES}
                type="radio"
                defaultValue="other"
                hint="Drives the category filter in Discover."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={2}
                maxLength={2000}
                placeholder="What was the brief, and what made the shot work?"
                className="rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" name="tags" className="h-9" placeholder="wedding, cinematic" />
              <p className="text-xs text-muted-foreground">Comma separated.</p>
            </div>

            <StudioSubmit isPending={isAdding} pendingLabel="Adding...">
              Add to portfolio
            </StudioSubmit>
          </StudioPanel>
        </form>

        {total > 0 ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {items?.map((item) => (
              <li
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border bg-card"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  {item.mediaType === "image" ? (
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <video src={item.mediaUrl} className="size-full object-cover" muted playsInline>
                      <track kind="captions" label="No captions available" />
                    </video>
                  )}
                </div>
                <div className="flex flex-col gap-1 p-3">
                  <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="rounded-full font-normal capitalize">
                      {item.category.replaceAll("_", " ")}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      aria-label={`Delete ${item.title}`}
                    >
                      <Trash2Icon className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <StudioEmpty
            title="Nothing in your portfolio yet"
            hint="Three to five pieces is enough to start. You can always add more later."
          >
            Start with the shot you would put first on your own website. Add it on the left and it
            appears on your profile card immediately.
          </StudioEmpty>
        )}
      </div>
    </StudioPage>
  );
}
