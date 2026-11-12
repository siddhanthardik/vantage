import { NextRequest, NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  await clearAdminSession();

  // If the request explicitly requests JSON (e.g. AJAX / fetch)
  const isJson = req.headers.get("accept")?.includes("application/json");
  if (isJson) {
    return NextResponse.json({ success: true, redirect: "/" });
  }

  // Redirect standard browser form submissions directly to the home page
  return NextResponse.redirect(new URL("/", req.url), 303);
}

export async function GET(req: NextRequest) {
  await clearAdminSession();
  return NextResponse.redirect(new URL("/", req.url), 303);
}
