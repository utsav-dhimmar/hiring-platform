import { Pie, PieChart as RechartsPieChart, Cell, ResponsiveContainer, Label } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig, } from "@/components/ui/chart"

const chartConfig = {
  pass: {
    label: "Passed",
    color: "hsl(var(--success))",
  },
  fail: {
    label: "Failed",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig

interface ResultPieChartProps {
  passCount: number;
  failCount: number;
}

export function ResultPieChart({ passCount, failCount }: ResultPieChartProps) {
  const data = [
    { name: "pass", value: passCount, fill: "var(--color-pass)" },
    { name: "fail", value: failCount, fill: "var(--color-fail)" },
  ];

  const total = passCount + failCount;
  return (
    <div className="w-full h-full min-h-[300px] animate-in fade-in zoom-in-95 duration-700">
      <ChartContainer config={chartConfig} className="h-full w-full aspect-square max-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={80}
              strokeWidth={5}
              paddingAngle={5}
              cornerRadius={5}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-xs font-medium uppercase"
                        >
                          Candidates
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
      </ChartContainer>
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[hsl(var(--success))]" />
          <span className="text-sm font-medium text-muted-foreground">Passed: {passCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[hsl(var(--destructive))]" />
          <span className="text-sm font-medium text-muted-foreground">Failed: {failCount}</span>
        </div>
      </div>
    </div>
  );
}
