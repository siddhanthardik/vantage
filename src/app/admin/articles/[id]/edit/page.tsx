import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getArticleById, getArticleRevisions } from "@/server/repositories/articleRepository";
import ArticleEditor from "@/components/admin/ArticleEditor";

export const metadata = {
  title: "Edit Article | Vantage Wealth CMS",
};

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

async function EditArticleLoader({ params }: EditArticlePageProps) {
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

export default function EditArticleAdminPage({ params }: EditArticlePageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-[#172B46]/60 bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm">
          Loading article editor...
        </div>
      }
    >
      <EditArticleLoader params={params} />
    </Suspense>
  );
}
