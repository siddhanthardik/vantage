import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";

export default async function AdminRootPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin/services");
  } else {
    redirect("/admin/login");
  }
}
