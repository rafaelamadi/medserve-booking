import { Suspense } from "react";
import { HubAuthScreen } from "./_components/hub-auth-screen";

export default function HubLoginPage() {
  return (
    <Suspense fallback={<div className="flex h-dvh items-center justify-center bg-background" />}>
      <HubAuthScreen />
    </Suspense>
  );
}
