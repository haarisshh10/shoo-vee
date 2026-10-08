import { describe, expect, it } from "vite-plus/test";

import {
  BOOKING_TRANSITIONS,
  describeTransitionFailure,
  describeTransitionOutcome,
  resolveBookingTransition,
  type BookingAction,
  type BookingRole,
} from "#/lib/bookings/transitions.ts";
import type { BookingStatus } from "#/lib/db/schema/types.ts";

const STATUSES: BookingStatus[] = ["pending", "accepted", "rejected", "cancelled", "completed"];
const ROLES: BookingRole[] = ["creator", "customer"];
const ACTIONS = Object.keys(BOOKING_TRANSITIONS) as BookingAction[];

describe("booking transitions", () => {
  it.each(
    ACTIONS.flatMap((action) =>
      ROLES.flatMap((role) => STATUSES.map((status) => ({ action, role, status }))),
    ),
  )("$role/$action/$status follows the declared matrix", ({ action, role, status }) => {
    const rule = BOOKING_TRANSITIONS[action];
    const expected = rule.roles.includes(role) && rule.from.includes(status) ? rule.to : null;
    expect(resolveBookingTransition(action, role, status)).toBe(expected);
  });

  it("walks a booking from request to review", () => {
    expect(resolveBookingTransition("accept", "creator", "pending")).toBe("accepted");
    expect(resolveBookingTransition("complete", "creator", "accepted")).toBe("completed");
  });

  it("lets the creator withdraw an accepted booking", () => {
    expect(resolveBookingTransition("cancel", "creator", "accepted")).toBe("cancelled");
  });

  it("lets either party call off a pending request", () => {
    expect(resolveBookingTransition("cancel", "customer", "pending")).toBe("cancelled");
    expect(resolveBookingTransition("cancel", "creator", "pending")).toBe("cancelled");
  });

  it("keeps decided bookings terminal", () => {
    for (const action of ACTIONS) {
      expect(resolveBookingTransition(action, "creator", "rejected")).toBeNull();
      expect(resolveBookingTransition(action, "customer", "completed")).toBeNull();
      expect(resolveBookingTransition(action, "creator", "cancelled")).toBeNull();
    }
  });

  it("never lets a customer decide or complete a booking", () => {
    for (const status of STATUSES) {
      expect(resolveBookingTransition("accept", "customer", status)).toBeNull();
      expect(resolveBookingTransition("reject", "customer", status)).toBeNull();
      expect(resolveBookingTransition("complete", "customer", status)).toBeNull();
    }
  });

  it("explains refusals without leaking internals", () => {
    expect(describeTransitionFailure("accept", "customer", "pending")).toBe(
      "Not allowed to change this booking.",
    );
    expect(describeTransitionFailure("accept", "creator", "completed")).toBe(
      "Cannot accept a booking that is completed.",
    );
  });
});

describe("booking transition notifications", () => {
  it("names the party that cancelled, since either side can", () => {
    expect(describeTransitionOutcome("cancel", "customer").body).toBe(
      "The customer cancelled this booking.",
    );
    expect(describeTransitionOutcome("cancel", "creator").body).toBe(
      "The creator cancelled this booking.",
    );
  });

  it("tells the customer a completed booking is reviewable", () => {
    const outcome = describeTransitionOutcome("complete", "creator");
    expect(outcome.title).toBe("Booking completed");
    expect(outcome.body).toContain("leave a review");
  });

  it("spells out the decision on a request", () => {
    expect(describeTransitionOutcome("accept", "creator")).toEqual({
      title: "Booking accepted",
      body: "Your booking request was accepted.",
    });
    expect(describeTransitionOutcome("reject", "creator")).toEqual({
      title: "Booking declined",
      body: "Your booking request was declined.",
    });
  });

  it("reads as a sentence instead of a status dump", () => {
    for (const action of ACTIONS) {
      const { body } = describeTransitionOutcome(action, "creator");
      // The old template interpolated the status enum straight into a sentence.
      expect(body).not.toMatch(/\bis now\b/);
      expect(body.endsWith(".")).toBe(true);
    }
  });
});
