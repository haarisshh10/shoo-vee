import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { freshAuthMiddleware } from "#/lib/auth/middleware.ts";
import {
  describeTransitionFailure,
  resolveBookingTransition,
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

    const [created] = await db
      .insert(booking)
      .values({
        customerId: context.user.id,
        creatorId: creator.id,
        serviceId: data.serviceId ?? null,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
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

    const [updated] = await db
      .update(booking)
      .set({ status: next })
      .where(eq(booking.id, existing.id))
      .returning();

    await notifyCounterparty({ data, role, next, existing });
    return updated;
  });

async function notifyCounterparty({
  data,
  role,
  next,
  existing,
}: {
  data: { action: "accept" | "reject" | "cancel" | "complete" };
  role: BookingRole;
  next: string;
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
  const byline = role === "creator" ? "The creator" : "The customer";

  if (data.action === "cancel") {
    await notify(recipientId, {
      type: "booking",
      title: "Booking cancelled",
      body: `${byline} cancelled this booking.`,
    });
    return;
  }

  await notify(recipientId, {
    type: "booking",
    title: `Booking ${next}`,
    body: `Your booking request is now ${next}.`,
  });
}
