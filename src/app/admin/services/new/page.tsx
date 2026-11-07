import { getAdminSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import ServiceEditor from "@/components/admin/ServiceEditor";

export default async function AdminNewServicePage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return <ServiceEditor isNew={true} />;
}
