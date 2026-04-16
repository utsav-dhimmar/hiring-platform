import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components";
import type { DepartmentRead } from "@/types/admin";
import { Required } from "@/components/job-form/Required";

interface BasicJobDetailsProps {
  departments: DepartmentRead[];
}

export const BasicJobDetails = ({ departments }: BasicJobDetailsProps) => {
  const { control } = useFormContext();

  return (
    <div className="grid gap-6">
      {/* Job Title */}
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-md font-semibold text-foreground">
              Title <Required />
            </FormLabel>
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

      {/* Vacancy */}
      <FormField
        control={control}
        name="vacancy"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-md font-semibold text-foreground">
              Vacancy <Required />
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 5"
                className="h-10 text-md rounded-xl border-muted-foreground/20 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                value={field.value !== null && field.value !== undefined ? field.value : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val ? parseInt(val, 10) : null);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Department */}
      <FormField
        control={control}
        name="department_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-md font-semibold text-foreground">
              Department <Required />
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-12 text-md rounded-xl border-muted-foreground/20 focus:ring-2 focus:ring-primary/20 transition-all font-medium">
                  <SelectValue placeholder="Select department">
                    {
                      departments.find(
                        (dept) => dept.id === field.value,
                      )?.name
                    }
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
        control={control}
        name="jd_text"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-md font-semibold text-foreground">
              Job Description <Required />
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Detailed job description..."
                className="min-h-62.5 text-md rounded-2xl p-5 border-muted-foreground/20 focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
