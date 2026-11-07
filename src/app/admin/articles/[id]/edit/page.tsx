import { getAdminSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { getArticleById, getArticleRevisions } from "@/server/repositories/articleRepository";
import ArticleEditor from "@/components/admin/ArticleEditor";

export const metadata = {
  title: "Edit Article | Vantage Wealth CMS",
};

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticleAdminPage({ params }: EditArticlePageProps) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const [article, revisions] = await Promise.all([
    getArticleById(id),
    getArticleRevisions(id),
  ]);

  if (!article) {
    notFound();
  }

  const articleWithRevisions = {
    ...article,
    revisions,
  };

  return <ArticleEditor initialArticle={articleWithRevisions} isEditing={true} />;
}
