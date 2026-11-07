import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTeamMemberById } from "@/server/repositories/teamRepository";
import TeamMemberEditor from "@/components/admin/TeamMemberEditor";

interface EditProps {
  params: Promise<{ id: string }>;
}

async function EditTeamMemberLoader({ params }: EditProps) {
  const { id } = await params;
  const member = await getTeamMemberById(id);

  if (!member) {
    notFound();
  }

  return <TeamMemberEditor initialMember={member} isEditing={true} />;
}

export default function AdminEditTeamMemberPage({ params }: EditProps) {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-[#172B46]/60 bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm">
          Loading team member profile...
        </div>
      }
    >
      <EditTeamMemberLoader params={params} />
    </Suspense>
  );
}
