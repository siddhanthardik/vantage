export type ArticleCategory = "Market Updates" | "Wealth Planning" | "Tax & Legacy" | "Retirement" | string;

export type ArticleStatusType = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

export interface ArticleFaqItem {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
  isEnabled: boolean;
}

export interface ArticleRevisionItem {
  id: string;
  articleId: string;
  version: number;
  title: string;
  excerpt: string;
  content: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  primaryKeyword?: string | null;
  secondaryKeywords?: string[];
  faqs?: ArticleFaqItem[];
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
  primaryKeyword?: string | null;
  secondaryKeywords?: string[];
  faqs?: ArticleFaqItem[];
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
  primaryKeyword?: string | null;
  secondaryKeywords?: string[];
  faqs?: ArticleFaqItem[];
}
