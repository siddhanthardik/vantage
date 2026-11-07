export type MemberRole = "FOUNDER" | "TEAM";
export type MemberStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface TeamMemberItem {
  id: string;
  name: string;
  slug: string;
  roleType: MemberRole;
  designation: string;
  bio: string;
  photoUrl?: string | null;
  experienceYears?: string | null;
  credentials?: string | null;
  linkedInUrl?: string | null;
  email?: string | null;
  status: MemberStatus;
  displayOrder: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface TeamMemberFormData {
  name: string;
  slug: string;
  roleType: MemberRole;
  designation: string;
  bio: string;
  photoUrl: string;
  experienceYears: string;
  credentials: string;
  linkedInUrl: string;
  email: string;
  status: MemberStatus;
  displayOrder: number;
}
