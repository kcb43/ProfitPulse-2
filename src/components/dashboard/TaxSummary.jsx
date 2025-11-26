import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, startOfYear, parseISO } from 'date-fns';

export default function TaxSummary({ sales, totalProfit }) {
  const currentYear = new Date().getFullYear();
  const yearStart = startOfYear(new Date());
  
  // Calculate year-to-date profit
  const ytdProfit = React.useMemo(() => {
    if (!sales || sales.length === 0) return 0;
    
    return sales.reduce((sum, sale) => {
      if (!sale.sale_date) return sum;
      try {
        const saleDate = parseISO(sale.sale_date);
        if (saleDate >= yearStart) {
          return sum + (sale.profit || 0);
        }
      } catch (e) {
        return sum;
      }
      return sum;
    }, 0);
  }, [sales, yearStart]);

  // Estimate tax (rough estimate - 15.3% self-employment tax + income tax)
  // This is just a rough estimate, not tax advice
  const estimatedTax = React.useMemo(() => {
    // Rough estimate: 25-30% of profit for self-employment
    // This is NOT tax advice, just a rough estimate
    return ytdProfit * 0.275; // ~27.5% estimate
  }, [ytdProfit]);

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-l-4 border-emerald-500 h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
          <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Tax Summary {currentYear}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">YTD Profit</span>
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
              ${ytdProfit.toFixed(2)}
            </span>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-emerald-200 dark:border-emerald-800">
            <span className="text-sm text-gray-600 dark:text-gray-400">Est. Tax*</span>
            <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
              ${estimatedTax.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            *Rough estimate. Consult a tax professional for accurate calculations.
          </p>
          <Link to={createPageUrl("Reports")}>
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2 text-xs border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
            >
              <Calendar className="w-4 h-4" />
              View Tax Reports
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

