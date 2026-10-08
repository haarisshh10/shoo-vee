import type { BookingStatus } from "#/lib/db/schema/types.ts";

export type BookingAction = "accept" | "reject" | "cancel" | "complete";

/** Which side of a booking the caller is acting as. */
export type BookingRole = "creator" | "customer";

/** A creator's public availability, from `creator_profile.availability_status`. */
export type Availability = "available" | "busy" | "unavailable";

export const AVAILABILITY_COPY: Record<Availability, { label: string; hint: string }> = {
  available: { label: "Available", hint: "Taking new bookings" },
  busy: { label: "Busy", hint: "Not taking new bookings right now" },
  unavailable: { label: "Unavailable", hint: "Not accepting bookings" },
};

type TransitionRule = {
  roles: readonly BookingRole[];
  from: readonly BookingStatus[];
  to: BookingStatus;
};

/**
 * The booking lifecycle, kept out of the server function so it can be tested directly.
 *
 * A creator decides a pending request (accept/reject), either party can call an unstarted booking
 * off, and only the creator can close out an accepted one.
 */
export const BOOKING_TRANSITIONS: Record<BookingAction, TransitionRule> = {
  accept: { roles: ["creator"], from: ["pending"], to: "accepted" },
  reject: { roles: ["creator"], from: ["pending"], to: "rejected" },
  // Customers can drop a request before it is decided; creators can withdraw an accepted booking
  // (a no-show escape hatch, since nothing else moves an accepted booking backwards).
  cancel: { roles: ["creator", "customer"], from: ["pending", "accepted"], to: "cancelled" },
  complete: { roles: ["creator"], from: ["accepted"], to: "completed" },
};

/** The status an action moves a booking to, or `null` when the action is not allowed. */
export function resolveBookingTransition(
  action: BookingAction,
  role: BookingRole,
  status: BookingStatus,
): BookingStatus | null {
  const rule = BOOKING_TRANSITIONS[action];
  if (!rule.roles.includes(role) || !rule.from.includes(status)) return null;
  return rule.to;
}

export function describeTransitionFailure(
  action: BookingAction,
  role: BookingRole,
  status: BookingStatus,
) {
  const rule = BOOKING_TRANSITIONS[action];
  if (!rule.roles.includes(role)) return "Not allowed to change this booking.";
  return `Cannot ${action} a booking that is ${status}.`;
}

/**
 * Notification copy for a booking status change, read by the party that did not trigger it.
 *
 * Completion is the one status that hands the customer an action — the booking becomes reviewable
 * — so it says so instead of restating the status.
 */
export function describeTransitionOutcome(
  action: BookingAction,
  role: BookingRole,
): { title: string; body: string } {
  const actor = role === "creator" ? "The creator" : "The customer";

  switch (action) {
    case "cancel":
      return { title: "Booking cancelled", body: `${actor} cancelled this booking.` };
    case "accept":
      return { title: "Booking accepted", body: "Your booking request was accepted." };
    case "reject":
      return { title: "Booking declined", body: "Your booking request was declined." };
    case "complete":
      return {
        title: "Booking completed",
        body: "This booking is done — leave a review to help other creators.",
      };
  }
}

/** The reason a booking request cannot be made, or `null` when it is allowed. */
export type BlockedReason = "unavailable" | "date-taken";

/**
 * Whether a creator can take a booking for a date.
 *
 * `takenDates` are the calendar days the creator already has an accepted booking on. A booking
 * covers a whole day: a creator cannot be in two places on the same date, and that is the
 * granularity customers book at, so two accepted bookings cannot share a day.
 */
export function blockBookingRequest(input: {
  availability: Availability;
  eventDate: Date | null;
  takenDates: readonly Date[];
}): BlockedReason | null {
  if (input.availability !== "available") return "unavailable";
  if (!input.eventDate) return null;
  return sameCalendarDay(input.eventDate, input.takenDates) ? "date-taken" : null;
}

export function describeBlockedBooking(reason: BlockedReason, displayName?: string): string {
  const who = displayName ? `${displayName} is` : "This creator is";
  switch (reason) {
    case "unavailable":
      return `${who} not taking new bookings right now. Try another creator or check back later.`;
    case "date-taken":
      return `${who} already has a booking on that date. Pick another date or send a custom request.`;
  }
}

/** Same UTC calendar day. Booking dates are stored without a timezone, so UTC is the stable frame. */
export function sameCalendarDay(a: Date, dates: readonly Date[]): boolean {
  const day = startOfUtcDay(a);
  return dates.some((d) => startOfUtcDay(d).getTime() === day.getTime());
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
