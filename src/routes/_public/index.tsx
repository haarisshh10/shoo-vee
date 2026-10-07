import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "#/components/ui/button.tsx";

export const Route = createFileRoute("/_public/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Create. Capture. Sell.</h1>
      <p className="max-w-xl text-muted-foreground">
        Sho-vee connects photographers, videographers, editors and creators in Mumbai with the
        people who need them. Show your work, get discovered, get booked.
      </p>
      <div className="flex gap-3">
        <Button render={<Link to="/discover" />} nativeButton={false}>
          Discover creators
        </Button>
        <Button render={<Link to="/shots" />} variant="outline" nativeButton={false}>
          Browse shots
        </Button>
      </div>
    </div>
  );
}
