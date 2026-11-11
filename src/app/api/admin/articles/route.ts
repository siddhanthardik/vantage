import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { getAllArticles, createArticle, revalidateArticleCache } from "@/server/repositories/articleRepository";
import { logAuditEvent } from "@/lib/security/audit";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.toLowerCase();
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");

  let articles = await getAllArticles();

  if (search) {
    articles = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(search) ||
        a.excerpt.toLowerCase().includes(search) ||
        a.slug.toLowerCase().includes(search)
    );
  }

  if (status && status !== "ALL") {
    articles = articles.filter((a) => a.status === status);
  }

  if (category && category !== "ALL") {
    articles = articles.filter((a) => a.category === category);
  }

  return NextResponse.json({ articles });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const body = await req.json();

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: "Article title is required." }, { status: 400 });
    }
    if (!body.slug || !body.slug.trim()) {
      return NextResponse.json({ error: "Article slug is required." }, { status: 400 });
    }
    if (!body.excerpt || !body.excerpt.trim()) {
      return NextResponse.json({ error: "Article excerpt is required." }, { status: 400 });
    }
    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ error: "Article body content is required." }, { status: 400 });
    }

    const created = await createArticle(body, auth.session.email);
    await revalidateArticleCache(created.slug);

    await logAuditEvent({
      action: "ARTICLE_CREATED",
      entityType: "ARTICLE",
      entityId: created.id,
      userEmail: auth.session.email,
      ipAddress: ip,
      details: {
        title: created.title,
        slug: created.slug,
        status: created.status,
      },
    });

    return NextResponse.json({ success: true, article: created }, { status: 201 });
  } catch (error: any) {
    console.error("Create article failed:", error);
    return NextResponse.json({ error: error.message || "Failed to create article" }, { status: 400 });
  }
}
