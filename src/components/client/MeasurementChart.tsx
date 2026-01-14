import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import type { ClientMeasurement } from "@/hooks/useClientProgress";

interface MeasurementChartProps {
  measurements: ClientMeasurement[];
  dataKey: keyof ClientMeasurement;
  label: string;
  color?: string;
  targetValue?: number;
}

export function MeasurementChart({ 
  measurements, 
  dataKey, 
  label, 
  color = "hsl(var(--primary))",
  targetValue
}: MeasurementChartProps) {
  const chartData = useMemo(() => {
    return [...measurements]
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map(m => ({
        date: m.recorded_at,
        value: m[dataKey] as number,
        formattedDate: format(new Date(m.recorded_at), "MMM d"),
      }));
  }, [measurements, dataKey]);

  const minValue = Math.min(...chartData.map(d => d.value).filter(v => v != null));
  const maxValue = Math.max(...chartData.map(d => d.value).filter(v => v != null));
  const padding = (maxValue - minValue) * 0.1;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            vertical={false}
          />
          <XAxis 
            dataKey="formattedDate" 
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis 
            domain={[minValue - padding, maxValue + padding]}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value: number) => [`${value.toFixed(1)}`, label]}
            labelFormatter={(label) => label}
          />
          {targetValue && (
            <ReferenceLine 
              y={targetValue} 
              stroke="hsl(var(--success))" 
              strokeDasharray="5 5"
              label={{ 
                value: `Target: ${targetValue}`, 
                fill: "hsl(var(--success))",
                fontSize: 11,
                position: "right"
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
