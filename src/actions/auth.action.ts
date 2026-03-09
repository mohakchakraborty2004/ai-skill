// app/actions/auth.ts
'use server'

import { cookies } from "next/headers";
import { signToken } from "@/lib/jwt";
import prisma from "@/lib/prisma"; // Adjust this import based on your setup
import bcrypt from "bcrypt"; // npm install bcrypt @types/bcrypt

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 1. Find the user in Prisma
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  // 2. Verify the hashed password
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid credentials");
  }

  // 3. Generate Tokens
  const sessionId = crypto.randomUUID(); 
  const accessToken = await signToken({ userId: user.id, sessionId }, "15m");
  const refreshToken = await signToken({ userId: user.id, sessionId }, "7d");

  // 4. Store the session in Prisma
  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      refreshToken: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    }
  });

  // 5. Set Secure Cookies
  const cookieStore = await cookies();

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 minutes
  });

  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return { success: true };
}


  export async function Signup(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("Email already in use");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      }
    });

    // Automatically log in the user after signup
    const sessionId = crypto.randomUUID(); 
    const accessToken = await signToken({ userId: user.id, sessionId }, "15m");
    const refreshToken = await signToken({ userId: user.id, sessionId }, "7d");

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      }
    }); 

  // 5. Set Secure Cookies
  const cookieStore = await cookies();
  
  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 minutes
  });

  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return { success: true };
}


export async function logout() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;


  if (refreshToken) {
    try {
      await prisma.session.delete({
        where: { refreshToken }
      });
    } catch (error) {
      console.error("Session already invalidated or not found");
    }
  }

  // 2. Clear cookies
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
}