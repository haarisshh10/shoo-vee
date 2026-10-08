import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useQuery as useReviewable } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircleIcon } from "lucide-react";

import { ReviewForm } from "#/components/reviews/review-form.tsx";
import { Button } from "#/components/ui/button.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { $transitionBooking } from "#/lib/bookings/functions.ts";
import {
  myCreatorBookingsQueryOptions,
  myCustomerBookingsQueryOptions,
} from "#/lib/bookings/queries.ts";
import { reviewableQueryOptions } from "#/lib/reviews/queries.ts";

export const Route = createFileRoute("/_auth/app/bookings/")({
  component: BookingsPage,
});

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
  completed: "bg-green-100 text-green-800",
};

function BookingsPage() {
  const queryClient = useQueryClient();
  const asCustomer = useQuery(myCustomerBookingsQueryOptions());
  const asCreator = useQuery(myCreatorBookingsQueryOptions());
  const reviewable = useReviewable(reviewableQueryOptions());

  const { mutate: transition, isPending: isUpdating } = useMutation({
    mutationFn: async (data: {
      bookingId: string;
      action: "accept" | "reject" | "cancel" | "complete";
    }) => await $transitionBooking({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.add({ type: "success", description: "Booking updated." });
    },
    onError: (error) =>
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : "Could not update booking.",
      }),
  });

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-xl font-semibold">Bookings</h1>
        <p className="text-sm text-muted-foreground">Inquiries you sent and received.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">As a customer</h2>
        {asCustomer.isPending ? (
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        ) : asCustomer.data && asCustomer.data.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {asCustomer.data.map(({ booking: b, creator, service }) => (
              <li key={b.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{creator.displayName}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[b.status]}`}>
                    {b.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {service?.title ?? "Custom request"}
                  {b.eventDate ? ` · ${b.eventDate.toLocaleDateString()}` : ""}
                  {b.location ? ` · ${b.location}` : ""}
                  {b.agreedPrice !== null ? ` · ${b.currency} ${b.agreedPrice}` : ""}
                </p>
                {b.message && <p className="mt-1 text-sm text-muted-foreground">{b.message}</p>}
                {b.status === "pending" || b.status === "accepted" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    disabled={isUpdating}
                    onClick={() => transition({ bookingId: b.id, action: "cancel" })}
                  >
                    Cancel
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No bookings yet.</p>
        )}
      </section>

      {reviewable.data && reviewable.data.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Leave a review</h2>
          <ul className="flex flex-col gap-3">
            {reviewable.data.map(({ booking: b, creator }) => (
              <li key={b.id} className="rounded-md border p-3">
                <p className="text-sm font-medium">{creator.displayName}</p>
                <ReviewForm bookingId={b.id} creatorName={creator.displayName} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">As a creator</h2>
        {asCreator.isPending ? (
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        ) : asCreator.data && asCreator.data.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {asCreator.data.map(({ booking: b, customer, service }) => (
              <li key={b.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{customer.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[b.status]}`}>
                    {b.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {service?.title ?? "Custom request"}
                  {b.eventDate ? ` · ${b.eventDate.toLocaleDateString()}` : ""}
                  {b.location ? ` · ${b.location}` : ""}
                  {b.agreedPrice !== null ? ` · ${b.currency} ${b.agreedPrice}` : ""}
                </p>
                {b.message && <p className="mt-1 text-sm text-muted-foreground">{b.message}</p>}
                <div className="mt-2 flex gap-2">
                  {b.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => transition({ bookingId: b.id, action: "accept" })}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isUpdating}
                        onClick={() => transition({ bookingId: b.id, action: "reject" })}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {b.status === "accepted" && (
                    <>
                      <Button
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => transition({ bookingId: b.id, action: "complete" })}
                      >
                        Mark completed
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isUpdating}
                        onClick={() => transition({ bookingId: b.id, action: "cancel" })}
                      >
                        Cancel booking
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No booking requests yet.</p>
        )}
      </section>
    </div>
  );
}
