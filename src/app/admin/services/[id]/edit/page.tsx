import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getServiceById } from "@/server/repositories/serviceRepository";
import ServiceEditor from "@/components/admin/ServiceEditor";

export const metadata = {
  title: "Edit Service | Vantage Wealth CMS",
};

interface EditServicePageProps {
  params: Promise<{ id: string }>;
}

async function EditServiceLoader({ params }: EditServicePageProps) {
  const { id } = await params;
  const service = await getServiceById(id);

  if (!service) {
    notFound();
  }

  return <ServiceEditor initialData={service} isNew={false} />;
}

export default function AdminEditServicePage({ params }: EditServicePageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-[#172B46]/60 bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm">
          Loading service editor...
        </div>
      }
    >
      <EditServiceLoader params={params} />
    </Suspense>
  );
}
