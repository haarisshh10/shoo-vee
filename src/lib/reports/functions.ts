import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { freshAuthMiddleware } from "#/lib/auth/middleware.ts";
import { db } from "#/lib/db/index.ts";
import { creatorProfile, gig, post, report, user } from "#/lib/db/schema/index.ts";

const createReportSchema = z.object({
  targetType: z.enum(["creator_profile", "post", "gig", "booking"]),
  targetId: z.string().min(1),
  reason: z.string().trim().min(1).max(500),
});

export const $createReport = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => createReportSchema.parse(data))
  .handler(async ({ data, context }) => {
    let exists = false;
    switch (data.targetType) {
      case "creator_profile": {
        const [row] = await db
          .select({ id: creatorProfile.id })
          .from(creatorProfile)
          .where(eq(creatorProfile.id, data.targetId))
          .limit(1);
        exists = !!row;
        break;
      }
      case "post": {
        const [row] = await db
          .select({ id: post.id })
          .from(post)
          .where(eq(post.id, data.targetId))
          .limit(1);
        exists = !!row;
        break;
      }
      case "gig": {
        const [row] = await db
          .select({ id: gig.id })
          .from(gig)
          .where(eq(gig.id, data.targetId))
          .limit(1);
        exists = !!row;
        break;
      }
      case "booking":
        exists = true;
        break;
    }
    if (!exists) throw new Error("Target not found.");

    const [created] = await db
      .insert(report)
      .values({
        reporterId: context.user.id,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
      })
      .onConflictDoNothing()
      .returning();
    if (!created) throw new Error("You have already reported this.");
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
    return updated;
  });

async function requireAdminRow(userId: string) {
  const [row] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!row || row.role !== "admin") throw new Error("Not authorized.");
  return row;
}
