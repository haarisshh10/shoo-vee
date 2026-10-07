import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq } from "drizzle-orm";

import { freshAuthMiddleware } from "#/lib/auth/middleware.ts";
import { db } from "#/lib/db/index.ts";
import {
  booking,
  creatorEquipment,
  creatorProfile,
  gigApplication,
  portfolioItem,
  post,
  service,
} from "#/lib/db/schema/index.ts";

export const $getDashboardSummary = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    const [profile] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.userId, context.user.id))
      .limit(1);

    if (!profile) {
      return {
        hasProfile: false as const,
        profile,
        portfolioCount: 0,
        serviceCount: 0,
        equipmentCount: 0,
        postCount: 0,
        incomingPending: 0,
        outgoingCount: 0,
        applicationsCount: 0,
        recentIncoming: [] as {
          id: string;
          status: string;
          message: string | null;
          createdAt: Date;
        }[],
      };
    }

    const [
      portfolioRows,
      serviceRows,
      equipmentRows,
      postRows,
      incomingPendingRows,
      outgoingRows,
      applicationRows,
      recentIncoming,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(portfolioItem)
        .where(eq(portfolioItem.creatorId, profile.id)),
      db.select({ count: count() }).from(service).where(eq(service.creatorId, profile.id)),
      db
        .select({ count: count() })
        .from(creatorEquipment)
        .where(eq(creatorEquipment.creatorId, profile.id)),
      db.select({ count: count() }).from(post).where(eq(post.creatorId, profile.id)),
      db
        .select({ count: count() })
        .from(booking)
        .where(and(eq(booking.creatorId, profile.id), eq(booking.status, "pending"))),
      db.select({ count: count() }).from(booking).where(eq(booking.customerId, context.user.id)),
      db
        .select({ count: count() })
        .from(gigApplication)
        .where(eq(gigApplication.applicantId, context.user.id)),
      db
        .select({
          id: booking.id,
          status: booking.status,
          message: booking.message,
          createdAt: booking.createdAt,
        })
        .from(booking)
        .where(eq(booking.creatorId, profile.id))
        .orderBy(desc(booking.createdAt))
        .limit(5),
    ]);

    return {
      hasProfile: true as const,
      profile,
      portfolioCount: portfolioRows[0]?.count ?? 0,
      serviceCount: serviceRows[0]?.count ?? 0,
      equipmentCount: equipmentRows[0]?.count ?? 0,
      postCount: postRows[0]?.count ?? 0,
      incomingPending: incomingPendingRows[0]?.count ?? 0,
      outgoingCount: outgoingRows[0]?.count ?? 0,
      applicationsCount: applicationRows[0]?.count ?? 0,
      recentIncoming,
    };
  });
