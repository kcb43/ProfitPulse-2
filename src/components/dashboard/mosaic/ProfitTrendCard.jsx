import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { format, parseISO, subDays } from "date-fns";

function buildSeries(sales, range) {
  const s = Array.isArray(sales) ? sales : [];
  const points = {};

  if (range === "14d") {
    const cutoff = subDays(new Date(), 13);
    const cutoffKey = format(cutoff, "yyyy-MM-dd");
    s.filter((x) => x?.sale_date && String(x.sale_date).slice(0, 10) >= cutoffKey).forEach((x) => {
      const k = String(x.sale_date).slice(0, 10);
      points[k] = (points[k] || 0) + (Number(x.profit ?? 0) || 0);
    });
    return Object.keys(points)
      .sort()
      .map((k) => ({ k, date: format(parseISO(k), "MMM dd"), v: points[k] }));
  }

  if (range === "monthly") {
    s.forEach((x) => {
      if (!x?.sale_date) return;
      const k = String(x.sale_date).slice(0, 7);
      points[k] = (points[k] || 0) + (Number(x.profit ?? 0) || 0);
    });
    return Object.keys(points)
      .sort()
      .slice(-12)
      .map((k) => ({ k, date: format(parseISO(`${k}-01`), "MMM yy"), v: points[k] }));
  }

  // yearly
  s.forEach((x) => {
    if (!x?.sale_date) return;
    const k = String(x.sale_date).slice(0, 4);
    points[k] = (points[k] || 0) + (Number(x.profit ?? 0) || 0);
  });
  return Object.keys(points)
    .sort()
    .slice(-6)
    .map((k) => ({ k, date: k, v: points[k] }));
}

export default function ProfitTrendCard({ sales, range, onRangeChange }) {
  const data = React.useMemo(() => buildSeries(sales, range), [sales, range]);
  const total = React.useMemo(() => data.reduce((sum, p) => sum + (Number(p.v || 0) || 0), 0), [data]);

  return (
    <Card className="border border-gray-200/70 dark:border-gray-800/70 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">Profit Trend</CardTitle>
            <div className="mt-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">${total.toFixed(0)}</span>{" "}
              <span className="text-muted-foreground">total</span>
            </div>
          </div>
          <Tabs value={range} onValueChange={onRangeChange}>
            <TabsList className="bg-muted/40">
              <TabsTrigger value="14d">14 Days</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <defs>
                <linearGradient id="poProfitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 2" stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickFormatter={(v) => `$${Number(v || 0).toFixed(0)}`}
              />
              <Tooltip
                formatter={(v) => [`$${Number(v || 0).toFixed(2)}`, "Profit"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#poProfitGrad)"
                dot={false}
                isAnimationActive={true}
                animationDuration={450}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}


