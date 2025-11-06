import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Percent, TrendingUp, Timer } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import MonthlyPnlChart from "../components/reports/MonthlyPnlChart";
import CategoryPerformance from "../components/reports/CategoryPerformance";
import PlatformComparison from "../components/reports/PlatformComparison";
import StatCard from "../components/dashboard/StatCard";

export default function ReportsPage() {
  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
    initialData: [],
  });

  const { totalProfit, totalRevenue, avgProfit, profitMargin, averageSaleSpeed } = React.useMemo(() => {
    const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.selling_price || 0), 0);
    const avgProfit = sales.length > 0 ? totalProfit / sales.length : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const salesWithSpeed = sales
      .map(sale => {
        if (!sale.purchase_date || !sale.sale_date) return null;
        try {
          return differenceInDays(parseISO(sale.sale_date), parseISO(sale.purchase_date));
        } catch (e) {
          return null;
        }
      })
      .filter(speed => speed !== null && speed >= 0);
    
    const totalDays = salesWithSpeed.reduce((sum, speed) => sum + speed, 0);
    const averageSaleSpeed = salesWithSpeed.length > 0 ? totalDays / salesWithSpeed.length : 0;

    return { totalProfit, totalRevenue, avgProfit, profitMargin, averageSaleSpeed };
  }, [sales]);
  
  if(isLoading){
    return <div className="p-8"><Skeleton className="w-full h-96"/></div>
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Advanced Reports</h1>
          <p className="text-muted-foreground mt-1">Deep dive into your sales data.</p>
        </div>

        {/* Added stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Profit Margin"
            value={`${profitMargin.toFixed(1)}%`}
            icon={Percent}
            bgGradient="bg-gradient-to-br from-orange-500 to-red-600"
          />
          <StatCard
            title="Avg Profit/Sale"
            value={`$${avgProfit.toFixed(2)}`}
            icon={TrendingUp}
            bgGradient="bg-gradient-to-br from-sky-400 to-cyan-500"
          />
          <StatCard
            title="Avg. Time to Sell"
            value={`${averageSaleSpeed.toFixed(1)} Days`}
            icon={Timer}
            bgGradient="bg-gradient-to-br from-teal-400 to-emerald-500"
          />
        </div>

        <div className="space-y-8">
            <MonthlyPnlChart sales={sales} />
            <CategoryPerformance sales={sales} />
            <PlatformComparison sales={sales} />
        </div>
      </div>
    </div>
  );
}