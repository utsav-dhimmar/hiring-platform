import jobService from "@/apis/job";
import { DashboardBreadcrumbs } from "@/components/dashboard-breadcrumbs";
import { Button, Badge } from "@/components/"
import { DateDisplay, DataTable, SkillsBadgeList } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import type { Job } from "@/types/job";
import { extractErrorMessage } from "@/utils/error";
import {
    Edit2,
    Users, ArrowUpDown,
    Trash2Icon
} from "lucide-react"
import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table";


const JobSkeleton = () => (
    <div className="border rounded-2xl p-5 bg-background/30 animate-pulse border-muted-foreground/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-7 w-48 rounded-md" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="flex flex-wrap items-center gap-8">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24 rounded" />
                        <Skeleton className="h-4 w-32 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24 rounded" />
                        <Skeleton className="h-4 w-32 rounded" />
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-5 w-16 rounded-md" />
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-3 self-end lg:self-center">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-10 rounded-xl" />
                ))}
            </div>
        </div>
    </div>
);


export default function JobBoard() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await jobService.getJobs();
            setJobs(data);
        } catch (error) {
            console.error("Failed to fetch jobs:", error);
            const errorMessage = extractErrorMessage(error, "Failed to load jobs.");
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleDeleteClick = (job: Job) => {
        setJobToDelete(job);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!jobToDelete) return;

        try {
            await jobService.deleteJob(jobToDelete.id);
            toast.success("Job deleted successfully");
            fetchJobs();
        } catch (error) {
            console.error("Failed to delete job:", error);
            const errorMessage = extractErrorMessage(error, "Failed to delete job.");
            toast.error(errorMessage);
        } finally {
            setIsDeleteDialogOpen(false);
            setJobToDelete(null);
        }
    };

    const columns: ColumnDef<Job>[] = useMemo(() => [
        {
            accessorKey: "title",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="hover:bg-transparent p-0 font-semibold"
                    >
                        Title
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="flex flex-col">
                <span className="font-bold text-lg">{row.getValue("title")}</span>
                <span className="text-sm text-muted-foreground">{row.original.department?.name}</span>
            </div>,
        },
        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant={row.getValue("is_active") ? "default" : "outline"} className="rounded-full px-3">
                    {row.getValue("is_active") ? "Active" : "Inactive"}
                </Badge>
            ),
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="hover:bg-transparent p-0 font-semibold"
                    >
                        Created
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <DateDisplay date={row.getValue("created_at")} showIcon />,
        },
        {
            accessorKey: "skills",
            header: "Skills",
            cell: ({ row }) => (
                <div className="max-w-[200px]">
                    <SkillsBadgeList skills={row.original.skills} maxVisible={2} />
                </div>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                        title="Edit Job"
                        onClick={() => {
                            const slug = row.original.title.toLowerCase().trim().replace(/ /g, "-");
                            navigate(`/dashboard/jobs/${slug}/edit`, { state: { jobId: row.original.id } });
                        }}
                    >
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only" title="edit">Edit Job</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
                        title="Delete Job"
                        onClick={() => handleDeleteClick(row.original)}
                    >
                        <Trash2Icon className="h-4 w-4" />
                        <span className="sr-only" title="delete">Delete Job</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl hover:bg-blue-500/10 hover:text-blue-500 transition-all"
                        title="View Candidates"
                        onClick={() => {
                            const slug = row.original.title.toLowerCase().trim().replace(/ /g, "-");
                            navigate(`/dashboard/jobs/${slug}/candidates`, { state: { jobId: row.original.id } });
                        }}
                    >
                        <Users className="h-4 w-4" />
                        <span className="sr-only" title="view">View Candidates</span>
                    </Button>
                </div>
            ),
        },
    ], []);


    return (
        <div className="flex flex-col gap-4 max-w-7xl mx-auto px-4 pt-0 pb-4">


            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Job Board</h1>
                    <DashboardBreadcrumbs />
                </div>
                <Button
                    className="rounded-xl px-4 py-3 text-md font-semibold bg-primary hover:bg-primary/90 shadow-lg transition-all duration-300"
                    onClick={() => navigate("/dashboard/jobs/new")}
                >
                    Create Job
                </Button>
            </div>

            {/* Content Container */}
            <div className="border rounded-3xl p-4 bg-card/50 backdrop-blur-sm min-h-[600px] shadow-sm">
                {loading ? (
                    <div className="flex flex-col gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <JobSkeleton key={i} />
                        ))}
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                        <div className="p-4 bg-muted rounded-full">
                            <Users className="h-8 w-8 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="text-lg font-medium">No jobs found</h3>
                        <p className="text-muted-foreground text-sm max-w-xs">
                            Get started by creating your first job posting.
                        </p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={jobs}
                        searchKey="title"
                        searchPlaceholder="Filter jobs by title..."
                    />
                )}
            </div>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-3xl p-6">
                    <DialogHeader className="gap-2">
                        <DialogTitle className="text-xl font-bold">Delete Job</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Are you sure you want to delete <span className="font-semibold text-foreground">"{jobToDelete?.title}"</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="rounded-xl font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}

                        >
                            Delete Job
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
