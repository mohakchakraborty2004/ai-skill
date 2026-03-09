// lib/session.ts
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;


  if (!token) {
    return null;
  }


  const payload = await verifyToken(token);


  if (!payload) {
    return null; 
  }


  return {
    userId: payload.userId as string,
    sessionId: payload.sessionId as string,
  };
}