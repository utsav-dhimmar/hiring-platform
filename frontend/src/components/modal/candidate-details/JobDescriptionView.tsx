import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, History, AlertCircle } from "lucide-react";
import type { Job, JobVersionDetail } from "@/types/job";

/**
 * Props for {@link JobDescriptionView}.
 */
interface JobDescriptionViewProps {
  job: Job | null;
  selectedVersionData: JobVersionDetail | null;
  isLoadingVersion: boolean;
  onVersionChange: (val: string | null, eventDetails: any) => void;
  appliedVersionNumber?: number;
}

/**
 * Displays the job description for a specific version, with a version selector
 * dropdown. Highlights the version that was used for the candidate's analysis
 * and shows the latest version indicator.
 */
export function JobDescriptionView({
  job,
  selectedVersionData,
  isLoadingVersion,
  onVersionChange,
  appliedVersionNumber,
}: JobDescriptionViewProps) {
  return (
    <div className="flex h-full flex-col gap-4 p-2 sm:p-4">
      {isLoadingVersion ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
          <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-bold text-muted-foreground">
            Loading JD Version...
          </p>
        </div>
      ) : selectedVersionData ? (
        <div className="space-y-4 rounded-3xl border border-muted-foreground/5 bg-muted/30 p-4 sm:space-y-6 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3 sm:items-center">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex min-w-0 flex-col">
                <h4 className="break-words text-base font-black tracking-tight sm:text-lg">
                  {selectedVersionData.title}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <span>Version {selectedVersionData.version_number}</span>
                  <span className="h-1 w-1 bg-muted-foreground rounded-full" />
                  <span>
                    Updated{" "}
                    {new Date(
                      selectedVersionData.created_at,
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
              {appliedVersionNumber === selectedVersionData.version_number && (
                <Badge className="bg-primary/10 text-primary border-0 rounded-full font-black text-[10px] px-3 py-1">
                  VERSION USED FOR ANALYSIS
                </Badge>
              )}
              {job?.job_versions && (
                <div className="flex w-full items-center gap-2 sm:w-auto sm:ml-0">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={selectedVersionData?.id || ""}
                    onValueChange={onVersionChange}
                  >
                    <SelectTrigger className="h-9 w-full bg-background border-muted-foreground/20 rounded-xl text-xs font-bold sm:w-[140px]">
                      <SelectValue placeholder="Select Version">
                        {selectedVersionData
                          ? `Version ${selectedVersionData.version_number}`
                          : "Select Version"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-muted-foreground/10">
                      {job.job_versions.map((ver) => (
                        <SelectItem
                          key={ver.id}
                          value={ver.id}
                          className="text-xs font-medium rounded-lg"
                        >
                          Version {ver.version_num}
                          {ver.version_num === appliedVersionNumber && (
                            <span className="ml-2 text-[8px] text-primary italic font-black">
                              (Applied)
                            </span>
                          )}
                          {ver.version_num === job.version && (
                            <span className="ml-2 text-[8px] text-green-400 italic font-black">
                              (Latest)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-muted-foreground/10" />

          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium">
              {selectedVersionData.jd_text}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 grayscale opacity-40">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm font-bold">No JD version data available.</p>
        </div>
      )}
    </div>
  );
}
