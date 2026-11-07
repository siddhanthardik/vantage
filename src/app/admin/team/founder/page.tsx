import { Suspense } from "react";
import { getFounderProfile } from "@/server/repositories/teamRepository";
import TeamMemberEditor from "@/components/admin/TeamMemberEditor";

async function FounderEditorLoader() {
  const founder = await getFounderProfile();

  return (
    <TeamMemberEditor
      initialMember={founder || undefined}
      isEditing={!!founder}
      fixedRole="FOUNDER"
    />
  );
}

export default function AdminFounderEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-[#172B46]/60 bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm">
          Loading founder profile...
        </div>
      }
    >
      <FounderEditorLoader />
    </Suspense>
  );
}
