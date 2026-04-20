import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Rectangle, ResponsiveContainer, Label } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig, } from "@/components/ui/chart"

const chartConfig = {
  value: {
    label: "Total Candidates",
    color: "#3b82f6",
  },
  approve: {
    label: "Approve",
    color: "hsl(var(--success))",
  },
  reject: {
    label: "Reject",
    color: "hsl(var(--destructive))",
  },
  maybe: {
    label: "Maybe",
    color: "hsl(var(--warning))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig

interface CandidatesDistributionChartProps {
  stats: {
    totalCandidates: number;
    approveCount: number;
    rejectCount: number;
    maybeCount: number;
    undecidedCount: number;
  };
}

export function CandidatesDistributionChart({ stats }: CandidatesDistributionChartProps) {
  const data = [
    // { name: "Total Candidates", value: stats.totalCandidates, gradientId: "gradientTotal" },
    { name: "Approve", value: stats.approveCount, gradientId: "gradientApprove" },
    { name: "Reject", value: stats.rejectCount, gradientId: "gradientReject" },
    { name: "Maybe", value: stats.maybeCount, gradientId: "gradientMaybe" },
    { name: "Pending", value: stats.undecidedCount, gradientId: "gradientPending" },
  ];

  const colors = {
    Total: ["#3b82f6", "#2563eb"],
    Approved: ["#22c55e", "#16a34a"],
    Rejected: ["#ef4444", "#dc2626"],
    Maybe: ["#f59e0b", "#d97706"],
    Pending: ["#94a3b8", "#64748b"],
  };

  return (
    <div className="w-full h-full min-h-[300px] animate-in fade-in zoom-in-95 duration-700">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 30, bottom: 50 }}
            className='[&_.recharts-cartesian-grid-horizontal>line]:[stroke-dasharray:0]'
          >
            <defs>
              <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={colors.Total[0]}
                  stopOpacity={0.8}
                />
                <stop
                  offset="100%"
                  stopColor={colors.Total[1]}
                  stopOpacity={1}
                />
              </linearGradient>
              <linearGradient id="gradientApprove" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={colors.Approved[0]}
                  stopOpacity={0.8}
                />
                <stop
                  offset="100%"
                  stopColor={colors.Approved[1]}
                  stopOpacity={1}
                />
              </linearGradient>
              <linearGradient id="gradientReject" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={colors.Rejected[0]}
                  stopOpacity={0.8}
                />
                <stop
                  offset="100%"
                  stopColor={colors.Rejected[1]}
                  stopOpacity={1}
                />
              </linearGradient>
              <linearGradient id="gradientMaybe" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={colors.Maybe[0]}
                  stopOpacity={0.8}
                />
                <stop
                  offset="100%"
                  stopColor={colors.Maybe[1]}
                  stopOpacity={1}
                />
              </linearGradient>
              <linearGradient id="gradientPending" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={colors.Pending[0]}
                  stopOpacity={0.8}
                />
                <stop
                  offset="100%"
                  stopColor={colors.Pending[1]}
                  stopOpacity={1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="6 6"
              stroke="var(--muted-foreground)"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={12}
              axisLine={false}
              interval={0}
              className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              <Label
                value="Hr Decision"
                position="insideBottom"
                offset={-25}
                className="fill-muted-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wider"
              />
            </XAxis>
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={12}
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
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
              formatter={(value) => <span className="text-xs">Total Candidates : <span className="font-bold">
                {value}
              </span></span>}
            />
            <Bar
              dataKey="value"
              radius={[10, 10, 0, 0]}
              barSize={Math.min(50, 80)} // Dynamic bar size
              animationBegin={100}
              animationDuration={1500}
              animationEasing="ease-out"
              label={(props: any) => {
                const { x, y, width, value } = props;
                return (
                  <text
                    x={x + width / 2}
                    y={y - 12}
                    className="fill-foreground text-[10px] sm:text-xs font-bold"
                    textAnchor="middle"
                  >
                    {value}
                  </text>
                );
              }}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                return (
                  <Rectangle
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    radius={[10, 10, 0, 0]}
                    fill={`url(#${payload?.gradientId})`}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

interface StagesBarChartProps {
  stages: Record<string, number>;
}

export function StagesBarChart({ stages }: StagesBarChartProps) {
  const data = Object.entries(stages)
    .map(([name, value], index) => ({
      name,
      value,
      gradientId: `gradientStage-${index}`,
    }));
  const colors = [
    ["#8b5cf6", "#7c3aed"], // Violet
    ["#6366f1", "#4f46e5"], // Indigo
    ["#3b82f6", "#2563eb"], // Blue
    ["#06b6d4", "#0891b2"], // Cyan
    ["#14b8a6", "#0d9488"], // Teal
    ["#10b981", "#059669"], // Emerald
  ];

  if (data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center border-2 border-dashed border-muted rounded-3xl">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground font-medium italic">No stage data available yet.</p>
          <p className="text-xs text-muted-foreground/60">Upload candidates to see stage distribution.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] animate-in fade-in zoom-in-95 duration-700">
      <ChartContainer
        config={{
          value: {
            label: "Candidates",
            color: "hsl(var(--primary))",
          },
        }}
        className="h-full w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 30, bottom: 50 }}
            className='[&_.recharts-cartesian-grid-horizontal>line]:[stroke-dasharray:0]'
          >
            <defs>
              {data.map((_, index) => (
                <linearGradient
                  key={`gradientStage-${index}`}
                  id={`gradientStage-${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={colors[index % colors.length][0]}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="100%"
                    stopColor={colors[index % colors.length][1]}
                    stopOpacity={1}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="6 6"
              stroke="var(--muted-foreground)"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={12}
              axisLine={false}
              interval={0}
              className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              <Label
                value="Recruitment Stages"
                position="insideBottom"
                offset={-25}
                className="fill-muted-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wider"
              />
            </XAxis>
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={12}
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
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
              formatter={(value) => (
                <span className="text-xs">
                  Candidates : <span className="font-bold">{value}</span>
                </span>
              )}
            />
            <Bar
              dataKey="value"
              radius={[10, 10, 0, 0]}
              barSize={50}
              animationBegin={100}
              animationDuration={1500}
              animationEasing="ease-out"
              label={(props: any) => {
                const { x, y, width, value } = props;
                return (
                  <text
                    x={x + width / 2}
                    y={y - 12}
                    className="fill-foreground text-[10px] sm:text-xs font-bold"
                    textAnchor="middle"
                  >
                    {value}
                  </text>
                );
              }}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                return (
                  <Rectangle
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    radius={[10, 10, 0, 0]}
                    fill={`url(#${payload?.gradientId})`}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

interface LocationBarChartProps {
  locations: Record<string, number>;
}

export function LocationBarChart({ locations }: LocationBarChartProps) {
  const data = Object.entries(locations).map(([name, value], index) => ({
    name,
    value,
    gradientId: `gradientLocation-${index}`,
  }));

  const colors = [
    ["#f97316", "#ea580c"], // Orange
    ["#f59e0b", "#d97706"], // Amber
    ["#eab308", "#ca8a04"], // Yellow
    ["#fb923c", "#f97316"], // Light Orange
    ["#fcd34d", "#d97706"], // Light Amber
  ];

  if (data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center border-2 border-dashed border-muted rounded-3xl">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground font-medium italic">No location data available yet.</p>
          <p className="text-xs text-muted-foreground/60">Candidate locations will appear here once extracted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] animate-in fade-in zoom-in-95 duration-700">
      <ChartContainer
        config={{
          value: {
            label: "Candidates",
            color: "hsl(var(--primary))",
          },
        }}
        className="h-full w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 30, bottom: 50 }}
            className='[&_.recharts-cartesian-grid-horizontal>line]:[stroke-dasharray:0]'
          >
            <defs>
              {data.map((_, index) => (
                <linearGradient
                  key={`gradientLocation-${index}`}
                  id={`gradientLocation-${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={colors[index % colors.length][0]}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="100%"
                    stopColor={colors[index % colors.length][1]}
                    stopOpacity={1}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="6 6"
              stroke="var(--muted-foreground)"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={12}
              axisLine={false}
              interval={0}
              className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              <Label
                value="Candidate Locations"
                position="insideBottom"
                offset={-25}
                className="fill-muted-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wider"
              />
            </XAxis>
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={12}
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
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
              formatter={(value) => (
                <span className="text-xs">
                  Candidates : <span className="font-bold">{value}</span>
                </span>
              )}
            />
            <Bar
              dataKey="value"
              radius={[10, 10, 0, 0]}
              barSize={50}
              animationBegin={100}
              animationDuration={1500}
              animationEasing="ease-out"
              label={(props: any) => {
                const { x, y, width, value } = props;
                return (
                  <text
                    x={x + width / 2}
                    y={y - 12}
                    className="fill-foreground text-[10px] sm:text-xs font-bold"
                    textAnchor="middle"
                  >
                    {value}
                  </text>
                );
              }}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                return (
                  <Rectangle
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    radius={[10, 10, 0, 0]}
                    fill={`url(#${payload?.gradientId})`}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
