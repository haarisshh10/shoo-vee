import type { BookingStatus } from "#/lib/db/schema/types.ts";

export type BookingAction = "accept" | "reject" | "cancel" | "complete";

/** Which side of a booking the caller is acting as. */
export type BookingRole = "creator" | "customer";

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
