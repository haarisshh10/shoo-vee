import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { StudioSelect } from "#/components/studio/studio-fields.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { useAuth } from "#/lib/auth/hooks.ts";
import { $createBooking, type CreateBookingInput } from "#/lib/bookings/functions.ts";

export interface BookableService {
  id: string;
  title: string;
  price: number;
  currency: string;
  pricingUnit: string;
}

interface BookingFormProps {
  creatorId: string;
  services: BookableService[];
  /** Preselected service, when the customer clicked one on the services list. */
  initialServiceId?: string;
  disabledReason?: string;
}

export function BookingForm({
  creatorId,
  services,
  initialServiceId,
  disabledReason,
}: BookingFormProps) {
  const { user, isPending: isAuthPending } = useAuth();
  const [sent, setSent] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: CreateBookingInput) => await $createBooking({ data }),
    onSuccess: () => {
      setSent(true);
      toast.add({ type: "success", description: "Booking request sent." });
    },
    onError: (error) =>
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : "Could not send the request.",
      }),
  });

  if (isAuthPending) return null;
  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        <a href="/login" className="underline">
          Log in
        </a>{" "}
        to send a booking request.
      </p>
    );
  }
  if (disabledReason) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        {disabledReason}
      </p>
    );
  }
  if (sent) {
    return <p className="text-sm text-muted-foreground">Request sent. Check your bookings page.</p>;
  }

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    const str = (key: string) => {
      const v = formData.get(key);
      return typeof v === "string" ? v : "";
    };

    mutate({
      creatorId,
      serviceId: str("serviceId") || undefined,
      eventDate: str("eventDate") ? new Date(str("eventDate")).toISOString() : undefined,
      location: str("location") || undefined,
      message: str("message") || undefined,
      agreedPrice: str("agreedPrice") !== "" ? Number(str("agreedPrice")) : undefined,
      currency: str("currency") || "INR",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-busy={isPending}>
      {services.length > 0 ? (
        <StudioSelect
          id="serviceId"
          name="serviceId"
          label="Service"
          defaultValue={initialServiceId ?? ""}
          options={[
            ["", "Custom request"],
            ...services.map((s): readonly [string, string] => [
              s.id,
              `${s.title} — ${s.currency} ${s.price.toLocaleString("en-IN")} / ${s.pricingUnit}`,
            ]),
          ]}
        />
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="eventDate">Event date</Label>
        <Input id="eventDate" name="eventDate" type="date" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="agreedPrice">Agreed price</Label>
        <Input id="agreedPrice" name="agreedPrice" type="number" min={0} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">Message</Label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={2000}
          className="rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Request booking"}
      </Button>
    </form>
  );
}
