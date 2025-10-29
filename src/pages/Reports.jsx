
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import MonthlyPnlChart from "../components/reports/MonthlyPnlChart";
import CategoryPerformance from "../components/reports/CategoryPerformance";
import PlatformComparison from "../components/reports/PlatformComparison";

export default function ReportsPage() {
  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
    initialData: [],
  });
  
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
        <div className="space-y-8">
            <MonthlyPnlChart sales={sales} />
            <CategoryPerformance sales={sales} />
            <PlatformComparison sales={sales} />
        </div>
      </div>
    </div>
  );
}
