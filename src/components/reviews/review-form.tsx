import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "#/components/ui/button.tsx";
import { Label } from "#/components/ui/label.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { $createReview } from "#/lib/reviews/functions.ts";

export function ReviewForm({ bookingId, creatorName }: { bookingId: string; creatorName: string }) {
  const queryClient = useQueryClient();
  const [done, setDone] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: { bookingId: string; rating: number; comment?: string }) =>
      await $createReview({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setDone(true);
      toast.add({ type: "success", description: "Review submitted." });
    },
    onError: (error) =>
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : "Could not submit review.",
      }),
  });

  if (done) return <p className="text-sm text-muted-foreground">Thanks for your review.</p>;

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    const formData = new FormData(e.currentTarget);
    const rating = Number(formData.get("rating"));
    const comment = formData.get("comment");
    mutate({
      bookingId,
      rating: Number.isFinite(rating) ? rating : 0,
      comment: typeof comment === "string" && comment ? comment : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 rounded-md border p-3">
      <Label htmlFor={`rating-${bookingId}`}>Rate {creatorName}</Label>
      <select
        id={`rating-${bookingId}`}
        name="rating"
        required
        defaultValue="5"
        className="h-9 w-32 rounded-md border border-input bg-transparent px-3 text-sm"
      >
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} ★
          </option>
        ))}
      </select>
      <textarea
        name="comment"
        rows={2}
        maxLength={2000}
        placeholder="How was it?"
        className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
      />
      <Button type="submit" size="sm" disabled={isPending} className="w-fit">
        Submit review
      </Button>
    </form>
  );
}
