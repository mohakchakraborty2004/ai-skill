// lib/jwt.ts
import { SignJWT, jwtVerify } from "jose";

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

export async function signToken(payload: any, expiresIn: string) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    return null; // Token is expired or invalid
  }
}