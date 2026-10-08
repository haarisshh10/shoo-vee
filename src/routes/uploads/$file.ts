import { createFileRoute } from "@tanstack/react-router";
import { createError } from "evlog";

import { useLogger } from "#/lib/logger.server.ts";
import { assertUsableKey, contentTypeForKey, getStorage } from "#/lib/uploads/storage.ts";

/**
 * Serves stored uploads.
 *
 * Files live outside `public/` because a production build snapshots that directory at build time, so
 * anything written there at runtime would 404. Reading them through a route also means the key is
 * checked against the shape we generate before it ever reaches the filesystem.
 *
 * Uploads are served with `nosniff` and never as markup: an uploaded file is an image, and the one
 * thing this endpoint must never do is let a browser interpret an upload as a document.
 */
export const Route = createFileRoute("/uploads/$file")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const log = useLogger();
        const key = params.file;

        const contentType = contentTypeForKey(key);
        if (!contentType) {
          throw createError({
            message: "Not found",
            status: 404,
            why: `No stored file type matches "${key}"`,
            fix: "Check the upload key",
          });
        }

        try {
          assertUsableKey(key);
          const stream = await getStorage().getStream(key);
          return new Response(stream, {
            headers: {
              "Content-Type": contentType,
              // Without this, a browser may honour a file's own declared type over ours.
              "X-Content-Type-Options": "nosniff",
              "Cache-Control": "public, max-age=31536000, immutable",
              // Uploaded bytes must never run as page content, even if sniffing changes someday.
              "Content-Disposition": "inline",
            },
          });
        } catch {
          log.set({ upload: { outcome: "not-found", key } });
          throw createError({
            message: "Not found",
            status: 404,
            why: "No stored file matches that key",
            fix: "The upload may have been removed",
          });
        }
      },
    },
  },
});
