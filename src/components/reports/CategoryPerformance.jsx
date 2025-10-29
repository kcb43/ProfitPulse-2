import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function CategoryPerformance({ sales }) {
  const categoryData = React.useMemo(() => {
    const categories = sales.reduce((acc, sale) => {
      const category = sale.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = { sales: 0, revenue: 0, profit: 0 };
      }
      acc[category].sales += 1;
      acc[category].revenue += sale.selling_price || 0;
      acc[category].profit += sale.profit || 0;
      return acc;
    }, {});

    const totalProfit = Object.values(categories).reduce((sum, cat) => sum + cat.profit, 0);
    return Object.entries(categories)
      .map(([name, data]) => ({ name, ...data, percentage: totalProfit > 0 ? (data.profit / totalProfit) * 100 : 0}))
      .sort((a, b) => b.profit - a.profit);
  }, [sales]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gray-800 dark:bg-gray-800">
        <CardTitle className="text-xl font-bold text-white dark:text-white">Top Performing Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categoryData.map(cat => (
            <div key={cat.name}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-gray-900 dark:text-white">{cat.name}</span>
                <span className="font-bold text-green-600 text-lg">${cat.profit.toFixed(2)}</span>
              </div>
              <Progress value={cat.percentage} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-blue-500" />
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{cat.sales} sales</span>
                <span>${cat.revenue.toFixed(2)} revenue</span>
              </div>
            </div>
          ))}
          {categoryData.length === 0 && <p className="text-center text-gray-500 py-8">No sales with categories to report.</p>}
        </div>
      </CardContent>
    </Card>
  );
}