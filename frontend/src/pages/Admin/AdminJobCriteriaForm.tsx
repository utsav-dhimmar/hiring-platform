import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, ArrowLeft } from "lucide-react";
import {
    Button,
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Input,
    Textarea,
    Switch,
    Badge,
} from "@/components";
import { useWatch } from "react-hook-form";
import { Search, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { useToast } from "@/components/shared/ToastProvider";
import AppPageShell from "@/components/shared/AppPageShell";
import PageHeader from "@/components/shared/PageHeader";
import { jobCriteriaCreateSchema, type JobCriteriaCreateFormValues } from "@/schemas/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import jobService from "@/apis/job";
import type { JobTitle } from "@/types/job";

/**
 * Form page for creating or editing job evaluation criteria.
 * Includes job selection (apply to all or specific jobs) and optional filter by tags.
 */
export default function AdminJobCriteriaForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { slug } = useParams<{ slug?: string }>();
    const toast = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const form = useForm<JobCriteriaCreateFormValues>({
        resolver: zodResolver(jobCriteriaCreateSchema) as any,
        defaultValues: {
            name: "",
            description: "",
            is_active: true,
            apply_to_all: true,
            job_ids: [],
        },
    });

    const [availableJobs, setAvailableJobs] = useState<JobTitle[]>([]);
    const [jobSearch, setJobSearch] = useState("");



    const selectedJobIds = useWatch({
        control: form.control,
        name: "job_ids",
        defaultValue: [],
    });

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await jobService.getJobTitles()
                setAvailableJobs(response.data);
            } catch (error) {
                console.error("Failed to fetch jobs:", error);
            }
        };
        fetchJobs();
    }, []);

    const toggleJob = (jobId: string) => {
        const current = [...selectedJobIds];
        const index = current.indexOf(jobId);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(jobId);
        }
        form.setValue("job_ids", current, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
    };
    console.log(availableJobs);
    const filteredJobs = availableJobs.filter((job) =>
        job.title.toLowerCase().includes(jobSearch.toLowerCase())
    );

    const selectedJobsData = availableJobs.filter((job) =>
        selectedJobIds.includes(job.id)
    );

    useEffect(() => {
        // Once API is ready it should be fetch by slug if slug is missing
        const stateData = location.state as any;

        if (slug && slug !== "new") {
            setIsEditMode(true);
            if (stateData?.criteria) {
                const { info, isactive, apply_to_all, job_ids } = stateData.criteria;
                form.reset({
                    name: info.name,
                    description: info.description,
                    is_active: isactive,
                    apply_to_all: apply_to_all ?? true,
                    job_ids: job_ids ?? [],
                });
            } else if (stateData?.id) {
                // Handle case where only ID is passed
                toast.info("Loading criteria details...");
                // fetch job criteria by id

            }
        }
    }, [slug, location.state, form, toast]);

    const onSubmit = async (values: JobCriteriaCreateFormValues) => {
        setIsSubmitting(true);
        try {
            // Mock API call
            console.log("Submitting criteria:", values);
            await new Promise((resolve) => setTimeout(resolve, 1000));

            toast.success(
                isEditMode
                    ? "Job criteria updated successfully"
                    : "Job criteria created successfully"
            );
            navigate("/dashboard/admin/criteria-stages/criteria");
        } catch (error) {
            console.error("Failed to save criteria:", error);
            toast.error("Failed to save job criteria");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppPageShell width="wide" className="animate-in fade-in duration-500">
            <PageHeader
                title={isEditMode ? "Edit Job Criteria" : "Create Job Criteria"}
                subtitle={isEditMode ? "Update the configuration for this evaluation criterion." : "Define a new criterion for candidate evaluation."}
                actions={
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/dashboard/admin/criteria-stages/criteria")}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go Back
                    </Button>
                }
            />


            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle>{isEditMode ? "Criteria Details" : "New Criteria"}</CardTitle>
                    <CardDescription>
                        Configure how this criterion will be used in the evaluation process.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Communication Skills" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            The display name for this evaluation criterion.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe what this criterion evaluates..."
                                                className="min-h-[220px] resize-y"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            A detailed explanation of what the AI should look for.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="is_active"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base font-bold">Active Status</FormLabel>
                                            <FormDescription>
                                                Enable or disable this criterion in evaluations.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-4 pt-4 border-t">
                                <FormField
                                    control={form.control}
                                    name="apply_to_all"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-muted/30">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base font-bold">Apply to all jobs</FormLabel>
                                                <FormDescription>
                                                    If enabled, this criteria will be evaluated for all job roles.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={(checked) => {
                                                        field.onChange(checked);
                                                        if (checked) {
                                                            form.setValue("job_ids", availableJobs.map(j => j.id), {
                                                                shouldDirty: true,
                                                                shouldValidate: true
                                                            });
                                                        } else {
                                                            form.setValue("job_ids", [], {
                                                                shouldDirty: true,
                                                                shouldValidate: true
                                                            });
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <FormLabel className="text-lg font-bold">Select Jobs</FormLabel>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search jobs..."
                                                value={jobSearch}
                                                onChange={(e) => setJobSearch(e.target.value)}
                                                className="pl-10 h-11 text-base rounded-xl border-muted-foreground/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-2 border rounded-xl bg-background/50">
                                        {filteredJobs.length > 0 ? (
                                            filteredJobs.map((job) => {
                                                const isSelected = selectedJobIds.includes(job.id);
                                                return (
                                                    <button
                                                        key={job.id}
                                                        type="button"
                                                        onClick={() => toggleJob(job.id)}
                                                        className={cn(
                                                            "flex items-center justify-between px-3 py-2 rounded-xl border-2 transition-all duration-300 text-left",
                                                            isSelected
                                                                ? "bg-primary/10 border-primary text-primary"
                                                                : "bg-background border-border text-muted-foreground hover:border-primary/50"
                                                        )}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm">{job.title}</span>
                                                            {/* <span className="text-xs opacity-70">{job.department?.name}</span> */}
                                                        </div>
                                                        <div className={cn(
                                                            "shrink-0 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all",
                                                            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                                                        )}>
                                                            {isSelected && <Check className="h-3 w-3 stroke-[3px]" />}
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-full py-8 text-center text-muted-foreground italic">
                                                No jobs match your search.
                                            </div>
                                        )}
                                    </div>

                                    {selectedJobIds.length > 0 && (
                                        <div className="pt-4">
                                            <p className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">
                                                Selected Jobs ({selectedJobIds.length})
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedJobsData.map((job) => (
                                                    <Badge
                                                        key={job.id}
                                                        variant="secondary"
                                                        className="pl-3 pr-1 py-1 text-sm rounded-xl bg-primary/10 text-primary border-primary/20 font-bold"
                                                    >
                                                        {job.title}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleJob(job.id)}
                                                            className="ml-2 hover:bg-primary/20 rounded-full p-1"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>

                            <div className="flex items-center justify-end gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate(-1)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={isSubmitting} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    {isEditMode ? "Update Criteria" : "Create Criteria"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

        </AppPageShell>
    );
}
