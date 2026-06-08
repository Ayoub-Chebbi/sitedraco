import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  const { allowed } = await rateLimit(`forgot-pwd:${ip}`, { max: 10, windowMs: 60 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ success: true }); // silent — don't reveal rate limiting

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });

  // Rate limit: max 3 reset requests per email per 15 minutes
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const recentCount = await prisma.passwordResetToken.count({
    where: { email, createdAt: { gte: since } },
  });
  if (recentCount >= 3) {
    // Return success to avoid timing oracle — email enumeration already prevented
    return NextResponse.json({ success: true });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) return NextResponse.json({ success: true });

  await prisma.passwordResetToken.deleteMany({ where: { email } });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({ data: { email, token, expiresAt } });

  const resetUrl = `${process.env.SITE_URL ?? process.env.NEXTAUTH_URL ?? "https://loot.tn"}/reinitialiser-mot-de-passe?token=${token}`;

  // Always return success — never leak whether the email exists or the send failed
  sendPasswordResetEmail(email, resetUrl).catch((err) =>
    console.error("Password reset email failed:", err)
  );

  return NextResponse.json({ success: true });
}
