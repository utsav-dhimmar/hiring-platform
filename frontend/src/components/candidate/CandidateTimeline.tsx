import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock, ArrowRight } from "lucide-react";

interface TimelineStage {
  id: string;
  name: string;
  status: "completed" | "active" | "pending";
  date?: string;
  description: string;
  result?: string;
}

const DUMMY_STAGES: TimelineStage[] = [
  {
    id: "0",
    name: "Resumse Screening",
    status: "completed",
    date: new Date().toDateString(),
    description: "Initial resume analysis and HR approval.",
    result: "Passed (85%)",
  },
  {
    id: "1",
    name: "Stage 1",
    status: "completed",
    date: new Date().toDateString(),
    description: "Initial conversation with HR recruiter.",
    result: "Passed",
  },
  {
    id: "2",
    name: "Stage 2",
    status: "active",
    description: "Deep dive into technical skills and projects.",
    result: "Ongoing",
    // date: new Date().toISOString(),
  },

];

export function CandidateTimeline() {
  return (
    <div className="w-full py-4">
      <div className="px-4 mb-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Hiring Journey Timeline
        </h3>
      </div>
      <ScrollArea className="w-full whitespace-nowrap rounded-md border-0">
        <div className="flex w-max space-x-4 p-4">
          {DUMMY_STAGES.map((stage, index) => (
            <React.Fragment key={stage.id}>
              <Card
                className={cn(
                  "flex w-[170px] flex-col p-2 shrink-0 transition-all duration-300 border",
                  stage.status === "active"
                    ? "border-primary bg-primary/5 shadow-sm scale-[1.01]"
                    : "border-muted-foreground/10 bg-card"
                )}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <div className={cn(
                    "p-1 rounded-md",
                    stage.status === "completed" ? "bg-green-500/10" :
                      stage.status === "active" ? "bg-primary/10" : "bg-muted"
                  )}>
                    {stage.status === "completed" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : stage.status === "active" ? (
                      <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <Badge
                    variant={stage.status === "completed" ? "default" : "secondary"}
                    className={cn(
                      "text-[8px] h-3.5 px-1 uppercase font-black tracking-tight",
                      stage.status === "completed" && "bg-green-500 hover:bg-green-600",
                      stage.status === "active" && "bg-primary"
                    )}
                  >
                    {stage.status}
                  </Badge>
                </div>

                <div className="space-y-0 mb-1">
                  <h4 className="font-bold text-[11px] truncate leading-none" title={stage.name}>
                    {stage.name}
                  </h4>
                  {stage.date && (
                    <p className="text-[8px] text-muted-foreground font-medium uppercase tracking-tighter">
                      {stage.date}
                    </p>
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground leading-tight h-6 line-clamp-2 whitespace-normal mb-1">
                  {stage.description}
                </p>

                {stage.result && (
                  <div className="mt-auto pt-1 border-t border-muted-foreground/10">
                    <span className={cn(
                      "text-[10px] font-bold truncate block",
                      stage.status === "completed" ? "text-green-600" : "text-primary"
                    )}>
                      {stage.result}
                    </span>
                  </div>
                )}
              </Card>

              {index < DUMMY_STAGES.length - 1 && (
                <div className="flex items-center justify-center shrink-0">
                  <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
