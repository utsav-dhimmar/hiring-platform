import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, HelpCircle, Loader2, ChevronRight, Calendar, XCircle } from "lucide-react";
import { adminCandidateService } from "@/apis/admin/candidate";
import type { TimelineEvent } from "@/types/candidate";

import { TimelineEventDetailModal } from "./TimelineEventDetailModal";
import { DateDisplay } from "../shared";

interface CandidateTimelineProps {
  candidateId?: string;
  jobId?: string;
  className?: string;
}

export function CandidateTimeline({ candidateId, jobId, className }: CandidateTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className={cn("w-full py-6 flex flex-col items-center justify-center min-h-[150px] gap-3", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
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
        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {events.length} Events
        </span>
      </div>
      <ScrollArea className="w-full whitespace-nowrap rounded-md border-0">
        <div className="flex w-max space-x-1 p-1">
          {events.map((event, index) => {
            const isDecision = event.event_type === "decision";
            const resultLower = event.result?.toLowerCase() || "";
            const isPassed = resultLower.includes("pass") || resultLower.includes("approve") || resultLower.includes("hired");
            const isRejected = resultLower.includes("fail") || resultLower.includes("reject");
            const isCompleted = event.result !== null && event.result !== "Ongoing" && !resultLower.includes("pending");
            const isOngoing = resultLower.includes("ongoing") || (!event.result && !isCompleted);
            const isPending = resultLower.includes("pending") || isOngoing;
            const isAfterRejection = firstRejectedIndex !== -1 && index > firstRejectedIndex;

            return (
              <React.Fragment key={index}>
                <Card
                  onClick={() => handleEventClick(event)}
                  className={cn(
                    "flex w-[180px] flex-col p-2.5 gap-1.5 shrink-0 border cursor-pointer hover:border-primary/50 transition-all",
                    isOngoing
                      ? "border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(59,130,246,0.1)] scale-[1.02]"
                      : "border-muted-foreground/10 bg-card hover:bg-muted/30",
                    isAfterRejection && "opacity-40 grayscale-[0.5]"
                  )}
                >
                  <div className="flex justify-between items-center">
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
                  </div>

                  <div className="space-y-0.5">
                    <h4 className={cn(
                      "font-black text-xs text-wrap line-clamp-1",
                      isPending ? "text-foreground" : "text-foreground/90"
                    )} title={event.title}>
                      {event.title}
                    </h4>
                    <p className={cn(
                      "text-xs font-bold uppercase tracking-tighter flex items-center gap-1",
                      isPending ? "text-foreground/70" : "text-muted-foreground"
                    )}>
                      <Calendar className="h-2.5 w-2.5" />
                      <DateDisplay date={new Date(event.event_date)} className="text-xs" />
                    </p>
                  </div>

                  <p className={cn(
                    "text-[11px] leading-tight line-clamp-2 whitespace-normal font-medium",
                    isPending ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {event.description || `No description for this ${event.event_type}.`}
                  </p>

                  {event.result && (
                    <div className="pt-1.5 border-t border-muted-foreground/10 mt-auto">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-tighter truncate",
                          isPassed ? "text-green-600" :
                            isRejected ? "text-red-600" :
                              isPending ? "text-foreground" : "text-primary"
                        )}>
                          {event.result}
                        </span>
                        {event.score !== null && event.score !== undefined && (
                          <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                            {event.score}
                          </span>
                        )}
                      </div>
                    </div>
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


