"use server";

import { getStaffSession } from "@/shared/lib/auth";
import { getAttentionNotifications } from "./queue";

/** Attention panel rows for the staff member's scope. */
export async function getAttentionItemsScoped() {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  return getAttentionNotifications(s.role === "SUPER_ADMIN" ? null : s.centreIds);
}
