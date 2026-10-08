import { z } from "zod";

/**
 * Where an image can come from.
 *
 * Both forms exist in the wild: uploads made in Studio store a path, and seeded or linked images are
 * absolute URLs.
 */
const STORED_UPLOAD = String.raw`\/uploads\/\d{4}-\d{2}-[\w-]+\.(?:png|jpg|webp|avif)`;
const HTTP_URL = String.raw`https?:\/\/[^\s]+`;

/**
 * A stored upload's path, the way the app links to it.
 *
 * Root-relative rather than absolute on purpose: an absolute URL bakes the host into stored rows, so
 * changing the domain would leave every portfolio item and post pointing at a place that no longer
 * exists. The app serves uploads from its own origin, so the path is all a reader needs.
 */
export const storedUploadPath = z.string().regex(new RegExp(`^${STORED_UPLOAD}$`));

/**
 * The same rule, as an HTML `pattern`.
 *
 * The media inputs use this so the browser rejects the same values the server does. A `type="url"`
 * field would not do: it demands an absolute URL, which would refuse the path an upload just
 * produced — and refuse it silently, since native validation blocks the submit before any request
 * is made.
 */
export const MEDIA_URL_PATTERN = `^(?:${HTTP_URL}|${STORED_UPLOAD})$`;

/**
 * The scheme is restricted on purpose. `z.url()` is happy with `javascript:alert(1)`, which is a
 * valid URL and a perfectly good way to store a script in a field the app later renders.
 */
export const httpUrl = z.url({ protocol: /^https?$/ });

export const mediaUrl = z.union([httpUrl, storedUploadPath]);

/** Same, but an empty string clears an optional image field. */
export const optionalMediaUrl = mediaUrl.optional().or(z.literal(""));
