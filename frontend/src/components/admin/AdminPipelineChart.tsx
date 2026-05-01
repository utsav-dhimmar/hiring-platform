import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { JobPipelineStats } from "@/types/admin";

interface AdminPipelineChartProps {
  data: JobPipelineStats[];
}

export function AdminPipelineChart({ data }: AdminPipelineChartProps) {

  // Transform data for Recharts stacked bar format
  // { job_name: "Software Engineer", "Stage 1": 10, "Stage 2": 5 }
  const transformedData = useMemo(() => {
    return data.map((job) => {
      const row: Record<string, any> = { job_name: job.job_name };
      job.stages.forEach((stage) => {
        const safeKey = stage.stage_name.replace(/[^a-zA-Z0-9]/g, "");
        row[safeKey] = stage.count;
      });
      return row;
    });
  }, [data]);

  // Extract all unique stage names to generate Bars and ChartConfig dynamically
  const uniqueStages = useMemo(() => {
    const stagesMap = new Map<string, string>(); // safeKey -> originalName
    data.forEach((job) => {
      job.stages.forEach((stage) => {
        const safeKey = stage.stage_name.replace(/[^a-zA-Z0-9]/g, "");
        stagesMap.set(safeKey, stage.stage_name);
      });
    });
    return Array.from(stagesMap.entries());
  }, [data]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    const pastelColors = [
      "hsl(210, 80%, 85%)", // Soft Blue
      "hsl(150, 60%, 85%)", // Soft Green
      "hsl(280, 65%, 88%)", // Soft Purple
      "hsl(340, 70%, 90%)", // Soft Rose
      "hsl(40, 80%, 85%)",  // Soft Amber
      "hsl(180, 50%, 85%)", // Soft Teal
    ];

    uniqueStages.forEach(([safeKey, originalName], index) => {
      config[safeKey] = {
        label: originalName,
        color: pastelColors[index % pastelColors.length],
      };
    });
    return config;
  }, [uniqueStages]);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Statistics</CardTitle>
          <CardDescription>No data available to display</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs border-0">
      <CardHeader>
        <CardTitle>Pipeline Statistics</CardTitle>
        <CardDescription>Candidate distribution across stages by job</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className=" max-h-[300px] w-full">
          <BarChart data={transformedData} accessibilityLayer margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="job_name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => (value.length > 20 ? value.substring(0, 17) + "..." : value)}
            />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent hideLabel={false} />} cursor={{ fill: "transparent" }} />
            <ChartLegend content={<ChartLegendContent />} />
            {uniqueStages.map(([safeKey]) => (
              <Bar
                key={safeKey}
                dataKey={safeKey}
                stackId="a"
                fill={`var(--color-${safeKey})`}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// TODO: Remove this after we have the real data
export default function StageCentricChart() {
  const data = [
    { "stage": "Resume Screening", "Frontend Dev": 12, "Backend Dev": 18, "QA Engineer": 10, "UI/UX Designer": 8 },
    { "stage": "Stage 1", "Frontend Dev": 9, "Backend Dev": 14, "QA Engineer": 6, "UI/UX Designer": 5 },
    { "stage": "Stage 2", "Frontend Dev": 5, "Backend Dev": 11, "QA Engineer": 3, "UI/UX Designer": 1 },
    { "stage": "Stage 3", "Frontend Dev": 2, "Backend Dev": 7, "QA Engineer": 0, "UI/UX Designer": 1 },
    { "stage": "Stage 4", "Frontend Dev": 0, "Backend Dev": 3, "QA Engineer": 0, "UI/UX Designer": 1 }
  ];
  const jobName = Object.keys(data[0])
  // .filter(key => key !== "stage");
  console.log(jobName);
  return (
    <div className="w-full h-[400px]">
      <ChartContainer config={{ color: "", label: "" }} className="max-h-[300px] w-full">
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="stage" />
            <YAxis />
            <Tooltip formatter={(value, name) => [value, name]} />
            <Legend content={<ChartLegendContent />} />


            <Bar dataKey="Frontend Dev" stackId="jobs" fill="#2563eb" />
            <Bar dataKey="Backend Dev" stackId="jobs" fill="#16a34a" />
            <Bar dataKey="QA Engineer" stackId="jobs" fill="#d97706" />
            <Bar dataKey="UI/UX Designer" stackId="jobs" fill="#dc2626" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}