import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Rectangle, ResponsiveContainer, Label } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig, } from "@/components/ui/chart"

const chartConfig = {
  value: {
    label: "Total Candidates",
    color: "#3b82f6",
  },
  approved: {
    label: "Approved",
    color: "hsl(var(--success))",
  },
  rejected: {
    label: "Rejected",
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
    { name: "Approved", value: stats.approveCount, gradientId: "gradientApproved" },
    { name: "Rejected", value: stats.rejectCount, gradientId: "gradientRejected" },
    { name: "Maybe", value: stats.maybeCount, gradientId: "gradientMaybe" },
    { name: "Pending", value: stats.undecidedCount, gradientId: "gradientPending" },
  ];
  console.log(stats, data)
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
              <linearGradient id="gradientApproved" x1="0" y1="0" x2="0" y2="1">
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
              <linearGradient id="gradientRejected" x1="0" y1="0" x2="0" y2="1">
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
              strokeDasharray="3 3"
              strokeOpacity={0.1}
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
              cursor={{ fill: "rgba(0,0,0,0.05)", radius: 8 }}
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
              label={{ position: "top", fill: "#000", fontWeight: "bold" }}
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
