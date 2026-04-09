import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components";
import { DateDisplay } from "@/components/shared";
import type { Job } from "@/types/job";
import { Users, Clock, Calendar } from "lucide-react";

interface JobActivityModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

export function JobActivityModal({ isOpen, onOpenChange, job }: JobActivityModalProps) {
  if (!job) return null;

  const sessions = job.activity_sessions || [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-hidden overflow-x-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl">Activity Sessions</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Detailed activation history for <span className="font-semibold text-foreground">{job.title}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="app-surface-card p-3 flex flex-col items-center justify-center text-center bg-primary/5 border-primary/10">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Candidates</span>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{job.total_candidates || 0}</span>
              </div>
            </div>
            <div className="app-surface-card p-3 flex flex-col items-center justify-center text-center bg-blue-500/5 border-blue-500/10">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Sessions</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{sessions.length}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Candidates</TableHead>
                  <TableHead className="w-[100px] text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                      No activity sessions found for this job.
                    </TableCell>
                  </TableRow>
                ) : (
                  [...sessions].reverse().map((session) => (
                    <TableRow key={session.session_id} className={session.is_current ? "bg-primary/5" : ""}>
                      <TableCell className="font-medium">#{session.session_id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-sm">
                            <span className="text-muted-foreground w-10">Start:</span>
                            <DateDisplay date={session.start_date} />
                          </div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <span className="text-muted-foreground w-10">End:</span>
                            {session.end_date ? (
                              <DateDisplay date={session.end_date} />
                            ) : (
                              <span className="text-primary font-medium italic">Ongoing</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="font-mono text-sm px-2">
                          {session.candidate_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {session.is_current ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 pointer-events-none">
                            Current
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="opacity-60 pointer-events-none">
                            Closed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
