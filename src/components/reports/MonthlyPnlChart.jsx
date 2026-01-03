
import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { format, parseISO, startOfMonth } from 'date-fns';

export default function MonthlyPnlChart({ sales, rangeLabel }) {
  const descriptor = React.useMemo(() => {
    if (!rangeLabel) return "Recent period";
    return rangeLabel.toLowerCase() === "lifetime" ? "Lifetime view" : `Last ${rangeLabel}`;
  }, [rangeLabel]);

  const data = React.useMemo(() => {
    // Prefer pre-aggregated series when available (server-side reports summary).
    if (Array.isArray(sales) && sales.length > 0 && sales[0]?.month && sales[0]?.profit !== undefined && sales[0]?.revenue !== undefined) {
      return sales;
    }

    const monthlyData = sales.reduce((acc, sale) => {
      if (!sale.sale_date) {
        return acc;
      }
      const month = format(startOfMonth(parseISO(sale.sale_date)), 'yyyy-MM');
      if (!acc[month]) {
        acc[month] = {
          revenue: 0,
          costs: 0,
          profit: 0,
          monthLabel: format(startOfMonth(parseISO(sale.sale_date)), 'MMM yyyy'),
          monthKey: month,
        };
      }
      const cost = (sale.purchase_price || 0) + (sale.shipping_cost || 0) + (sale.platform_fees || 0) + (sale.other_costs || 0);
      acc[month].revenue += sale.selling_price || 0;
      acc[month].costs += cost;
      acc[month].profit += sale.profit || 0;
      return acc;
    }, {});

    return Object.values(monthlyData)
      .sort((a, b) => (a.monthKey > b.monthKey ? 1 : -1))
      .slice(-12)
      .map(({ monthLabel, revenue, costs, profit }) => ({
        month: monthLabel,
        revenue,
        costs,
        profit,
      }));
  }, [sales]);

  const gridStroke = "hsl(var(--border))";
  const tickColor = "hsl(var(--muted-foreground))";
  const tooltipBg = "hsl(var(--popover))";
  const tooltipFg = "hsl(var(--foreground))";

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-background p-4 shadow-lg dark:border-white/10 dark:bg-zinc-950">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-muted-foreground">Monthly P&amp;L</div>
            <div className="text-lg font-semibold text-foreground">Revenue vs Costs</div>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Not enough sales in this range to render the chart.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-background p-4 shadow-lg dark:border-white/10 dark:bg-zinc-950">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-muted-foreground">Monthly P&amp;L</div>
          <div className="text-lg font-semibold text-foreground">Revenue vs Costs</div>
        </div>
        <div className="rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/5">
          Profit highlighted
        </div>
      </div>

      <div className="h-64 md:h-96 lg:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 6" stroke={gridStroke} />
            <XAxis
              dataKey="month"
              tick={{ fill: tickColor }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: tickColor }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                background: tooltipBg,
                color: tooltipFg,
                border: `1px solid ${gridStroke}`,
                borderRadius: 12,
              }}
              labelStyle={{ color: tickColor }}
              formatter={(value) => `$${Number(value).toFixed(2)}`}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#60a5fa"
              fill="rgba(96,165,250,0.25)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="costs"
              stroke="#fb923c"
              fill="rgba(251,146,60,0.18)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#22c55e"
              strokeWidth={3}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        {data.slice(-3).map((d) => (
          <div key={d.month} className="rounded-xl border border-border/60 bg-muted/20 p-2 dark:border-white/10 dark:bg-white/5">
            <div className="text-muted-foreground">{d.month}</div>
            <div className="text-foreground font-semibold">${Math.round(d.profit || 0).toLocaleString()}</div>
            <div className="text-muted-foreground">profit</div>
          </div>
        ))}
      </div>
    </div>
  );
}
