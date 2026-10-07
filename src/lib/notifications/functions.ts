import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { and, desc, eq, sql } from "drizzle-orm";

import { freshAuthMiddleware } from "#/lib/auth/middleware.ts";
import { db } from "#/lib/db/index.ts";
import { notification, type NotificationType } from "#/lib/db/schema/index.ts";

export const notify = createServerOnlyFn(
  async (userId: string, data: { type: NotificationType; title: string; body?: string }) => {
    await db
      .insert(notification)
      .values({ userId, type: data.type, title: data.title, body: data.body ?? null });
  },
);

export const $listNotifications = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    return db
      .select()
      .from(notification)
      .where(eq(notification.userId, context.user.id))
      .orderBy(desc(notification.createdAt))
      .limit(50);
  });

export const $getUnreadCount = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notification)
      .where(and(eq(notification.userId, context.user.id), eq(notification.read, false)));
    return row?.count ?? 0;
  });

export const $markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    await db
      .update(notification)
      .set({ read: true })
      .where(and(eq(notification.userId, context.user.id), eq(notification.read, false)));
    return { marked: true };
  });
