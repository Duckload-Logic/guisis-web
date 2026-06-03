import {
  AlertCircle,
  IdCard,
  Mail,
  Phone,
  School,
  ExternalLink,
  FileText,
} from "lucide-react";

import { ProfileFemale, ProfileMale } from "@/assets/icons";
import { asText, renderAddress } from "@/features/iir/utils";
import { StudentSection } from "../../types";
import { NOT_SPECIFIED } from "../../constants";
import QuickInfo from "./QuickInfo";
import { cn } from "@/lib/utils";

export default function BioCard({
  data,
}: {
  data: StudentSection | undefined;
}) {
  const DefaultProfileIcon =
    data?.personalInfo?.gender?.id === 1 ? ProfileMale : ProfileFemale;

  return (
    <div className="relative mt-10 flex flex-col items-center sm:mt-12">
      <div className="absolute -top-12 z-10">
        <DefaultProfileIcon
          className={cn(
            "h-24 w-24 rounded-full border-4 border-card bg-background",
            "p-1 text-muted-foreground shadow-lg",
          )}
        />
      </div>

      <div
        className={cn(
          "w-full rounded-2xl border border-glass-border bg-glass-bg",
          "px-6 pb-6 pt-16 shadow-md",
        )}
      >
        <div className="mb-6 text-center">
          <h2 className="text-xl tracking-tight text-card-foreground">
            {data?.basicInfo?.firstName}{" "}
            {data?.basicInfo?.middleName
              ? `${data.basicInfo.middleName[0]}.`
              : ""}{" "}
            {data?.basicInfo?.lastName}
          </h2>
          <span
            className={cn(
              "mt-1 inline-block rounded-lg bg-primary/10 px-3 py-2",
              "text-[10px] font-bold uppercase text-primary",
            )}
          >
            {data?.personalInfo?.course?.code || NOT_SPECIFIED}-
            {data?.personalInfo?.yearLevel || NOT_SPECIFIED}
          </span>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 border-t border-border/50 pt-6">
          <QuickInfo
            icon={IdCard}
            label="Student Number"
            value={asText(data?.personalInfo?.studentNumber)}
          />
          <QuickInfo
            icon={Mail}
            label="Email Address"
            value={asText(data?.basicInfo?.email)}
            truncate
          />
          <QuickInfo
            icon={Phone}
            label="Mobile Number"
            value={`${asText(data?.personalInfo?.mobileNumber)}`}
          />
          <QuickInfo
            icon={School}
            label="Year & Section"
            value={cn(
              asText(data?.personalInfo?.yearLevel),
              "-",
              asText(data?.personalInfo?.section),
            )}
          />
          {data?.studentCorUrl && (
            <div className="mt-2 border-t border-glass-border pt-4">
              <a
                href={`${import.meta.env.VITE_API_BASE_URL}${data.studentCorUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-3 text-xs uppercase tracking-[0.2em] text-primary transition-all hover:bg-primary/20"
              >
                <FileText size={18} />
                <span>View Student COR</span>
                <ExternalLink
                  size={14}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                />
              </a>
            </div>
          )}
        </div>
      </div>
      <div
        className={cn(
          "via-glass-bg/30 relative mt-2 w-full overflow-hidden",
          "rounded-2xl border-2 border-glass-border bg-glass-bg",
          "px-6 py-5 shadow-md",
        )}
      >
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-primary to-secondary" />
        <div className="mb-3 flex items-center gap-2">
          <AlertCircle
            size={20}
            className="text-primary"
          />
          <p
            className={cn(
              "text-[12px] uppercase tracking-[0.15em]",
              "text-muted-foreground",
            )}
          >
            Emergency Contact
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 border-l border-glass-border pl-4 sm:grid-cols-2 sm:pl-6">
          <div className="space-y-2">
            <div>
              <p className="text-sm font-bold leading-tight text-card-foreground">
                {asText(data?.personalInfo?.emergencyContact?.firstName)}{" "}
                {data?.personalInfo?.emergencyContact?.middleName
                  ? `${data.personalInfo.emergencyContact.middleName[0]}.`
                  : ""}{" "}
                {asText(data?.personalInfo?.emergencyContact?.lastName)}
              </p>
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase italic",
                  "text-primary/80",
                )}
              >
                {asText(
                  data?.personalInfo?.emergencyContact?.relationship?.name,
                )}
              </p>
            </div>

            <div className="flex flex-col">
              <span
                className={cn(
                  "text-[9px] font-bold uppercase",
                  "text-muted-foreground/70",
                )}
              >
                Contact Number
              </span>
              <span className="text-xs font-semibold text-card-foreground">
                {asText(data?.personalInfo?.emergencyContact?.contactNumber)}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span
              className={cn(
                "text-[9px] font-bold uppercase",
                "text-muted-foreground/70",
              )}
            >
              Address
            </span>
            <span className="text-xs text-card-foreground/90">
              {renderAddress(data?.personalInfo?.emergencyContact?.address)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
