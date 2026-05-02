import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Label, LabelList } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { JobPipelineStats } from "@/types/admin";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Briefcase, ChevronDown, Layers } from "lucide-react";
import type { JobTitle } from "@/types/job";

interface StageCentricChartProps {
  data: JobPipelineStats[];
  selectedJobId: string
  jobs: JobTitle[];
  stages: { name: string }[]
  selectedStageName: string
  setSelectedJobId: (id: string) => void
  setSelectedStageName: (name: string) => void
}


interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string | number;
  payload: any;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  activeKey?: string | null;
}
/**
 * Custom tooltip component for the chart.
 * Displays only jobs with value > 0 and highlights the hovered job bar.
 * @param active - Whether the tooltip is active (visible)
 * @param payload - The data payload for the tooltip
 * @param label - The label for the tooltip (stage name)
 * @param activeKey - The key of the currently active/hovered job
 * @returns The tooltip JSX or null if not active
 */
const CustomTooltipContent = ({ active, payload, label, activeKey }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  // only show jobs with value > 0
  const filteredPayload = payload.filter((entry) => entry.value > 0);
  // const filteredPayload = payload

  // if no jobs with value > 0, return null
  if (filteredPayload.length === 0) return null;

  return (
    <div className="bg-white dark:bg-card dark:border-border/50 p-3 rounded-xl shadow-md border border-border/50 ">
      <p className="font-semibold mb-2 text-sm text-foreground dark:text-white">{label}</p>

      {filteredPayload.map((entry, index) => {
        const isActive = entry.dataKey === activeKey;

        return (
          <div
            key={index}
            className={cn(
              "flex justify-between items-center px-2 py-1.5 text-xs transition-colors gap-4",
              isActive ? " font-bold " : ""
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="capitalize max-w-[120px]">{entry.name}</span>
            </div>
            <span className="font-mono">{entry.value}</span>
          </div>
        );
      })}
    </div>
  );
};



/**
 * StageCentricChart component displays a stacked bar chart showing candidate distribution
 * across pipeline stages by job title. Includes dropdown filters for job and stage selection.
 * @param data - Array of job pipeline statistics
 * @param selectedJobId - Currently selected job ID (or "all" for all jobs)
 * @param jobs - List of available job titles
 * @param stages - List of pipeline stages
 * @param selectedStageName - Currently selected stage name (or "all" for all stages)
 * @param setSelectedJobId - Callback to update selected job ID
 * @param setSelectedStageName - Callback to update selected stage name
 * @returns A card component containing the interactive bar chart with filters
 */
export function StageCentricChart({ data, selectedJobId, jobs, stages, selectedStageName, setSelectedJobId, setSelectedStageName }: StageCentricChartProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // Extract job names from the last element and filter chart data
  const { chartData, jobNames } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], jobNames: [] };

    const lastItem = data[data.length - 1];
    const names = lastItem.job_names || [];
    const filteredData = data.filter(item => item.stage);

    return { chartData: filteredData, jobNames: names };
  }, [data]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    const colors = [
      "hsl(210, 80%, 85%)", // Soft Blue
      "hsl(150, 60%, 85%)", // Soft Green
      "hsl(280, 65%, 88%)", // Soft Purple
      "hsl(340, 70%, 90%)", // Soft Rose
      "hsl(40, 80%, 85%)",  // Soft Amber
      "hsl(180, 50%, 85%)", // Soft Teal
    ];

    jobNames.forEach((name, index) => {
      const safeKey = name.replace(/[^a-zA-Z0-9]/g, "_");
      config[safeKey] = {
        label: name,
        color: colors[index % colors.length],
      };
    });
    return config;
  }, [jobNames]);


  if (!chartData || chartData.length === 0) {
    return (
      <Card className="shadow-xs border-0">
        <CardHeader>
          <CardTitle>Pipeline Statistics</CardTitle>
          <CardDescription>No stage data available to display</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs border-0">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <CardTitle>Pipeline Statistics</CardTitle>
          <CardDescription>Candidate distribution across stages by job</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-2 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex items-center gap-2 h-9 px-3 rounded-xl border text-sm font-medium cursor-pointer select-none transition-colors",
                  selectedJobId !== "all"
                    ? "border-primary/40 bg-primary/5 text-foreground"
                    : "border-input bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Briefcase className="h-3.5 w-3.5 opacity-60" />
                <span className="truncate max-w-[150px]">
                  {selectedJobId === "all"
                    ? "Jobs"
                    : jobs.find((j) => j.id === selectedJobId)?.title || "Selected Job"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px]">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Select Job</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={selectedJobId === "all"}
                    onClick={() => setSelectedJobId("all")}
                  >
                    All Jobs
                  </DropdownMenuCheckboxItem>
                  {jobs &&
                    jobs.map((job) => (
                      <DropdownMenuCheckboxItem
                        key={job.id}
                        checked={selectedJobId === job.id}
                        onClick={() => setSelectedJobId(job.id)}
                        closeOnClick={true}
                      >
                        {job.title}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex items-center gap-2 h-9 px-3 rounded-xl border text-sm font-medium cursor-pointer select-none transition-colors",
                  selectedStageName !== "all"
                    ? "border-primary/40 bg-primary/5 text-foreground"
                    : "border-input bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Layers className="h-3.5 w-3.5 opacity-60" />
                <span className="truncate max-w-[150px]">
                  {selectedStageName === "all" ? "Stages" : selectedStageName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px]">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Select Stage</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={selectedStageName === "all"}
                    onClick={() => setSelectedStageName("all")}
                  >
                    All Stages
                  </DropdownMenuCheckboxItem>
                  {stages?.map((stage) => (
                    <DropdownMenuCheckboxItem
                      key={stage.name}
                      checked={selectedStageName === stage.name}
                      onClick={() => setSelectedStageName(stage.name)}
                      closeOnClick={true}
                    >
                      {stage.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart
            data={chartData}
            accessibilityLayer
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
            <XAxis
              dataKey="stage"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground"
              tickFormatter={(value) => (value.length > 15 ? value.substring(0, 12) + "..." : value)}
            >
              <Label
                value="Job Stages"
                position="insideBottom"
                offset={-75}
                className="fill-muted-foreground text-[10px] sm:text-xs font-bold tracking-wider"
              />
            </XAxis>
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              className="text-[10px] sm:text-xs font-medium text-muted-foreground"
              allowDecimals={false}
            >
              <Label
                value="No. of Candidates"
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: "middle" }}
                className="fill-muted-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wider"
              />
            </YAxis>
            {/* <ChartTooltip content={<ChartTooltipContent hideLabel={false} />} cursor={{ fill: "hsl(var(--muted)/0.2)" }} /> */}
            <ChartTooltip
              content={<CustomTooltipContent activeKey={activeKey} />}
              cursor={{ fill: "hsl(var(--muted)/0.2)" }}
            />

            {/* <ChartLegend content={<ChartLegendContent />} /> */}
            {jobNames.map((name) => {
              const safeKey = name.replace(/[^a-zA-Z0-9]/g, "_");
              return (
                <Bar
                  key={name}
                  dataKey={name}
                  name={name}
                  stackId="a"
                  fill={chartConfig[safeKey]?.color}
                  radius={[0, 0, 0, 0]}
                  onMouseEnter={() => { setActiveKey(name) }}
                  onMouseLeave={() => setActiveKey(null)}
                >
                  <LabelList
                    dataKey={name}
                    position="insideTop"
                    className="fill-black text-xs font-bold"
                  />
                </Bar>
              );
            })}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}


export default StageCentricChart;