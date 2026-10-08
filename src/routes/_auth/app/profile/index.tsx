import { createFileRoute, Link } from "@tanstack/react-router";

import { buttonVariants } from "#/components/ui/button.tsx";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/profile/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuthSuspense();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">Signed in as {user?.name}.</p>
      </div>
      <div>
        <Link to="/app/profile/creator" className={buttonVariants()}>
          Edit creator profile
        </Link>
      </div>
    </div>
  );
}
