import { usePageMetadata } from "@/context";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaceholderProps {
  title: string;
  description?: string;
  isLoading?: boolean;
}

export default function Placeholder({
  title,
  description,
  isLoading = false,
}: PlaceholderProps) {
  usePageMetadata({
    title,
    isLoading,
  });

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow md:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-block rounded-lg bg-blue-100 p-4">
            <AlertCircle
              size={32}
              className="text-blue-600"
            />
          </div>
          <h2 className="mb-4 text-2xl font-bold text-foreground">
            Coming Soon
          </h2>
          <p className="mb-6 text-gray-600">
            {description ||
              "This section is being developed. Please check back soon."}
          </p>
          <p className="mb-8 text-sm text-gray-500">
            This page is ready for implementation. Continue chatting with the
            assistant to request the specific features and functionality you
            need for this section.
          </p>
          <button
            className={cn(
              "inline-block rounded-lg bg-primary px-6 py-3 font-medium",
              "text-primary-foreground transition-colors hover:bg-primary/90",
            )}
          >
            Request This Feature
          </button>
        </div>
      </div>
    </>
  );
}
