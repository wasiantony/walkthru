import { connection } from "next/server";
import { prisma } from "@/lib/db";

// Used by the Docker health check. Reports unhealthy if Postgres is unreachable.
export async function GET() {
  await connection();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "database unreachable" }, { status: 503 });
  }
}
