import { getAdminSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { connection } from "next/server";
import { getServiceById } from "@/server/repositories/serviceRepository";
import ServiceEditor from "@/components/admin/ServiceEditor";

export default async function AdminEditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
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
