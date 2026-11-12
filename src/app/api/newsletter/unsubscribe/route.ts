import { NextRequest, NextResponse } from "next/server";
import { unsubscribeNewsletterByToken } from "@/server/repositories/newsletterRepository";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing unsubscribe token." }, { status: 400 });
  }

  try {
    const result = await unsubscribeNewsletterByToken(token);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unsubscribe failed." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body.token;

    if (!token) {
      return NextResponse.json({ error: "Missing unsubscribe token." }, { status: 400 });
    }

    const result = await unsubscribeNewsletterByToken(token);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unsubscribe failed." }, { status: 500 });
  }
}
