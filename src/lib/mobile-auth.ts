import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const raw = process.env.MOBILE_JWT_SECRET ?? process.env.NEXTAUTH_SECRET;
if (!raw) throw new Error("MOBILE_JWT_SECRET or NEXTAUTH_SECRET must be set");
const JWT_SECRET: string = raw;
const EXPIRY = "30d";

export interface MobileJwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function signMobileToken(payload: MobileJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRY });
}

export function verifyMobileToken(token: string): MobileJwtPayload {
  return jwt.verify(token, JWT_SECRET) as MobileJwtPayload;
}

export async function getMobileUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const payload = verifyMobileToken(token);
    return await prisma.user.findUnique({ where: { id: payload.userId } });
  } catch {
    return null;
  }
}
