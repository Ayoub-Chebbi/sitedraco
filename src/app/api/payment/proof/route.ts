import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
const ALLOWED_EXTS = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const { allowed, retryAfterMs } = await rateLimit(`proof:${ip}`, { max: 3, windowMs: 60 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429, headers: { "Retry-After": Math.ceil(retryAfterMs / 1000).toString() } });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop()?.toLowerCase() ?? "jpg") || "jpg";
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTS.includes(ext)) {
    return NextResponse.json({ error: "Format non autorisé (JPG, PNG, WebP, GIF uniquement)" }, { status: 415 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 413 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Stockage non configuré" }, { status: 500 });
  }

  const blob = await put(`payment-proofs/${randomUUID()}.${ext}`, file, {
    access: "public",
    contentType: file.type || "image/jpeg",
  });

  return NextResponse.json({ url: blob.url }, { status: 201 });
}
