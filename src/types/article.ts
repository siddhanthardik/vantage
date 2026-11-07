export type ArticleCategory = "Market Updates" | "Wealth Planning" | "Tax & Legacy" | "Retirement" | string;

export type ArticleStatusType = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

export interface ArticleRevisionItem {
  id: string;
  articleId: string;
  version: number;
  title: string;
  excerpt: string;
  content: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  authorEmail?: string | null;
  createdAt: string;
}

export interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: ArticleCategory;
  tags?: string[];
  readTime: string;
  coverImage?: string | null;
  ogImage?: string | null;
  authorName: string;
  isFeatured: boolean;
  status: ArticleStatusType;
  publishedAt: string;
  scheduledFor?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  revisions?: ArticleRevisionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ArticleFormData {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags?: string[];
  readTime?: string;
  coverImage?: string | null;
  ogImage?: string | null;
  authorName?: string;
  isFeatured?: boolean;
  status: ArticleStatusType;
  scheduledFor?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}
