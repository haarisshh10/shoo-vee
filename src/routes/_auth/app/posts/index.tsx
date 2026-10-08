import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2Icon } from "lucide-react";

import { StudioChips, MediaField } from "#/components/studio/studio-fields.tsx";
import {
  StudioEmpty,
  StudioPage,
  StudioPanel,
  StudioSubmit,
} from "#/components/studio/studio-page.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { $createPost, $deletePost, type PostInput } from "#/lib/posts/functions.ts";
import { myPostsQueryOptions } from "#/lib/posts/queries.ts";

export const Route = createFileRoute("/_auth/app/posts/")({
  component: PostsPage,
});

const MEDIA_TYPES = [
  ["image", "Image"],
  ["video", "Video"],
] as const;

function PostsPage() {
  const queryClient = useQueryClient();
  const { data: posts, isPending } = useQuery(myPostsQueryOptions());

  const { mutate: addPost, isPending: isAdding } = useMutation({
    mutationFn: async (data: PostInput) => await $createPost({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myPostsQueryOptions().queryKey });
      toast.add({ type: "success", description: "Post published." });
    },
    onError: (error) =>
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : "Could not publish the post.",
      }),
  });

  const { mutate: removePost } = useMutation({
    mutationFn: async (id: string) => await $deletePost({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myPostsQueryOptions().queryKey });
      toast.add({ type: "success", description: "Post deleted." });
    },
    onError: () => toast.add({ type: "error", description: "Could not delete the post." }),
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

    addPost(
      {
        caption: str("caption") || undefined,
        mediaUrl: str("mediaUrl"),
        mediaType: (str("mediaType") || "image") as PostInput["mediaType"],
        location: str("location") || undefined,
        tags: str("tags")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
      { onSuccess: () => form.reset() },
    );
  };

  const total = posts?.length ?? 0;

  return (
    <StudioPage
      title="Posts"
      description="Everything you publish here appears in the public Shots feed, the newest first. Regular posts are how people find you before they book you."
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
            title="Publish a post"
            description="One shot, one caption. It lands in the feed straight away."
            className="flex flex-col gap-4"
          >
            <MediaField
              id="mediaUrl"
              name="mediaUrl"
              label="Media URL"
              mediaType="image"
              hint="Paste a link to your image or video."
            />

            <div className="grid gap-2">
              <Label htmlFor="caption">Caption</Label>
              <textarea
                id="caption"
                name="caption"
                rows={2}
                maxLength={2000}
                placeholder="Golden hour at the fort"
                className="rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              />
            </div>

            <StudioChips
              legend="Media type"
              name="mediaType"
              options={MEDIA_TYPES}
              type="radio"
              defaultValue="image"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" className="h-9" placeholder="Mumbai" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <Input id="tags" name="tags" className="h-9" placeholder="cinematic, wedding" />
              </div>
            </div>

            <StudioSubmit isPending={isAdding} pendingLabel="Publishing...">
              Publish
            </StudioSubmit>
          </StudioPanel>
        </form>

        {total > 0 ? (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">
              This is how your posts appear in the feed.{" "}
              <Link to="/shots" className="underline underline-offset-4">
                See the public feed
              </Link>
              .
            </p>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {posts?.map((post) => (
                <li
                  key={post.id}
                  className="group relative overflow-hidden rounded-2xl border bg-card"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-muted">
                    {post.mediaType === "image" ? (
                      <img
                        src={post.mediaUrl}
                        alt={post.caption ?? "Post"}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <video
                        src={post.mediaUrl}
                        className="size-full object-cover"
                        muted
                        playsInline
                      >
                        <track kind="captions" label="No captions available" />
                      </video>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2 p-3">
                    <div className="min-w-0">
                      {post.caption ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{post.caption}</p>
                      ) : null}
                      {post.location ? (
                        <p className="mt-1 text-xs text-muted-foreground/80">{post.location}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePost(post.id)}
                      className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                      aria-label="Delete post"
                    >
                      <Trash2Icon className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <StudioEmpty
            title="No posts yet"
            hint="Posts are the cheapest way to stay visible — no booking required."
          >
            Publish your latest work. It shows up in the Shots feed for everyone, and it is the
            first thing people see before they read your profile.
          </StudioEmpty>
        )}
      </div>
    </StudioPage>
  );
}
