/**
 * Significant Notes component for IIR Profile
 * Only visible to Admin and Counselor roles
 */

import { useEffect, useState, useMemo } from "react";
import { Plus, ExternalLink } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared";
import { useStudentNotes, useCreateNote } from "../hooks/useNotes";
import { SignificantNoteFormData } from "../validation/noteSchema";
import AddNoteModal from "./AddNoteModal";
import { formatDate } from "@/utils/dateTime";
import CardBlock from "@/features/iir/components/profile/CardBlock";
import EmptyState from "@/features/iir/components/profile/EmptyState";
import InfoItem from "@/features/iir/components/profile/InfoItem";
import SectionTitle from "@/features/iir/components/profile/SectionTitle";
import { NOT_SPECIFIED } from "@/features/iir/constants";
import { Spinner } from "@/components/shared";
import { useToast } from "@/context";
import { cn } from "@/lib/utils";

interface SignificantNotesProps {
  iirId: string;
}

export default function SignificantNotes({ iirId }: SignificantNotesProps) {
  const { triggerToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeAppointmentId, setActiveAppointmentId] = useState<
    string | undefined
  >();
  const [activeAdmissionSlipId, setActiveAdmissionSlipId] = useState<
    string | undefined
  >();

  // Check for query parameters to trigger modal
  const shouldOpenModal = searchParams.get("addNote") === "true";

  useEffect(() => {
    if (shouldOpenModal) {
      const apptId = searchParams.get("appointmentId") || undefined;
      const slipId = searchParams.get("admissionSlipId") || undefined;
      setActiveAppointmentId(apptId);
      setActiveAdmissionSlipId(slipId);
      setIsModalOpen(true);

      // Clean up URL parameters after opening
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("addNote");
      newParams.delete("appointmentId");
      newParams.delete("admissionSlipId");
      setSearchParams(newParams, { replace: true });
    }
  }, [shouldOpenModal, searchParams, setSearchParams]);

  const { data: notes, isLoading, isError } = useStudentNotes(iirId);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil((notes?.length ?? 0) / itemsPerPage);

  const paginatedNotes = useMemo(() => {
    if (!notes) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return notes.slice(startIndex, startIndex + itemsPerPage);
  }, [notes, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const createNoteMutation = useCreateNote(
    iirId,
    () => {
      setIsModalOpen(false);
      triggerToast("✓ Note saved successfully!");
    },
    (error) => {
      const errorMessage =
        error?.response?.data?.error ||
        "Failed to save note. Please try again.";
      triggerToast(errorMessage);
    },
  );

  const handleSubmit = async (data: SignificantNoteFormData) => {
    await createNoteMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-card-foreground">
        Error loading significant notes.
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="flex items-center justify-between">
        <SectionTitle title="Significant Notes / Incidents" />
        <Button
          onClick={() => {
            setActiveAppointmentId(undefined);
            setActiveAdmissionSlipId(undefined);
            setIsModalOpen(true);
          }}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add Note
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {paginatedNotes.length > 0 ? (
          paginatedNotes.map((note) => (
            <CardBlock key={note.id}>
              <div
                className={cn(
                  "flex items-center justify-between",
                  "border-b border-border/50 pb-2 mb-3",
                )}
              >
                <span
                  className={cn(
                    "text-xs font-bold uppercase",
                    "tracking-wider text-primary",
                  )}
                >
                  {note.admissionSlipId
                    ? "Admission Slip Note"
                    : note.appointmentId
                      ? "Appointment Note"
                      : "General Note"}
                </span>
                {(note.admissionSlipId || note.appointmentId) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 border-0 bg-transparent text-muted-foreground",
                      "hover:bg-muted hover:text-foreground",
                    )}
                    asChild
                  >
                    <Link
                      to={
                        note.admissionSlipId
                          ? `/admin/slips/${note.admissionSlipId}`
                          : `/admin/appointments/${note.appointmentId}`
                      }
                      title={
                        note.admissionSlipId
                          ? "View Related Excuse Slip"
                          : "View Related Appointment"
                      }
                    >
                      <ExternalLink size={16} />
                    </Link>
                  </Button>
                )}
              </div>
              <div className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoItem
                  label="Created"
                  value={
                    note.createdAt
                      ? formatDate(note.createdAt)
                      : NOT_SPECIFIED
                  }
                />
                <InfoItem
                  label="Updated"
                  value={
                    note.updatedAt
                      ? formatDate(note.updatedAt)
                      : NOT_SPECIFIED
                  }
                />
              </div>
              <div className="space-y-3 border-t border-border pt-3">
                <InfoItem
                  label="Note / Incident"
                  value={note.note || NOT_SPECIFIED}
                />
                <InfoItem
                  label="Action Taken / Remarks"
                  value={note.remarks || NOT_SPECIFIED}
                />
              </div>
            </CardBlock>
          ))
        ) : (
          <EmptyState label="No significant notes recorded" />
        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          showPageInfo={true}
        />
      )}

      <AddNoteModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActiveAppointmentId(undefined);
          setActiveAdmissionSlipId(undefined);
        }}
        onSubmit={handleSubmit}
        isSubmitting={createNoteMutation.isPending}
        appointmentId={activeAppointmentId}
        admissionSlipId={activeAdmissionSlipId}
      />
    </div>
  );
}
