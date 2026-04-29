import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, ArrowRight, HelpCircle, Loader2 } from "lucide-react";
import { adminCandidateService } from "@/apis/admin/candidate";
import type { TimelineEvent } from "@/types/candidate";
import { format } from "date-fns";
import { TimelineEventDetailModal } from "./TimelineEventDetailModal";

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
        // Sort events by date descending(latest first) or ascending ?
        //   Usually timeline is chronological(ascending)
        const sortedEvents = [...response.events].sort((a, b) =>
          new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        );
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
      <div className={cn("w-full py-4 flex items-center justify-center min-h-[120px]", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm font-medium text-muted-foreground uppercase tracking-widest">Loading Journey...</span>
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="px-4 mb-4 flex justify-between items-center">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <Clock className="h-3 w-3" />
          Hiring Journey Timeline
        </h3>
        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {events.length} Events
        </span>
      </div>
      <ScrollArea className="w-full whitespace-nowrap rounded-md border-0">
        <div className="flex w-max space-x-4 p-4">
          {events.map((event, index) => {
            const isCompleted = event.result !== null && event.result !== "Ongoing";
            const isDecision = event.event_type === "decision";
            const date = new Date(event.event_date);

            return (
              <React.Fragment key={index}>
                <Card
                  onClick={() => handleEventClick(event)}
                  className={cn(
                    "flex w-[180px] flex-col p-3 shrink-0 transition-all duration-300 border cursor-pointer group active:scale-95",
                    !isCompleted
                      ? "border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.1)] scale-[1.02]"
                      : "border-muted-foreground/10 bg-card hover:border-primary/30 hover:bg-muted/30"
                  )}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className={cn(
                      "p-1.5 rounded-lg",
                      isDecision ? "bg-purple-500/10" :
                        isCompleted ? "bg-green-500/10" : "bg-primary/10"
                    )}>
                      {isDecision ? (
                        <HelpCircle className="h-3.5 w-3.5 text-purple-500" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[8px] h-4 px-1.5 uppercase font-black tracking-tighter border-0",
                        isDecision ? "bg-purple-500 text-white" :
                          isCompleted ? "bg-green-500 text-white" : "bg-primary text-white"
                      )}
                    >
                      {event.event_type}
                    </Badge>
                  </div>

                  <div className="space-y-0.5 mb-2">
                    <h4 className="font-black text-[11px] truncate leading-tight uppercase tracking-tight group-hover:text-primary transition-colors" title={event.title}>
                      {event.title}
                    </h4>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      {format(date, "MMM dd, yyyy")}
                    </p>
                  </div>

                  <p className="text-[10px] text-muted-foreground leading-snug h-8 line-clamp-2 whitespace-normal mb-2 font-medium">
                    {event.description || `No description for this ${event.event_type}.`}
                  </p>

                  {event.result && (
                    <div className="mt-auto pt-2 border-t border-muted-foreground/10">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-tighter truncate",
                          isCompleted ? "text-green-600" : "text-primary"
                        )}>
                          {event.result}
                        </span>
                        {event.score !== null && event.score !== undefined && (
                          <span className="text-[9px] font-bold text-muted-foreground">
                            {Math.round(event.score * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Card>

                {index < events.length - 1 && (
                  <div className="flex items-center justify-center shrink-0">
                    <ArrowRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary/30 transition-colors" />
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

// Helper to keep icons consistent
function Calendar({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
