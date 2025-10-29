import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const platformNames = {
  ebay: "eBay", facebook_marketplace: "Facebook", etsy: "Etsy", mercari: "Mercari", offer_up: "OfferUp"
};

export default function PlatformComparison({ sales }) {
  const platformData = React.useMemo(() => {
    const platforms = sales.reduce((acc, sale) => {
      const platform = sale.platform;
      if (!acc[platform]) {
        acc[platform] = { name: platformNames[platform], sales: 0, revenue: 0, profit: 0 };
      }
      acc[platform].sales += 1;
      acc[platform].revenue += sale.selling_price || 0;
      acc[platform].profit += sale.profit || 0;
      return acc;
    }, {});

    return Object.values(platforms).map(p => ({
      ...p,
      avgProfit: p.sales > 0 ? p.profit / p.sales : 0,
      profitMargin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0
    })).sort((a, b) => b.profit - a.profit);
  }, [sales]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Platform Comparison</CardTitle>
      </CardHeader>
      
      {/* --- Mobile View --- */}
      <div className="md:hidden p-4 space-y-4">
        {platformData.map(p => (
          <div key={p.name} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-lg text-gray-900 dark:text-white">{p.name}</span>
              <span className="font-bold text-lg text-green-600">${p.profit.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-900 dark:text-white border-t pt-3">
              <div><span className="font-medium">Total Sales:</span> {p.sales}</div>
              <div><span className="font-medium">Avg. Profit:</span> ${p.avgProfit.toFixed(2)}</div>
              <div><span className="font-medium">Revenue:</span> ${p.revenue.toFixed(2)}</div>
              <div><span className="font-medium">Margin:</span> {p.profitMargin.toFixed(1)}%</div>
            </div>
          </div>
        ))}
        {platformData.length === 0 && <p className="text-center text-gray-500 py-8">No platform data to compare.</p>}
      </div>

      {/* --- Desktop View --- */}
      <CardContent className="p-0 hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-900 dark:text-white">Platform</TableHead>
                <TableHead className="text-right text-gray-900 dark:text-white">Total Sales</TableHead>
                <TableHead className="text-right text-gray-900 dark:text-white">Total Revenue</TableHead>
                <TableHead className="text-right text-gray-900 dark:text-white">Total Profit</TableHead>
                <TableHead className="text-right text-gray-900 dark:text-white">Avg. Profit/Sale</TableHead>
                <TableHead className="text-right text-gray-900 dark:text-white">Profit Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platformData.map(p => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium whitespace-nowrap text-gray-900 dark:text-white">{p.name}</TableCell>
                  <TableCell className="text-right text-gray-900 dark:text-white">{p.sales}</TableCell>
                  <TableCell className="text-right text-gray-900 dark:text-white">${p.revenue.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">${p.profit.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-gray-900 dark:text-white">${p.avgProfit.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-gray-900 dark:text-white">{p.profitMargin.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {platformData.length === 0 && <p className="text-center text-gray-500 py-8">No platform data to compare.</p>}
        </div>
      </CardContent>
    </Card>
  );
}