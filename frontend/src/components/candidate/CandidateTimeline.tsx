import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Clock, Loader2, ChevronRight, Calendar } from "lucide-react";
import { adminCandidateService } from "@/apis/admin/candidate";
import type { TimelineEvent } from "@/types/candidate";
import { TimelineEventDetailModal } from "./TimelineEventDetailModal";
import { CandidateStatusBadge, DateDisplay } from "@/components/shared";
import { useNavigate } from "react-router-dom";
import { slugify } from "@/utils/slug";


interface CandidateTimelineProps {
  candidateId?: string;
  jobId?: string;
  className?: string;
  onSelectStage?: (stageName: string) => void;
  selectedStage?: string;
  job?: any;
  candidate?: any;
}

export function CandidateTimeline({
  candidateId,
  jobId,
  className,
  onSelectStage,
  selectedStage,
  job,
  candidate
}: CandidateTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();
  useEffect(() => {
    const fetchTimeline = async () => {
      if (!candidateId) return;
      setIsLoading(true);
      try {
        const response = await adminCandidateService.getCandidateTimeline(candidateId, jobId);
        const sortedEvents = [...response.events]
        // .sort(
        //   (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        // );
        setEvents(sortedEvents);
      } catch (error) {
        console.error("Failed to fetch timeline:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeline();
  }, [candidateId, jobId]);

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    if (!event.stage_id) {
      onSelectStage?.("Resume Screening");
    } else {
      if (event.event_type === "stage" && event.title) {
        onSelectStage?.(event.title);
      } else {
        setIsModalOpen(true);
      }
    }
  };

  if (isLoading) {
    return (
      <div className={cn("w-full py-6 flex flex-col items-center justify-center min-h-[150px] gap-3", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
        <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
          Synchronizing Timeline...
        </span>
      </div>
    );
  }

  if (events.length === 0) return null;

  const firstRejectedIndex = events.findIndex(e => {
    const r = e.result?.toLowerCase() || "";
    return r.includes("fail") || r.includes("reject");
  });

  return (
    <div className={cn("w-full py-2", className)}>
      <div className="px-4 mb-2 flex justify-between items-center">
        <h3 className="text-xs font-black text-muted-foreground flex items-center gap-2">
          <Clock className="h-3 w-3" />
          Hiring Journey Timeline
        </h3>
      </div>
      <ScrollArea className="w-full whitespace-nowrap rounded-md border-0">
        <div className="flex w-max space-x-1 p-1">
          {events.map((event, index) => {
            // @ts-ignore
            const _isDecision = event.event_type === "decision";
            const resultLower = event.result?.toLowerCase() || "";

            const isCompleted = event.result !== null && event.result !== "Ongoing" && !resultLower.includes("pending");
            const isOngoing = resultLower.includes("ongoing") || (!event.result && !isCompleted);
            const isPending = resultLower.includes("pending") || isOngoing;
            const isSelected = event.title === selectedStage;
            const isAfterRejection = firstRejectedIndex !== -1 && index > firstRejectedIndex;

            return (
              <React.Fragment key={index}>
                <Card
                  onClick={() => {
                    const targetStage = event.stage_id ? (event.title || "Resume Screening") : "Resume Screening";
                    const slug = slugify(targetStage);
                    navigate(`../${slug}`, {
                      relative: "path",
                      state: { job, candidate }
                    });
                    handleEventClick(event);
                  }}
                  className={cn(
                    "flex w-[250px] flex-col p-2.5 gap-1.5 shrink-0 border cursor-pointer hover:border-primary/50 transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20 scale-[1.02]"
                      : isOngoing
                        ? "border-primary/40 bg-primary/5"
                        : "border-muted-foreground/10 bg-card hover:bg-muted/30",
                    isAfterRejection && "opacity-40 grayscale-[0.5]"
                  )}
                >
                  {/* <div className="flex justify-between items-center">
                    <div className={cn(
                      "p-1.5 rounded-lg",
                      isDecision ? "bg-purple-500/10" :
                        isPassed ? "bg-green-500/10" :
                          isRejected ? "bg-red-500/10" : "bg-primary/10"
                    )}>
                      {isDecision ? (
                        <HelpCircle className="h-3.5 w-3.5 text-purple-500" />
                      ) : isPassed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : isRejected ? (
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[8px] h-4 px-1.5 uppercase font-black tracking-tighter border-0",
                        isDecision ? "bg-purple-500 text-white" :
                          isPassed ? "bg-green-500 text-white" :
                            isRejected ? "bg-red-600 text-white" :
                              isPending ? "bg-slate-500 text-white" : "bg-primary text-white"
                      )}
                    >
                      {event.event_type}
                    </Badge>
                  </div> */}

                  <div className="space-y-0.5">
                    <h4 className={cn(
                      "font-black text-xs text-wrap line-clamp-1",
                      isSelected ? "text-primary" : isPending ? "text-foreground" : "text-foreground/90"
                    )} title={event.title}>
                      {event.title}
                    </h4>
                    <p className={cn(
                      "text-xs font-bold uppercase tracking-tighter flex items-center gap-1",
                      isPending ? "text-foreground/70" : "text-muted-foreground"
                    )}>
                      {
                        event.event_date && <>
                          <Calendar className="h-2.5 w-2.5" />
                          <DateDisplay date={new Date(event.event_date)} className="text-xs" />
                        </>
                      }
                    </p>
                  </div>
                  {/* 
                  <p className={cn(
                    "text-[11px] leading-tight line-clamp-2 whitespace-normal font-medium",
                    isPending ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {event.description || `No description for this ${event.event_type}.`}
                  </p> */}

                  {event.result && (
                    <>
                      <div className="pt-1.5 border-t border-muted-foreground/10 mt-auto">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-start gap-2">
                            <span className="text-xs font-bold uppercase tracking-tight text-muted-foreground">AI result:</span>
                            <CandidateStatusBadge status={event.ai_result?.replace("ed", "") || "N/A"} />
                          </div>
                          {<div className="flex items-center justify-start gap-2">
                            <span className="text-xs font-bold uppercase tracking-tight text-muted-foreground">HR decision:</span>
                            <CandidateStatusBadge status={event.hr_decision?.replace("ed", "") || "N/A"} />
                          </div>}
                        </div>


                        {/* <div className="flex flex-wrap items-center justify-between gap-2"> */}
                        {/* <span className={cn(
                          "text-[10px] font-black uppercase tracking-tighter truncate",
                          isPassed ? "text-green-600" :
                            isRejected ? "text-red-600" :
                              isPending ? "text-foreground" : "text-primary"
                        )}>
                          {event.result}
                        </span> */}
                        {event.score !== null && event.score !== undefined && (
                          <span className="text-xs font-bold text-muted-foreground shrink-0">
                            {event.event_type === "stage" ? "Score:" : "Percentage:"} {event.score}{event.event_type === "stage" ? "/5" : "%"}
                          </span>
                        )}
                        {/* </div> */}
                      </div>
                    </>
                  )}
                </Card>

                {index < events.length - 1 && (
                  <div className="flex items-center justify-center shrink-0 self-center">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <TimelineEventDetailModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        event={selectedEvent}
      />
    </div>
  );
}


