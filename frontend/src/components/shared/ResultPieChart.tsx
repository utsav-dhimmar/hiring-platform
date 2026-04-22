import { Pie, PieChart as RechartsPieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { RESUME_SCREENING_RESULT } from "@/constants";

const chartConfig = {
  pass: {
    label: RESUME_SCREENING_RESULT.PASS,
    color: "#4ade80"
  },
  fail: {
    label: RESUME_SCREENING_RESULT.FAIL,
    color: "#fca5a5"
  },
} satisfies ChartConfig;

interface ResultPieChartProps {
  passCount: number;
  failCount: number;
}

export function ResultPieChart({ passCount, failCount }: ResultPieChartProps) {
  const data = [
    { name: "Pass", value: passCount, fill: "#4ade80" },
    { name: "Fail", value: failCount, fill: "#fca5a5" },
  ].filter((item) => item.value > 0);

  const total = passCount + failCount;
  const hasData = total > 0;

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-700">
      <div className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[200px] px-0"
        >
          {hasData ? (
            <RechartsPieChart>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="value" hideLabel />}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                labelLine={false}
                label={({ payload, ...props }) => {
                  return (
                    <text
                      cx={props.cx}
                      cy={props.cy}
                      x={props.x}
                      y={props.y}
                      textAnchor={props.textAnchor}
                      dominantBaseline={props.dominantBaseline}
                      fill="var(--foreground)"
                      className="text-[10px] font-bold sm:text-xs"
                    >
                      {payload.value}
                    </text>
                  );
                }}
              />
            </RechartsPieChart>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm italic">
              No processing data available
            </div>
          )}
        </ChartContainer>
      </div>

      <div className="flex flex-col gap-2 text-sm pt-4 items-center">
        <div className="flex flex-wrap justify-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.3)]"
              style={{ background: "#4ade80" }}
            />
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground"> <span className="capitalize">{RESUME_SCREENING_RESULT.PASS}</span>: {passCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full shadow-[0_0_8px_rgba(252,165,165,0.3)]"
              style={{ background: "#fca5a5" }}
            />
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">
              <span className="capitalize">{RESUME_SCREENING_RESULT.FAIL}</span>: {failCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


