import { ENV } from "varlock/env";

/**
 * Whether the public origin points at a developer machine.
 *
 * Compares the hostname instead of substring-matching the whole URL, so staging hosts that
 * merely embed "localhost" (`localhost.shovee-staging.com`) are not mistaken for local ones.
 * `.localhost` subdomains are local per RFC 6761.
 *
 * Only use this to decide what to *show* in the UI. It must never gate access to server-side
 * capabilities, because `VITE_BASE_URL` is inlined into the client bundle and easy to misconfigure.
 */
export function isLocalOrigin(origin: string = ENV.VITE_BASE_URL): boolean {
  const { hostname } = new URL(origin);
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".localhost")
  );
}
