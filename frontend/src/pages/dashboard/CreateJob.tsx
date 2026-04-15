import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { X } from "lucide-react";

import {
  Button,
  Form,
} from "@/components";

import {
  JobFormSkeleton,
  BasicJobDetails,
  JobSettingsSection,
  CustomFieldsSection,
  SkillSelectorSection,
} from "@/components/job-form";

import jobService from "@/apis/job";
import { adminDepartmentService } from "@/apis/admin/department";
import { adminSkillService } from "@/apis/admin/skill";
import type { DepartmentRead, SkillRead } from "@/types/admin";
import { slugify } from "@/utils/slug";
import { jobCreateSchema, type JobCreateFormValues } from "@/schemas/admin";
import AppPageShell from "@/components/shared/AppPageShell";
import PageHeader from "@/components/shared/PageHeader";
import { extractErrorMessage } from "@/utils/error";


export default function CreateJob() {
  const navigate = useNavigate();
  const { jobSlug } = useParams<{ jobSlug?: string }>();
  const location = useLocation();

  const [departments, setDepartments] = useState<DepartmentRead[]>([]);
  const [availableSkills, setAvailableSkills] = useState<SkillRead[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const isEditMode = !!jobSlug;

  const form = useForm<JobCreateFormValues>({
    resolver: zodResolver(jobCreateSchema) as any,
    defaultValues: {
      title: "",
      vacancy: undefined,
      department_id: "",
      jd_text: "",
      is_active: true,
      skill_ids: [],
      passing_threshold: 65,
      custom_extraction_fields: [],
    },
  });


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
      setIsInitialLoading(true);
      try {
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
              jobData = allJobs.data.find((j: any) => slugify(j.title) === jobSlug);

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
                vacancy: jobData.vacancy || undefined,
                department_id: jobData.department_id || "",
                jd_text: jobData.jd_text || "",
                is_active: jobData.is_active ?? true,
                skill_ids: jobData.skills?.map((s: any) => s.id) || [],
                passing_threshold: jobData.passing_threshold ?? 65,
                custom_extraction_fields: jobData.custom_extraction_fields || [],
              });
            }
          } catch (error) {
            const errorMessage = extractErrorMessage(error)
            console.error("Failed to fetch job details:", error);
            toast.error(errorMessage || "Failed to load job details.");
            navigate("/dashboard/jobs");
          }
        }
      } finally {
        setIsInitialLoading(false);
      }
    };
    init();
  }, [isEditMode, jobSlug, location.state, form, navigate, fetchFormData]);

  const onSubmit = async (values: JobCreateFormValues) => {
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
      const errorMessage = extractErrorMessage(error)
      console.error("Failed to save job:", error);
      toast.error(
        isEditMode ? errorMessage || "Failed to update job." : errorMessage || "Failed to create job.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <AppPageShell
      width="wide"
      gap="default"
      className="animate-in fade-in duration-500 bg-background"
    >
      <PageHeader
        title={isEditMode ? "Edit Job" : "Create Job"}
        actions={
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => navigate("/dashboard/jobs")}
            className="rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-4xl">
        {isInitialLoading ? (
          <JobFormSkeleton />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <BasicJobDetails departments={departments} />
              <JobSettingsSection />
              <CustomFieldsSection />
              <SkillSelectorSection availableSkills={availableSkills} />

              {/* Form Actions */}
              <div className="flex flex-wrap items-center justify-center gap-4 border-t pt-8">
                <Button variant="default" type="submit" isLoading={isSubmitting}>
                  {isEditMode ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard/jobs")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </AppPageShell>
  );
}
