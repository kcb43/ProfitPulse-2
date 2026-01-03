import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = ["#6366f1", "#60a5fa", "#34d399", "#f472b6", "#fbbf24", "#94a3b8"];

export default function PlatformDonutCard({ rows, title = "Platform Mix" }) {
  const data = React.useMemo(() => {
    const arr = Array.isArray(rows) ? rows : [];
    return arr
      .map((r) => ({
        name: String(r?.platform || "other"),
        value: Number(r?.total_revenue ?? r?.selling_price ?? 0) || 0,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [rows]);

  const total = React.useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data]
  );

  return (
    <Card className="border border-gray-200/70 dark:border-gray-800/70 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                formatter={(v) => [`$${Number(v || 0).toFixed(2)}`, "Revenue"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={92}
                paddingAngle={2}
                stroke="transparent"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex items-center justify-center text-sm text-muted-foreground">
          Total: <span className="ml-2 font-semibold text-foreground">${total.toFixed(2)}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="capitalize">{d.name.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


