import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ResumeScreeningResult } from "@/types/admin";
import { CheckCircle2, XCircle, AlertCircle, User } from "lucide-react";

interface CandidateDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidate: ResumeScreeningResult | null;
}

export function CandidateDetailsModal({ isOpen, onClose, candidate }: CandidateDetailsModalProps) {
    if (!candidate) return null;

    const analysis = candidate.resume_analysis;
    const isPassed = candidate.pass_fail;

    return (
        <Dialog open={isOpen} onOpenChange={onClose} >
            <DialogContent className="sm:max-w-[90%] lg:max-w-[1200px] max-h-[100vh] p-0 overflow-hidden rounded-[2rem] border-muted-foreground/10 bg-card/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader className="">
                    <DialogTitle className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <User className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col text-left gap-1">
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/60">
                                Candidate Profile
                            </span>
                            <span className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                                {candidate.first_name} <span className="text-primary">{candidate.last_name}</span>
                            </span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="px-8 py-4 border-y border-muted-foreground/10 bg-muted/20 flex flex-wrap gap-8 items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Match Percentage</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-blue-500">{analysis?.match_percentage || 0}%</span>
                            </div>
                        </div>
                        <Separator orientation="vertical" className="h-10 bg-muted-foreground/10" />
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pass / Fail</span>
                            <Badge
                                variant={isPassed ? "default" : "destructive"}
                                className={`rounded-full px-4 py-1 flex items-center gap-2 w-fit ${isPassed ? 'bg-green-500/10 text-green-600 border-green-200 shadow-none' : 'bg-red-500/10 text-red-600 border-red-200 shadow-none'}`}
                            >
                                {isPassed ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="font-bold">PASSED</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-4 w-4" />
                                        <span className="font-bold">FAILED</span>
                                    </>
                                )}
                            </Badge>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Status</span>
                        <span className="text-sm font-semibold text-foreground uppercase tracking-wider">{candidate.current_status || 'Applied'}</span>
                    </div>
                </div>

                <div className="flex-1 p-8 max-h-[calc(90vh-280px)] overflow-y-auto">
                    <div className="space-y-10 pb-8">
                        {/* Summary Sections */}
                        <div className="grid grid-cols-1 gap-10">
                            <section className="space-y-4">
                                <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
                                    <div className="h-1 w-6 bg-primary rounded-full" />
                                    Strength Summary
                                </h3>
                                <p className="text-muted-foreground text-base leading-relaxed indent-4">
                                    {analysis?.strength_summary || "No summary available."}
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
                                    <div className="h-1 w-6 bg-blue-500 rounded-full" />
                                    Experience Alignment
                                </h3>
                                <p className="text-muted-foreground text-base leading-relaxed indent-4">
                                    {analysis?.experience_alignment || "No alignment details available."}
                                </p>
                            </section>
                        </div>

                        {/* Skills & Extraordinary Points */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                            <section className="space-y-6">
                                <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
                                    <AlertCircle className="h-5 w-5 text-red-500/80" />
                                    Missing Skills
                                </h3>
                                <div className="space-y-3">
                                    {analysis?.missing_skills && analysis.missing_skills.length > 0 ? (
                                        analysis.missing_skills.map((skill, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-red-500/5 border border-red-500/10 group hover:bg-red-500/10 transition-colors">
                                                <span className="text-sm font-bold text-red-600/80">{skill.name}</span>
                                                <span className="text-xs font-black text-red-400">{skill.score.toFixed(0)}% Gap</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-green-600 font-medium">No major missing skills identified.</p>
                                    )}
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
                                    Extraordinary Points
                                </h3>
                                <div className="space-y-4">
                                    {analysis?.extraordinary_points && analysis.extraordinary_points.length > 0 ? (
                                        analysis.extraordinary_points.map((point, idx) => (
                                            <div key={idx} className="flex gap-3 text-sm leading-relaxed text-muted-foreground group">
                                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0 group-hover:scale-150 transition-transform" />
                                                <p className="group-hover:text-foreground transition-colors">{point}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">None identified.</p>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-muted-foreground/10 flex flex-wrap gap-4 items-center justify-center bg-muted/10">
                    <Button
                        onClick={onClose}
                        variant="default"

                    >
                        Approve
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}

                    >
                        May Be
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onClose}

                    >
                        Reject
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
