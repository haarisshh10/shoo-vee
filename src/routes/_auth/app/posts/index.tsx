import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircleIcon, Trash2Icon } from "lucide-react";

import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { $createPost, $deletePost, type PostInput } from "#/lib/posts/functions.ts";
import { myPostsQueryOptions } from "#/lib/posts/queries.ts";

export const Route = createFileRoute("/_auth/app/posts/")({
  component: PostsPage,
});

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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Shots</h1>
        <p className="text-sm text-muted-foreground">Share your work with the community.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-busy={isAdding}>
        <div className="grid gap-2">
          <Label htmlFor="mediaUrl">Media URL</Label>
          <Input id="mediaUrl" name="mediaUrl" type="url" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="caption">Caption</Label>
          <textarea
            id="caption"
            name="caption"
            rows={3}
            maxLength={2000}
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
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
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input id="tags" name="tags" placeholder="mumbai, cinematic" />
        </div>
        <Button type="submit" disabled={isAdding}>
          {isAdding && <LoaderCircleIcon className="animate-spin" aria-hidden="true" />}
          {isAdding ? "Publishing..." : "Publish"}
        </Button>
      </form>

      {isPending ? (
        <div className="flex justify-center p-6">
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        </div>
      ) : posts && posts.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {posts.map((item) => (
            <li key={item.id} className="flex flex-col gap-1">
              {item.mediaType === "image" ? (
                <img
                  src={item.mediaUrl}
                  alt={item.caption ?? "Post"}
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
                <p className="line-clamp-2 text-xs text-muted-foreground">{item.caption}</p>
                <button
                  type="button"
                  onClick={() => removePost(item.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Delete post"
                >
                  <Trash2Icon className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No posts yet.</p>
      )}
    </div>
  );
}
