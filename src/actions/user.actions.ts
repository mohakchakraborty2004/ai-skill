// src/actions/user.actions.ts
"use server";
import prisma from "@/lib/prisma";

export async function getOrCreateTestUser() {
  const user = await prisma.user.upsert({
    where: { email: "test@zynvo.com" },
    update: {},
    create: {
      email: "test@zynvo.com",
      name: "Test User",
    },
  });
  return user.id;
}