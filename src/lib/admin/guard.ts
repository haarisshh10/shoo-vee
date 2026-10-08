import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";

import { authQueryOptions } from "#/lib/auth/queries.ts";

/**
 * `beforeLoad` guard for the admin console.
 *
 * Keeps signed-out and non-admin visitors out before any admin query runs, so they get a redirect
 * instead of waiting out react-query's retries. This is UX only — every admin server function
 * re-reads the user row and re-checks the role, which is the actual enforcement.
 */
export async function requireAdminRoute({ context }: { context: { queryClient: QueryClient } }) {
  const { queryClient } = context;
  const user = await queryClient.query({ ...authQueryOptions(), staleTime: "static" });
  void queryClient.query(authQueryOptions());

  if (!user) throw redirect({ to: "/login" });
  if (user.role !== "admin") throw redirect({ to: "/app" });
}
