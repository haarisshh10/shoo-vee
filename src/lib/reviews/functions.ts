import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { freshAuthMiddleware } from "#/lib/auth/middleware.ts";
import { db } from "#/lib/db/index.ts";
import { booking, creatorProfile, review } from "#/lib/db/schema/index.ts";
import { notify } from "#/lib/notifications/functions.ts";

const createReviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

export const $createReview = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => createReviewSchema.parse(data))
  .handler(async ({ data, context }) => {
    const [b] = await db.select().from(booking).where(eq(booking.id, data.bookingId)).limit(1);
    if (!b) throw new Error("Booking not found.");
    if (b.customerId !== context.user.id) {
      throw new Error("Only the booking customer can leave a review.");
    }
    if (b.status !== "completed") {
      throw new Error("Bookings can be reviewed after completion.");
    }

    const [existing] = await db.select().from(review).where(eq(review.bookingId, b.id)).limit(1);
    if (existing) throw new Error("This booking has already been reviewed.");

    const [created] = await db
      .insert(review)
      .values({
        creatorId: b.creatorId,
        reviewerId: context.user.id,
        bookingId: b.id,
        rating: data.rating,
        comment: data.comment ?? null,
      })
      .returning();

    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.id, b.creatorId))
      .limit(1);
    if (creator) {
      await notify(creator.userId, {
        type: "review",
        title: "New review",
        body: `You received a ${data.rating}-star review.`,
      });
    }
    return created;
  });

export const $getMyReviewableBookings = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    const done = await db
      .select({ booking, creator: creatorProfile })
      .from(booking)
      .innerJoin(creatorProfile, eq(booking.creatorId, creatorProfile.id))
      .where(and(eq(booking.customerId, context.user.id), eq(booking.status, "completed")))
      .orderBy(desc(booking.createdAt));

    if (done.length === 0) return [];

    const reviewed = await db
      .select({ bookingId: review.bookingId })
      .from(review)
      .where(eq(review.reviewerId, context.user.id));
    const reviewedIds = new Set(reviewed.map((r) => r.bookingId));

    return done.filter((d) => !reviewedIds.has(d.booking.id));
  });
