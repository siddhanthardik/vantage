import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getAdminSession } from "@/lib/auth/session";

export default async function AdminRootPage() {
  await connection();
  const session = await getAdminSession();
  if (session) {
    redirect("/admin/services");
  } else {
    redirect("/admin/login");
  }
}
