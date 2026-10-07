import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, ilike } from "drizzle-orm";
import { z } from "zod";

import { freshAuthMiddleware } from "#/lib/auth/middleware.ts";
import { db } from "#/lib/db/index.ts";
import { gig, gigApplication, user } from "#/lib/db/schema/index.ts";

const createGigSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).optional(),
  roleNeeded: z.string().trim().min(1).max(120),
  location: z.string().trim().max(120).optional(),
  pay: z.number().int().min(0).max(100_000_000).optional(),
  currency: z.string().trim().length(3).default("INR"),
  date: z.iso.datetime().optional(),
});

export type CreateGigInput = z.infer<typeof createGigSchema>;

export const $getGigs = createServerFn({ method: "GET" })
  .validator((data) =>
    z
      .object({
        query: z.string().trim().max(120).default(""),
        location: z.string().trim().max(120).default(""),
        includeClosed: z.boolean().default(false),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const conditions = [];
    if (!data.includeClosed) {
      conditions.push(eq(gig.status, "open"));
    }
    if (data.query) {
      conditions.push(ilike(gig.title, `%${data.query}%`));
    }
    if (data.location) {
      conditions.push(ilike(gig.location, `%${data.location}%`));
    }

    return db
      .select({ gig, poster: user })
      .from(gig)
      .innerJoin(user, eq(gig.posterId, user.id))
      .where(and(...conditions))
      .orderBy(desc(gig.createdAt))
      .limit(50);
  });

export const $getGigById = createServerFn({ method: "GET" })
  .validator((data) => z.object({ gigId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const [row] = await db
      .select({ gig, poster: user })
      .from(gig)
      .innerJoin(user, eq(gig.posterId, user.id))
      .where(eq(gig.id, data.gigId))
      .limit(1);
    if (!row) return null;

    const applications = await db
      .select({ application: gigApplication, applicant: user })
      .from(gigApplication)
      .innerJoin(user, eq(gigApplication.applicantId, user.id))
      .where(eq(gigApplication.gigId, data.gigId))
      .orderBy(desc(gigApplication.createdAt));

    return { ...row, applications };
  });

export const $getMyGigs = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    return db
      .select()
      .from(gig)
      .where(eq(gig.posterId, context.user.id))
      .orderBy(desc(gig.createdAt));
  });

export const $getMyApplications = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    return db
      .select({ application: gigApplication, gig })
      .from(gigApplication)
      .innerJoin(gig, eq(gigApplication.gigId, gig.id))
      .where(eq(gigApplication.applicantId, context.user.id))
      .orderBy(desc(gigApplication.createdAt));
  });

export const $createGig = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => createGigSchema.parse(data))
  .handler(async ({ data, context }) => {
    const [created] = await db
      .insert(gig)
      .values({
        posterId: context.user.id,
        title: data.title,
        description: data.description ?? null,
        roleNeeded: data.roleNeeded,
        location: data.location ?? null,
        pay: data.pay ?? null,
        currency: data.currency,
        date: data.date ? new Date(data.date) : null,
        status: "open",
      })
      .returning();
    return created;
  });

export const $applyToGig = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) =>
    z.object({ gigId: z.string(), message: z.string().trim().max(2000).optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const [target] = await db.select().from(gig).where(eq(gig.id, data.gigId)).limit(1);
    if (!target) throw new Error("Gig not found.");
    if (target.posterId === context.user.id) throw new Error("You cannot apply to your own gig.");
    if (target.status !== "open") throw new Error("This gig is closed.");

    try {
      const [created] = await db
        .insert(gigApplication)
        .values({ gigId: target.id, applicantId: context.user.id, message: data.message ?? null })
        .returning();
      return created;
    } catch {
      throw new Error("You have already applied to this gig.");
    }
  });

export const $transitionGigApplication = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) =>
    z.object({ applicationId: z.string(), action: z.enum(["accept", "reject"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const [row] = await db
      .select({ application: gigApplication, gig })
      .from(gigApplication)
      .innerJoin(gig, eq(gigApplication.gigId, gig.id))
      .where(eq(gigApplication.id, data.applicationId))
      .limit(1);
    if (!row) throw new Error("Application not found.");
    if (row.gig.posterId !== context.user.id)
      throw new Error("Only the gig poster can review applications.");

    const [updated] = await db
      .update(gigApplication)
      .set({ status: data.action === "accept" ? "accepted" : "rejected" })
      .where(eq(gigApplication.id, row.application.id))
      .returning();
    return updated;
  });
