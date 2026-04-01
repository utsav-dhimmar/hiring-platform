import { useState, useEffect, useCallback } from "react";
import { DashboardBreadcrumbs } from "@/components/layout/dashboard-breadcrumbs";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { X, Plus, Check, Search } from "lucide-react";

import {
  Button,
  Input,
  Textarea,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Switch,
} from "@/components";

import jobService from "@/apis/job";
import { adminDepartmentService } from "@/apis/admin/department";
import { adminSkillService } from "@/apis/admin/skill";
import type { DepartmentRead, SkillRead } from "@/types/admin";
import { cn } from "@/lib/utils";
import { slugify } from "@/utils/slug";

const jobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  department_id: z.string().min(1, "Department is required"),
  jd_text: z.string().min(10, "Job description must be at least 10 characters"),
  is_active: z.boolean(),
  skill_ids: z.array(z.string()).min(1, "Select at least one skill"),
});

interface JobFormValues {
  title: string;
  department_id: string;
  jd_text: string;
  is_active: boolean;
  skill_ids: string[];
}

export default function CreateJob() {
  const navigate = useNavigate();
  const { jobSlug } = useParams<{ jobSlug?: string }>();
  const location = useLocation();

  const [departments, setDepartments] = useState<DepartmentRead[]>([]);
  const [availableSkills, setAvailableSkills] = useState<SkillRead[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const isEditMode = !!jobSlug;

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema) as any,
    defaultValues: {
      title: "",
      department_id: "",
      jd_text: "",
      is_active: true,
      skill_ids: [],
    },
  });

  const selectedSkillIds = form.watch("skill_ids");

  const fetchFormData = useCallback(async () => {
    try {
      const [deptRes, skillRes] = await Promise.all([
        adminDepartmentService.getAllDepartments(),
        adminSkillService.getAllSkills(),
      ]);
      setDepartments(deptRes.data);
      setAvailableSkills(skillRes.data);
      return { skills: skillRes.data };
    } catch (error) {
      console.error("Failed to fetch form data:", error);
      toast.error("Failed to load departments or skills.");
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchFormData();

      if (isEditMode) {
        let id = (location.state as any)?.jobId;

        try {
          let jobData;
          if (id) {
            jobData = await jobService.getJob(id);
          } else {
            // Fallback: fetch all jobs and find by slug
            const allJobs = await jobService.getJobs();
            jobData = allJobs.find((j) => slugify(j.title) === jobSlug);

            // If still not found, try a more lenient match or just error out
            if (!jobData) {
              toast.error("Job not found.");
              navigate("/dashboard/jobs");
              return;
            }
            id = jobData.id;
          }

          if (jobData) {
            setJobId(id);
            form.reset({
              title: jobData.title,
              department_id: jobData.department_id || "",
              jd_text: jobData.jd_text || "",
              is_active: jobData.is_active ?? true,
              skill_ids: jobData.skills?.map((s: any) => s.id) || [],
            });
          }
        } catch (error) {
          console.error("Failed to fetch job details:", error);
          toast.error("Failed to load job details.");
          navigate("/dashboard/jobs");
        }
      }
    };
    init();
  }, [isEditMode, jobSlug, location.state, form, navigate, fetchFormData]);

  const onSubmit = async (values: JobFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && jobId) {
        await jobService.updateJob(jobId, values as any);
        toast.success("Job updated successfully!");
      } else {
        await jobService.createJob(values as any);
        toast.success("Job created successfully!");
      }
      navigate("/dashboard/jobs");
    } catch (error) {
      console.error("Failed to save job:", error);
      toast.error(isEditMode ? "Failed to update job." : "Failed to create job.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSkill = (skillId: string) => {
    const current = [...selectedSkillIds];
    const index = current.indexOf(skillId);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(skillId);
    }
    form.setValue("skill_ids", current, { shouldValidate: true });
  };

  const selectedSkills = availableSkills.filter((s) => selectedSkillIds.includes(s.id));

  const filteredSkills = availableSkills.filter((skill) =>
    skill.name.toLowerCase().includes(skillSearch.toLowerCase()),
  );

  return (
    <div className="max-w-4xl mx-auto px-4 pt-0 pb-4 space-y-4 animate-in fade-in duration-500 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {isEditMode ? "Edit Job" : "Create Job"}
          </h1>
          <DashboardBreadcrumbs />
        </div>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => navigate("/dashboard/jobs")}
          className="rounded-full hover:bg-muted"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6">
            {/* Job Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md font-semibold text-foreground">Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Senior Frontend Developer"
                      className="h-10 text-md rounded-xl border-muted-foreground/20 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Department */}
            <FormField
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md font-semibold text-foreground">Department</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 text-md rounded-xl border-muted-foreground/20 focus:ring-2 focus:ring-primary/20 transition-all font-medium">
                        <SelectValue placeholder="Select department">
                          {departments.find((dept) => dept.id === field.value)?.name}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl shadow-xl border-muted-foreground/10">
                      {departments.map((dept) => (
                        <SelectItem
                          key={dept.id}
                          value={dept.id}
                          className="py-3 text-md font-medium"
                        >
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Job Description */}
            <FormField
              control={form.control}
              name="jd_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md font-semibold text-foreground">
                    Job Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed job description..."
                      className="min-h-[250px] text-md rounded-2xl p-5 border-muted-foreground/20 focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Active Status */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-muted-foreground/20 p-6 bg-card/10 backdrop-blur-sm hover:bg-card/20 transition-all shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-lg font-bold">
                      Job Status
                    </FormLabel>
                    <p className="text-sm text-muted-foreground font-medium">
                      Control visibility on the job board. Currently {field.value ? "Active" : "Inactive"}.
                    </p>
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
          </div>

          {/* Required Skills Section */}
          <div className="border rounded-3xl p-4 bg-card/30 backdrop-blur-md border-muted-foreground/10 shadow-sm space-y-8">
            <div className="space-y-1">
              <h2 className="text-md font-bold tracking-tight">Required Skills</h2>
              <p className="text-muted-foreground text-md font-medium">
                Select the skills that should be linked to this job. Click a skill to toggle
                selection.
              </p>
            </div>

            {/* Skill Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skills by name..."
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                className="pl-10 h-10 text-md rounded-xl border-muted-foreground/20 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 max-h-100 overflow-y-auto p-2 pr-4 custom-scrollbar">

              {filteredSkills.length > 0 ? (
                filteredSkills.map((skill) => {
                  const isSelected = selectedSkillIds.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={cn(
                        "flex items-center justify-between px-2 py-1.5 rounded-xl border-2 transition-all duration-300 text-left group",
                        isSelected
                          ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5"
                          : "bg-background/50 border-muted-foreground/10 text-muted-foreground hover:border-primary/50 hover:bg-primary/5",
                      )}
                    >

                      <span className="font-bold text-xs lg:text-sm truncate mr-2">
                        {skill.name}
                      </span>

                      <div
                        className={cn(
                          "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground scale-110"
                            : "border-muted-foreground/20 group-hover:border-primary/50",
                        )}
                      >

                        {isSelected ? (
                          <Check className="h-3.5 w-3.5 stroke-[3px]" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}

                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="col-span-full py-10 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted-foreground/10">
                  <p className="text-muted-foreground font-medium italic">
                    {availableSkills.length === 0
                      ? "No skills found in database."
                      : "No skills match your search."}
                  </p>
                </div>
              )}
            </div>

            {selectedSkillIds.length > 0 && (
              <div className="pt-6 border-t border-muted-foreground/10">
                <p className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">
                  Selected ({selectedSkillIds.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <Badge
                      key={skill.id}
                      variant="secondary"
                      className="pl-2 pr-1 py-1 text-sm rounded-xl bg-primary/20 text-primary border-none font-bold animate-in zoom-in duration-300"
                    >
                      {skill.name}
                      <button
                        type="button"
                        onClick={() => toggleSkill(skill.id)}
                        className="ml-2 hover:bg-primary/20 rounded-full p-1 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="skill_ids"
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-10 border-t items-center justify-center">
            <Button variant="default" type="submit" isLoading={isSubmitting}>
              {isEditMode ? "Update" : "Create"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard/jobs")}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
