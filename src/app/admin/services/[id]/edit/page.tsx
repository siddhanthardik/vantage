import { getAdminSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { getServiceById } from "@/server/repositories/serviceRepository";
import ServiceEditor from "@/components/admin/ServiceEditor";

export default async function AdminEditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const service = await getServiceById(id);

  if (!service) {
    notFound();
  }

  return <ServiceEditor initialData={service} isNew={false} />;
}
