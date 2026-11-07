import TeamMemberEditor from "@/components/admin/TeamMemberEditor";

export default function AdminNewTeamMemberPage() {
  return <TeamMemberEditor isEditing={false} fixedRole="TEAM" />;
}
