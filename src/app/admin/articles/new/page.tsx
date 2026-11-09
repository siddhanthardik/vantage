import ArticleEditor from "@/components/admin/ArticleEditor";

export const metadata = {
  title: "Create Article | Vantage Wealth CMS",
};

export default function NewArticleAdminPage() {
  return <ArticleEditor isEditing={false} />;
}
