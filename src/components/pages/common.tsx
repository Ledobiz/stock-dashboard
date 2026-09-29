import { ChevronDown } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import type { ApiHorizon } from "@/lib/api";
import { API_HORIZONS, horizonLabel } from "@/lib/format";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>
          {title}
          <span className="heading-period">.</span>
        </h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function HorizonTabs({
  value,
  onChange,
}: {
  value: ApiHorizon;
  onChange: (v: ApiHorizon) => void;
}) {
  return (
    <div className="segmented">
      {API_HORIZONS.map((h) => (
        <Button
          key={h}
          variant="ghost"
          className={value === h ? "chosen" : ""}
          onClick={() => onChange(h)}
        >
          {horizonLabel(h)}
        </Button>
      ))}
    </div>
  );
}

export function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: (string | [value: string, label: string])[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="filter-select">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((x) =>
          typeof x === "string" ? (
            <option key={x}>{x}</option>
          ) : (
            <option key={x[0]} value={x[0]}>
              {x[1]}
            </option>
          ),
        )}
      </select>
      <ChevronDown size={14} />
    </label>
  );
}

export const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--foreground)",
};

export const axisTick = { fill: "var(--muted-foreground)", fontSize: 11 };

/** An area chart over real data points; `x` and `y` name the fields. */
export function SeriesChart<T extends object>({
  data,
  x,
  y,
  color = "var(--chart-positive)",
  height = 260,
  format,
}: {
  data: T[];
  x: keyof T & string;
  y: keyof T & string;
  color?: string;
  height?: number;
  format?: (v: number) => string;
}) {
  const id = `fill-${y}-${color.replace(/[^a-z]/gi, "")}`;
  return (
    <div style={{ height }} className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 5" />
          <XAxis dataKey={x} tickLine={false} axisLine={false} tick={axisTick} minTickGap={32} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            width={64}
            domain={["auto", "auto"]}
            {...(format ? { tickFormatter: format } : {})}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            {...(format ? { formatter: (v: unknown) => format(Number(v)) } : {})}
          />
          <Area
            type="monotone"
            dataKey={y}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            dot={false}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
