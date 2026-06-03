import { useMe } from "@/features/users/hooks/useMe";
import SignificantNotes from "@/features/notes/components/SignificantNotes";
import EmptyState from "./EmptyState";

export default function NotesView({
  data,
  iirId,
}: {
  data: any;
  iirId?: string;
}) {
  const { data: me } = useMe({});
  const resolvedId = iirId;

  // Check if user has authorized role
  const roles = me?.roles?.map(r => r.name.toLowerCase()) || [];
  const isAuthorized = roles.includes("admin") || roles.includes("counselor");

  // Don't render for unauthorized users
  if (!isAuthorized) {
    return null;
  }

  // Don't render if no IIR ID
  if (!resolvedId) {
    return (
      <div className="animate-in fade-in space-y-6 duration-500">
        <EmptyState label="No student ID found" />
      </div>
    );
  }

  return (
    <>
      <SignificantNotes iirId={resolvedId} />
    </>
  );
}
