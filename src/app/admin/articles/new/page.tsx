import { getAdminSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import ArticleEditor from "@/components/admin/ArticleEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create Article | Vantage Wealth CMS",
};

export default async function NewArticleAdminPage() {
  await connection();
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return <ArticleEditor isEditing={false} />;
}
