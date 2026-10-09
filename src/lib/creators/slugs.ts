import { eq } from "drizzle-orm";

import { db } from "#/lib/db/index.ts";
import { creatorProfile } from "#/lib/db/schema/index.ts";

/** URL-safe form of a display name, e.g. "Asha Rao" -> "asha-rao". */
export function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || "creator";
}

/**
 * Picks a slug that is not taken yet, appending `-2`, `-3`, ... on collisions. Pass `excludeId`
 * when updating an existing profile so its own row does not count as a collision.
 */
export async function generateUniqueSlug(displayName: string, excludeId?: string) {
  const base = slugify(displayName);
  let candidate = base;

  for (let suffix = 2; ; suffix++) {
    const [existing] = await db
      .select({ id: creatorProfile.id })
      .from(creatorProfile)
      .where(eq(creatorProfile.slug, candidate))
      .limit(1);
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${suffix}`;
  }
}
