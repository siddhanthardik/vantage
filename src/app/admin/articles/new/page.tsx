import { getAdminSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import ArticleEditor from "@/components/admin/ArticleEditor";

export const metadata = {
  title: "Create Article | Vantage Wealth CMS",
};

export default async function NewArticleAdminPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return <ArticleEditor isEditing={false} />;
}
