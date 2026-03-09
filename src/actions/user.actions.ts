// src/actions/user.actions.ts
"use server";
import { getCurrentUser } from "@/lib/session";

export async function getAuthenticatedUserId() {
  const session = await getCurrentUser();
  if (!session) {
    throw new Error("Not authenticated");
  }
  return session.userId;
}
