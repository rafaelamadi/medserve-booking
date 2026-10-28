import { Suspense } from "react";
import { ManageBookingClientPage } from "@/pages/manage-booking";

export default function ManagePage() {
  return (
    <Suspense fallback={null}>
      <ManageBookingClientPage />
    </Suspense>
  );
}
