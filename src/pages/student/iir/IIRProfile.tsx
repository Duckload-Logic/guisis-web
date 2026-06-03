import { useEffect, useState, useMemo } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Spinner, FullScreenLoader } from "@/components/shared";
import {
  useIIRProfile,
  useUserIIR,
  useIIRDownload,
} from "@/features/iir/hooks";
import { useMe } from "@/features/users/hooks/useMe";
import type { TabId } from "@/features/iir/constants";
import { asText } from "@/features/iir/utils";
import { Edit, User, Printer, Trash } from "lucide-react";
import {
  BioCard,
  InfoContent,
  InfoNavigation,
} from "@/features/iir/components/profile";
import { usePageMetadata } from "@/context";
import { cn } from "@/lib/utils";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Download } from "lucide-react";

const ICON_SIZE = 20;

export default function IIRProfile() {
  const navigate = useNavigate();
  const { studentId, iirId: paramIirId } = useParams();
  const targetRecordId = studentId || paramIirId;

  const { data: me, isLoading: isMeLoading } = useMe({});

  const {
    data: sessionIir,
    isLoading: isSessionIirLoading,
    isFetched: isSessionIirFetched,
  } = useUserIIR(targetRecordId || me?.id || undefined);

  const finalIirId = targetRecordId || sessionIir?.id;

  const {
    data: studentData,
    isLoading: isProfileLoading,
    isError,
    error,
  } = useIIRProfile(finalIirId || "");

  useEffect(() => {
    if (localStorage.getItem("refresh_student_profile") === "true") {
      window.location.reload();
      localStorage.removeItem("refresh_student_profile");
    }
  }, []);

  const {
    generatePreview,
    downloadFromPreview,
    clearPreview,
    pdfUrl,
    isDownloading,
  } = useIIRDownload();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  useEffect(() => {
    const handleBeforePrint = () => setIsPreparingPrint(true);
    const handleAfterPrint = () => setIsPreparingPrint(false);

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  // Switch to significantNotes tab if prompted by URL
  useEffect(() => {
    if (searchParams.get("addNote") === "true") {
      setActiveTab("significantNotes");
    }
  }, [searchParams]);

  const isWaitingForMe = !targetRecordId && isMeLoading;
  const isWaitingForIirId =
    !targetRecordId &&
    !!me?.id &&
    (isSessionIirLoading || !isSessionIirFetched);
  const isWaitingForProfile = !!finalIirId && isProfileLoading;

  const isLoading = isWaitingForMe || isWaitingForIirId || isWaitingForProfile;

  const isAdmin =
    me?.roles?.some((r) => r.name.toLowerCase() === "admin") || false;
  const showSignificantNotes = isAdmin;

  const badgeIcon = useMemo(() => <User size={16} />, []);

  const headerActions = useMemo(() => {
    if (!finalIirId) return null;
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => generatePreview(finalIirId)}
          disabled={isDownloading}
          className={cn(
            "group flex h-10 w-10 items-center justify-center rounded-xl",
            "border border-emerald-500/20 p-0 transition-colors",
            "hover:bg-emerald-500/10 disabled:opacity-50",
            "disabled:hover:bg-transparent",
          )}
          title="Download PDF"
        >
          <Printer
            size={ICON_SIZE}
            className={cn(
              "text-emerald-500 transition-transform",
              "group-hover:scale-110",
            )}
          />
        </button>

        {!isAdmin && (
          <button
            onClick={() =>
              navigate(`/student/iir/form?edit=true&iirId=${finalIirId}`)
            }
            className={cn(
              "group flex h-10 w-10 items-center justify-center rounded-xl",
              "border border-primary/20 p-0 transition-colors",
              "hover:bg-primary/10",
            )}
            title="Edit IIR profile"
          >
            <Edit
              size={ICON_SIZE}
              className={cn(
                "text-primary transition-transform",
                "group-hover:scale-110",
              )}
            />
          </button>
        )}
      </div>
    );
  }, [finalIirId, isDownloading, isAdmin, navigate]);

  usePageMetadata({
    title: isAdmin ? "Individual Inventory Record" : "My IIR Profile",
    description: isAdmin
      ? "Comprehensive student record review for guidance purposes"
      : "Manage your personal guidance information and student record",
    badgeText: isAdmin ? "Admin Audit" : "Student Profile",
    badgeIcon,
    isLoading: false,
    headerActions: headerActions || undefined,
  });

  if (isLoading || isMeLoading) {
    return <IIRProfileSkeleton />;
  }

  // Handle final state where no ID can be resolved (after loading)
  if (!finalIirId && isSessionIirFetched) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border",
          "border-border bg-card p-12 text-center",
        )}
      >
        <h2 className="mb-2 text-xl font-semibold">No IIR Record Found</h2>
        <p className="mb-6 text-muted-foreground">
          You haven't filled out your Individual Inventory Record form yet.
          Please submit the form to access your profile.
        </p>
        <Link
          to="/student/iir/form"
          className={cn(
            "rounded-lg bg-primary px-6 py-2.5 font-semibold",
            "text-primary-foreground transition-colors hover:bg-primary/90",
          )}
        >
          Go to IIR Form
        </Link>
      </div>
    );
  }

  // Handle errors from the profile query
  if (isError || !studentData)
    return (
      <div
        className={cn(
          "rounded-2xl border border-border bg-card p-6",
          "text-sm text-card-foreground",
        )}
      >
        {asText(error) || "Error loading student profile data."}
      </div>
    );

  return (
    <>
      <style>{`
    .iir-print-indicator {
      display: none;
    }

    @media print {
      .iir-print-indicator {
        display: flex !important;
        position: fixed;
        top: 12px;
        right: 12px;
        z-index: 9999;
        align-items: center;
        gap: 6px;
        border: 1px solid #111827;
        border-radius: 9999px;
        background: #ffffff;
        color: #111827;
        padding: 6px 10px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
    }
  `}</style>

      <div
        className={cn(
          "iir-print-indicator",
          isPreparingPrint &&
            "fixed right-4 top-4 z-50 items-center gap-2 rounded-full border border-emerald-500/30 bg-white/90 px-3 py-2 text-[10px] font-bold uppercase text-emerald-700 shadow-lg backdrop-blur-md dark:bg-neutral-900/90 dark:text-emerald-300",
        )}
        style={{ display: isPreparingPrint ? "flex" : undefined }}
      >
        <Printer className="h-3.5 w-3.5" />
        IIR Print Copy
      </div>

      <FullScreenLoader
        isLoading={isDownloading}
        message="Generating Document..."
      />

      <div className="mt-4 flex w-full flex-col gap-8">
        <div className="grid h-full grid-cols-1 gap-4 xl:grid-cols-4">
          <BioCard data={studentData?.student} />

          <div className="flex h-full flex-col gap-0 xl:col-span-3">
            <InfoNavigation
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              showSignificantNotes={showSignificantNotes}
            />
            <InfoContent
              activeTab={activeTab}
              studentData={studentData}
              showSignificantNotes={showSignificantNotes}
              iirId={finalIirId}
            />
          </div>
        </div>
      </div>

      <ResponsiveModal
        open={!!pdfUrl}
        onOpenChange={(open) => !open && clearPreview()}
      >
        <ResponsiveModalContent
          hasCloseButton={false}
          className="flex h-[90vh] max-h-[90vh] flex-col p-0 sm:max-w-4xl"
        >
          <ResponsiveModalHeader className="h-14 px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between">
              <ResponsiveModalTitle>IIR PDF Preview</ResponsiveModalTitle>
              <button
                onClick={downloadFromPreview}
                className={cn(
                  "flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2",
                  "text-sm font-semibold text-white transition-colors hover:bg-emerald-600",
                )}
              >
                <Download size={16} />
                Download PDF
              </button>
            </div>
          </ResponsiveModalHeader>
          <div className="flex-1 overflow-hidden bg-muted/20">
            {pdfUrl && (
              <iframe
                src={`${pdfUrl}#toolbar=0`}
                className="h-full w-full rounded-b-lg border-0"
                title="PDF Preview"
              />
            )}
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>
    </>
  );
}

function IIRProfileSkeleton() {
  return (
    <div className={cn("mt-4 flex w-full animate-pulse flex-col gap-8")}>
      <div className="grid h-full grid-cols-1 gap-4 xl:grid-cols-4">
        {/* Left Side: BioCard Skeleton */}
        <div
          className={cn(
            "rounded-2xl border border-glass-border bg-glass-bg",
            "flex flex-col items-center gap-6 p-6",
          )}
        >
          <div
            className={cn(
              "h-24 w-24 rounded-full bg-neutral-200",
              "dark:bg-neutral-800",
            )}
          />
          <div className="flex w-full flex-col items-center gap-2">
            <div
              className={cn(
                "h-6 w-3/4 rounded bg-neutral-200",
                "dark:bg-neutral-800",
              )}
            />
            <div
              className={cn(
                "h-4 w-1/2 rounded bg-neutral-200",
                "dark:bg-neutral-800",
              )}
            />
          </div>
          <div
            className={cn(
              "w-full border-t border-glass-border pt-6",
              "flex flex-col gap-4",
            )}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-1.5"
              >
                <div
                  className={cn(
                    "h-3 w-1/3 rounded bg-neutral-200",
                    "dark:bg-neutral-800",
                  )}
                />
                <div
                  className={cn(
                    "h-4 w-2/3 rounded bg-neutral-200",
                    "dark:bg-neutral-800",
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Navigation & Content Skeletons */}
        <div className="flex h-full flex-col gap-4 xl:col-span-3">
          {/* Tabs Navigation Skeleton */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-10 w-28 rounded-xl bg-neutral-200",
                  "shrink-0 dark:bg-neutral-800",
                )}
              />
            ))}
          </div>

          {/* Content Card Skeleton */}
          <div
            className={cn(
              "flex-1 rounded-2xl border border-glass-border",
              "flex flex-col gap-6 bg-glass-bg p-6 sm:p-8",
            )}
          >
            <div
              className={cn(
                "h-6 w-1/4 rounded bg-neutral-200",
                "dark:bg-neutral-800",
              )}
            />
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2"
                >
                  <div
                    className={cn(
                      "h-3 w-1/4 rounded bg-neutral-200",
                      "dark:bg-neutral-800",
                    )}
                  />
                  <div
                    className={cn(
                      "h-10 w-full rounded bg-neutral-200",
                      "dark:bg-neutral-800",
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
