import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { freshAuthMiddleware } from "#/lib/auth/middleware.ts";
import {
  blockBookingRequest,
  describeBlockedBooking,
  describeTransitionFailure,
  describeTransitionOutcome,
  resolveBookingTransition,
  type Availability,
  type BookingAction,
  type BookingRole,
} from "#/lib/bookings/transitions.ts";
import { db } from "#/lib/db/index.ts";
import { booking, creatorProfile, service, user } from "#/lib/db/schema/index.ts";
import { notify } from "#/lib/notifications/functions.ts";

const createBookingSchema = z.object({
  creatorId: z.string().min(1),
  serviceId: z.string().optional(),
  eventDate: z.iso.datetime().optional(),
  location: z.string().trim().max(200).optional(),
  message: z.string().trim().max(2000).optional(),
  agreedPrice: z.number().int().min(0).max(100_000_000).optional(),
  currency: z.string().trim().length(3).default("INR"),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

async function getMyProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(creatorProfile)
    .where(eq(creatorProfile.userId, userId))
    .limit(1);
  return profile ?? null;
}

export const $createBooking = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => createBookingSchema.parse(data))
  .handler(async ({ data, context }) => {
    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.id, data.creatorId))
      .limit(1);
    if (!creator) throw new Error("Creator not found.");
    if (creator.userId === context.user.id) {
      throw new Error("You cannot book yourself.");
    }

    if (data.serviceId) {
      const [svc] = await db
        .select()
        .from(service)
        .where(and(eq(service.id, data.serviceId), eq(service.creatorId, creator.id)))
        .limit(1);
      if (!svc) throw new Error("Service not found for this creator.");
    }

    // A creator who has closed their books, or who is already shooting that day, cannot take this.
    const eventDate = data.eventDate ? new Date(data.eventDate) : null;
    await assertCreatorCanTakeBooking({
      creatorId: creator.id,
      displayName: creator.displayName,
      availability: creator.availabilityStatus,
      eventDate,
    });

    const [created] = await db
      .insert(booking)
      .values({
        customerId: context.user.id,
        creatorId: creator.id,
        serviceId: data.serviceId ?? null,
        eventDate,
        location: data.location ?? null,
        message: data.message ?? null,
        agreedPrice: data.agreedPrice ?? null,
        currency: data.currency,
        status: "pending",
      })
      .returning();
    await notify(creator.userId, {
      type: "booking",
      title: "New booking request",
      body: data.message ?? "A customer requested a booking.",
    });
    return created;
  });

export const $getMyCustomerBookings = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    return db
      .select({ booking, creator: creatorProfile, service })
      .from(booking)
      .innerJoin(creatorProfile, eq(booking.creatorId, creatorProfile.id))
      .leftJoin(service, eq(booking.serviceId, service.id))
      .where(eq(booking.customerId, context.user.id))
      .orderBy(desc(booking.createdAt));
  });

export const $getMyCreatorBookings = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    const profile = await getMyProfile(context.user.id);
    if (!profile) return [];
    return db
      .select({ booking, customer: user, service })
      .from(booking)
      .innerJoin(user, eq(booking.customerId, user.id))
      .leftJoin(service, eq(booking.serviceId, service.id))
      .where(eq(booking.creatorId, profile.id))
      .orderBy(desc(booking.createdAt));
  });

const transitionSchema = z.object({
  bookingId: z.string(),
  action: z.enum(["accept", "reject", "cancel", "complete"]),
});

export const $transitionBooking = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => transitionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const [existing] = await db
      .select()
      .from(booking)
      .where(eq(booking.id, data.bookingId))
      .limit(1);
    if (!existing) throw new Error("Booking not found.");

    const profile = await getMyProfile(context.user.id);
    const isCreator = !!profile && existing.creatorId === profile.id;
    const isCustomer = existing.customerId === context.user.id;
    if (!isCreator && !isCustomer) throw new Error("Not allowed to change this booking.");

    const role = isCreator ? "creator" : "customer";
    const next = resolveBookingTransition(data.action, role, existing.status);
    if (!next) throw new Error(describeTransitionFailure(data.action, role, existing.status));

    // Accepting is what reserves the day, so the guard runs again here: the creator may have closed
    // their books since the request arrived, or booked that date for someone else already.
    if (data.action === "accept") {
      const [creator] = await db
        .select({
          displayName: creatorProfile.displayName,
          availabilityStatus: creatorProfile.availabilityStatus,
        })
        .from(creatorProfile)
        .where(eq(creatorProfile.id, existing.creatorId))
        .limit(1);
      await assertCreatorCanTakeBooking({
        creatorId: existing.creatorId,
        displayName: creator?.displayName ?? "This creator",
        availability: creator?.availabilityStatus ?? "unavailable",
        eventDate: existing.eventDate,
        excludeBookingId: existing.id,
      });
    }

    const [updated] = await db
      .update(booking)
      .set({ status: next })
      .where(eq(booking.id, existing.id))
      .returning()
      // A creator cannot accept two bookings on the same day. The application check above gives the
      // friendly message; this index is the guarantee, since two accepts can race.
      .catch(rethrowBookingConflict);

    await notifyCounterparty({ action: data.action, role, existing });
    return updated;
  });

function rethrowBookingConflict(error: unknown): never {
  if (error instanceof Error && "code" in error && error.code === "23505") {
    throw new Error(
      "This creator already has a booking on that date. Pick another date or send a custom request.",
    );
  }
  throw error;
}

/**
 * Refuses a booking that a creator cannot take: closed books, or a day they are already shooting.
 *
 * Called both when a request is made and again when it is accepted, because a creator can close
 * their books in between and because accepting is what actually reserves the day.
 */
async function assertCreatorCanTakeBooking({
  creatorId,
  displayName,
  availability,
  eventDate,
  excludeBookingId,
}: {
  creatorId: string;
  displayName: string;
  availability: Availability;
  eventDate: Date | null;
  excludeBookingId?: string;
}) {
  const taken = await db
    .select({ eventDate: booking.eventDate })
    .from(booking)
    .where(
      and(
        eq(booking.creatorId, creatorId),
        eq(booking.status, "accepted"),
        excludeBookingId ? ne(booking.id, excludeBookingId) : undefined,
      ),
    );

  const reason = blockBookingRequest({
    availability,
    eventDate,
    takenDates: taken.flatMap((row) => (row.eventDate ? [row.eventDate] : [])),
  });

  if (reason) {
    throw new Error(describeBlockedBooking(reason, displayName));
  }
}

async function notifyCounterparty({
  action,
  role,
  existing,
}: {
  action: BookingAction;
  role: BookingRole;
  existing: typeof booking.$inferSelect;
}) {
  const [creator] = await db
    .select({ userId: creatorProfile.userId })
    .from(creatorProfile)
    .where(eq(creatorProfile.id, existing.creatorId))
    .limit(1);
  if (!creator) return;

  // Whoever did not press the button is the one who needs to know.
  const recipientId = role === "creator" ? existing.customerId : creator.userId;
  await notify(recipientId, { type: "booking", ...describeTransitionOutcome(action, role) });
}
