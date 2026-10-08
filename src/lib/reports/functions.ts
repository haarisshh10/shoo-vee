import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { freshAuthMiddleware } from "#/lib/auth/middleware.ts";
import { db } from "#/lib/db/index.ts";
import {
  booking,
  creatorProfile,
  gig,
  post,
  report,
  user,
  type ReportTargetType,
} from "#/lib/db/schema/index.ts";
import { notify } from "#/lib/notifications/functions.ts";

const createReportSchema = z.object({
  targetType: z.enum(["creator_profile", "post", "gig", "booking"]),
  targetId: z.string().min(1),
  reason: z.string().trim().min(1).max(500),
});

/**
 * Resolves the account that owns a reportable target.
 *
 * `report.targetId` is polymorphic and therefore has no foreign key, so every write has to prove
 * the row still exists — otherwise reports pile up against ids that were never real.
 */
const resolveTargetOwner = createServerOnlyFn(
  async (targetType: ReportTargetType, targetId: string) => {
    switch (targetType) {
      case "creator_profile": {
        const [row] = await db
          .select({ userId: creatorProfile.userId })
          .from(creatorProfile)
          .where(eq(creatorProfile.id, targetId))
          .limit(1);
        return row?.userId ?? null;
      }
      case "post": {
        const [row] = await db
          .select({ userId: creatorProfile.userId })
          .from(post)
          .innerJoin(creatorProfile, eq(post.creatorId, creatorProfile.id))
          .where(eq(post.id, targetId))
          .limit(1);
        return row?.userId ?? null;
      }
      case "gig": {
        const [row] = await db
          .select({ userId: gig.posterId })
          .from(gig)
          .where(eq(gig.id, targetId))
          .limit(1);
        return row?.userId ?? null;
      }
    }
  },
);

export const $createReport = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => createReportSchema.parse(data))
  .handler(async ({ data, context }) => {
    const reporterId = context.user.id;
    const [profile] = await db
      .select({ id: creatorProfile.id })
      .from(creatorProfile)
      .where(eq(creatorProfile.userId, reporterId))
      .limit(1);

    if (data.targetType === "booking") {
      // A booking is only visible to its two parties, so nobody else may file a report against it.
      const [row] = await db
        .select({ customerId: booking.customerId, creatorId: booking.creatorId })
        .from(booking)
        .where(eq(booking.id, data.targetId))
        .limit(1);
      if (!row) throw new Error("That booking no longer exists.");
      if (row.customerId !== reporterId && row.creatorId !== profile?.id) {
        throw new Error("You can only report a booking you are part of.");
      }
    } else {
      const ownerId = await resolveTargetOwner(data.targetType, data.targetId);
      if (!ownerId) throw new Error("That content no longer exists.");
      if (ownerId === reporterId) throw new Error("You cannot report your own content.");
    }

    const [created] = await db
      .insert(report)
      .values({
        reporterId,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
      })
      .onConflictDoNothing()
      .returning();
    if (!created) throw new Error("You have already reported this.");

    const admins = await db.select({ id: user.id }).from(user).where(eq(user.role, "admin"));
    for (const admin of admins) {
      if (admin.id === reporterId) continue;
      await notify(admin.id, {
        type: "report",
        title: "New report filed",
        body: `${data.targetType.replace("_", " ")} reported for review.`,
      });
    }

    return created;
  });

export const $adminListReports = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .validator((data) =>
    z
      .object({ status: z.enum(["open", "reviewed", "dismissed"]).default("open") })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdminRow(context.user.id);
    return db
      .select({ report, reporter: user })
      .from(report)
      .innerJoin(user, eq(report.reporterId, user.id))
      .where(eq(report.status, data.status))
      .orderBy(desc(report.createdAt))
      .limit(100);
  });

export const $adminResolveReport = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) =>
    z.object({ reportId: z.string(), status: z.enum(["reviewed", "dismissed"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await requireAdminRow(context.user.id);
    const [updated] = await db
      .update(report)
      .set({ status: data.status })
      .where(eq(report.id, data.reportId))
      .returning();
    if (!updated) throw new Error("Report not found.");

    await notify(updated.reporterId, {
      type: "report",
      title: `Report ${data.status}`,
      body:
        data.status === "reviewed"
          ? "Thanks — we looked into your report and acted on it."
          : "Thanks — we reviewed your report and dismissed it.",
    });

    return updated;
  });

/**
 * Closes the open reports filed against a target that is no longer available (deleted post, closed
 * gig), so the moderation queue never offers rows nobody can act on.
 */
export const resolveReportsForRemovedTarget = createServerOnlyFn(
  async (targetType: ReportTargetType, targetId: string) => {
    const resolved = await db
      .update(report)
      .set({ status: "reviewed" })
      .where(
        and(
          eq(report.targetType, targetType),
          eq(report.targetId, targetId),
          eq(report.status, "open"),
        ),
      )
      .returning({ reporterId: report.reporterId });

    for (const row of resolved) {
      await notify(row.reporterId, {
        type: "report",
        title: "Report reviewed",
        body: "The content you reported is no longer available.",
      });
    }

    return resolved.length;
  },
);

async function requireAdminRow(userId: string) {
  const [row] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!row || row.role !== "admin") throw new Error("Not authorized.");
  return row;
}
