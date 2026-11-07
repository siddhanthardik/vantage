import { NextResponse } from "next/server";
import { getAdminSession, AdminSession } from "./session";

/**
 * Verify administrator session for API route handlers
 * Returns session if valid, or a 401 NextResponse if unauthorized
 */
export async function requireAdminAuth(): Promise<{ session: AdminSession } | { errorResponse: NextResponse }> {
  const session = await getAdminSession();

  if (!session || !session.isAuthenticated) {
    return {
      errorResponse: NextResponse.json(
        { error: "Unauthorized. Valid administrator session required." },
        { status: 401 }
      ),
    };
  }

  return { session };
}
