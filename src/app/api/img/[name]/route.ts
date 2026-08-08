import { NextRequest } from "next/server";
import path from "path";
import fs from "fs";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

// Sirve las fotos de productos guardadas en data/uploads
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!/^[a-zA-Z0-9._-]+$/.test(name) || name.includes("..")) {
    return new Response("Nombre inválido", { status: 400 });
  }
  const type = TYPES[path.extname(name).toLowerCase()];
  if (!type) return new Response("Tipo inválido", { status: 400 });

  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "data", "uploads", name));
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("No encontrada", { status: 404 });
  }
}
