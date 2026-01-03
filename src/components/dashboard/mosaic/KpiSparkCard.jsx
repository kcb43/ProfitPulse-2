import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

function slugifyId(input) {
  return String(input || "kpi")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function KpiSparkCard({
  title,
  value,
  deltaLabel,
  deltaPositive,
  data,
  stroke = "hsl(var(--po-info))",
  right,
}) {
  const deltaClass = deltaPositive
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : "bg-red-500/10 text-red-700 dark:text-red-300";

  const gradId = React.useMemo(() => `kpiGrad-${slugifyId(title)}`, [title]);

  return (
    <Card className="border border-gray-200/70 dark:border-gray-800/70 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {title}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {value}
              </div>
              {deltaLabel ? (
                <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${deltaClass}`}>
                  {deltaLabel}
                </div>
              ) : null}
            </div>
          </div>
          {right ? (
            <div className="flex items-center justify-end h-14 min-w-[56px]">{right}</div>
          ) : (
            <div className="h-14 w-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data || []}>
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={stroke}
                    strokeWidth={2}
                    strokeLinecap="round"
                    fill={`url(#${gradId})`}
                    fillOpacity={1}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={450}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


