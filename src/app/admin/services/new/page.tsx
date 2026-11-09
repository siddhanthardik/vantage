import { getAdminSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import ServiceEditor from "@/components/admin/ServiceEditor";

export default async function AdminNewServicePage() {
  await connection();
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return <ServiceEditor isNew={true} />;
}
