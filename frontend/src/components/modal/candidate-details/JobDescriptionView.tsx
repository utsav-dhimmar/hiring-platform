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
    <div className="h-full flex flex-col gap-4 p-4">
      {isLoadingVersion ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
          <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-bold text-muted-foreground">
            Loading JD Version...
          </p>
        </div>
      ) : selectedVersionData ? (
        <div className="bg-muted/30 rounded-3xl p-6 border border-muted-foreground/5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <h4 className="text-lg font-black tracking-tight">
                  {selectedVersionData.title}
                </h4>
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
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

            <div className="flex items-center gap-2">
              {appliedVersionNumber === selectedVersionData.version_number && (
                <Badge className="bg-primary/10 text-primary border-0 rounded-full font-black text-[10px] px-3 py-1">
                  VERSION USED FOR ANALYSIS
                </Badge>
              )}
              {job?.job_versions && (
                <div className="flex items-center gap-2 ml-4">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={selectedVersionData?.id || ""}
                    onValueChange={onVersionChange}
                  >
                    <SelectTrigger className="w-[140px] h-9 bg-background border-muted-foreground/20 rounded-xl text-xs font-bold">
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
