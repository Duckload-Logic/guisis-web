import { SearchInput } from "@/components/form";
import { SelectField } from "@/components/ui/select-field";

import { cn } from "@/lib/utils";

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  // Specific program props
  programs: any[];
  selectedProgramId: number;
  onProgramChange: (id: number) => void;
  // Specific gender props
  genders: any[];
  selectedGenderId: number;
  onGenderChange: (id: number) => void;
  // Specific year props
  yearLevels: any[];
  selectedYearLevelId: number;
  onYearLevelChange: (level: number) => void;
  // Status props
  statuses: any[];
  selectedStatusId: number;
  onStatusChange: (id: number) => void;
}

export default function StudentFilters({
  searchTerm,
  onSearchChange,
  programs,
  selectedProgramId,
  onProgramChange,
  genders,
  selectedGenderId,
  onGenderChange,
  yearLevels,
  selectedYearLevelId,
  onYearLevelChange,
  statuses,
  selectedStatusId,
  onStatusChange,
}: SearchFilterProps) {
  return (
    <div
      className={cn(
        "hover:bg-glass-bg/30 rounded-3xl border border-glass-border",
        "bg-glass-bg p-6 shadow-md backdrop-blur-glass transition-all",
        "duration-500",
      )}
    >
      <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-4">
        <SearchInput
          className="md:col-span-2"
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          placeholder="Search by name, email, or student number..."
        />
        <div
          className={cn(
            "grid w-full grid-cols-1 items-center justify-center gap-2",
            "md:col-span-2 md:grid-cols-3",
          )}
        >
          <SelectField
            label="Program"
            value={selectedProgramId}
            onChange={onProgramChange}
            options={[
              { id: 0, name: "All Programs" },
              ...(programs || []),
            ]}
          />
          <SelectField
            label="Gender"
            value={selectedGenderId}
            onChange={onGenderChange}
            options={[{ id: 0, name: "All Genders" }, ...(genders || [])]}
          />
          <SelectField
            label="Year Level"
            value={selectedYearLevelId}
            onChange={onYearLevelChange}
            options={[
              { id: 0, name: "All Year Levels" },
              ...(yearLevels || []),
            ]}
          />
          {/* <SelectField
            label="Status"
            value={selectedStatusId}
            onChange={onStatusChange}
            options={[{ id: 0, name: "All Statuses" }, ...(statuses || [])]}
            labelKey="name"
          /> */}
        </div>
      </div>
    </div>
  );
}
