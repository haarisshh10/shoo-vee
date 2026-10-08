import { createFileRoute } from "@tanstack/react-router";
import { getRequest } from "@tanstack/react-start/server";
import { createError } from "evlog";

import { auth } from "#/lib/auth/auth.ts";
import { db } from "#/lib/db/index.ts";
import { media } from "#/lib/db/schema/index.ts";
import { useLogger } from "#/lib/logger.server.ts";
import {
  MAX_UPLOAD_BYTES,
  buildStorageKey,
  describeUploadError,
  readImageDimensions,
  sniffImageType,
} from "#/lib/uploads/sniff.ts";
import { getStorage } from "#/lib/uploads/storage.ts";

/**
 * Accepts one image upload as multipart form data.
 *
 * This is a route handler rather than a server function because the body is a file: a base64 JSON
 * payload would cost a third more in memory and in transit, and a server function's argument has to
 * survive a round trip through JSON, which a binary does not.
 *
 * The rules the upload path enforces, in order: there is a session; the body is within the size
 * limit; the bytes are an image we recognise; and the bytes do not still carry camera data. Nothing
 * about the request — the filename, the declared type, the form field names — is taken on trust, and
 * the key that is stored is generated here rather than chosen by the caller.
 */
export const Route = createFileRoute("/api/uploads")({
  server: {
    handlers: {
      POST: async () => {
        const log = useLogger();
        log.set({ action: "upload" });

        const session = await auth.api.getSession({
          headers: getRequest().headers,
          query: { disableCookieCache: true },
        });
        if (!session) {
          log.set({ upload: { outcome: "rejected", reason: "unauthorized" } });
          throw createError({
            message: "Not authorized",
            status: 401,
            why: "Uploads require a signed-in account",
            fix: "Sign in and try again",
          });
        }

        const form = await getRequest().formData();
        const file = form.get("file");
        if (!(file instanceof File)) {
          log.set({ upload: { outcome: "rejected", reason: "no-file" } });
          throw createError({
            message: "No file was uploaded",
            status: 400,
            why: "The multipart body has no `file` part",
            fix: "Attach an image to the upload field",
          });
        }

        if (file.size > MAX_UPLOAD_BYTES) {
          log.set({
            upload: { outcome: "rejected", reason: "too-large", bytes: file.size },
          });
          throw createError({
            message: "That image is too large",
            status: 413,
            why: `Uploads are capped at ${MAX_UPLOAD_BYTES} bytes; received ${file.size}`,
            fix: "Upload a smaller image, or crop it first",
          });
        }

        const bytes = new Uint8Array(await file.arrayBuffer());

        const problem = describeUploadError(bytes);
        if (problem) {
          log.set({ upload: { outcome: "rejected", reason: "unsupported", bytes: bytes.length } });
          throw createError({
            message: problem,
            status: 415,
            why: "The bytes are not an image type we store, or still carry Exif metadata",
            fix: "Upload a JPEG, PNG, WebP or AVIF image",
          });
        }

        // `describeUploadError` already proved this is set, so the extension is ours, not the caller's.
        const type = sniffImageType(bytes)!;
        const key = buildStorageKey(type.extension);

        await getStorage().put(key, bytes);

        const size = readImageDimensions(bytes);
        const [row] = await db
          .insert(media)
          .values({
            ownerId: session.user.id,
            storageKey: key,
            mimeType: type.mimeType,
            kind: type.kind,
            byteSize: bytes.length,
            width: size?.width ?? null,
            height: size?.height ?? null,
          })
          .returning();

        log.set({
          user: { id: session.user.id },
          upload: {
            outcome: "completed",
            bytes: bytes.length,
            kind: type.kind,
            dimensions: size ?? null,
          },
        });

        return Response.json({
          id: row.id,
          url: `/uploads/${key}`,
          mimeType: row.mimeType,
          kind: row.kind,
          byteSize: row.byteSize,
          width: row.width,
          height: row.height,
        });
      },
    },
  },
});
