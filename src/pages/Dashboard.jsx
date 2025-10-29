
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, ShoppingBag, Percent, Plus, Package, AlarmClock, X, Lightbulb, Timer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format, parseISO, differenceInDays, isAfter } from 'date-fns';

import StatCard from "../components/dashboard/StatCard";
import ProfitChart from "../components/dashboard/ProfitChart";
import PlatformBreakdown from "../components/dashboard/PlatformBreakdown";
import RecentSales from "../components/dashboard/RecentSales";
import Gamification from "../components/dashboard/Gamification";
import TipOfTheDay from "../components/dashboard/TipOfTheDay";
import DealOfTheMonth from "../components/dashboard/DealOfTheMonth";

export default function Dashboard() {
  const [profitChartRange, setProfitChartRange] = useState('14d');
  const [showReturnBanner, setShowReturnBanner] = useState(true);
  const [showStaleItemBanner, setShowStaleItemBanner] = useState(true);

  const { data: rawSales, isLoading: isLoadingSales } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
    initialData: [],
  });

  const sales = React.useMemo(() => {
    if (!rawSales) return [];
    return [...rawSales].sort((a, b) => {
      const dateComparison = new Date(b.sale_date) - new Date(a.sale_date);
      if (dateComparison !== 0) return dateComparison;
      return new Date(b.created_date) - new Date(a.created_date);
    });
  }, [rawSales]);
  
  // New query for inventory items
  const { data: inventoryItems, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: () => base44.entities.InventoryItem.list(),
    initialData: [],
  });

  // Memo to calculate items with upcoming return deadlines
  const itemsWithUpcomingReturns = React.useMemo(() => {
    if (!inventoryItems) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    return inventoryItems.filter(item => {
      if (!item.return_deadline || item.status === 'sold') return false; // Only consider unsold items with a deadline
      
      try {
        const deadline = parseISO(item.return_deadline);
        // Check if deadline is today or in the future
        if (isAfter(deadline, today) || format(deadline, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
          const daysLeft = differenceInDays(deadline, today);
          return daysLeft >= 0 && daysLeft <= 10; // Deadline is within the next 10 days (inclusive of today)
        }
      } catch (e) {
        // Invalid date format, ignore item.
        console.warn("Could not parse return_deadline for item:", item.id, item.return_deadline, e);
        return false;
      }
      return false;
    });
  }, [inventoryItems]);

  // New memo to calculate stale inventory items
  const staleItems = React.useMemo(() => {
    if (!inventoryItems) return [];
    const today = new Date();
    return inventoryItems.filter(item => {
      if (item.status === 'sold' || !item.purchase_date) return false;
      try {
        const purchaseDate = parseISO(item.purchase_date);
        const daysSincePurchase = differenceInDays(today, purchaseDate);
        return daysSincePurchase >= 14;
      } catch (e) {
        console.warn("Could not parse purchase_date for stale item check:", item.id, e);
        return false;
      }
    });
  }, [inventoryItems]);

  const { totalProfit, totalRevenue, totalSales, avgProfit, profitMargin, averageSaleSpeed } = React.useMemo(() => {
    const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.selling_price || 0), 0);
    const totalCosts = sales.reduce((sum, sale) => {
      const costs = (sale.purchase_price || 0) + 
                   (sale.shipping_cost || 0) + 
                   (sale.platform_fees || 0) + 
                   (sale.other_costs || 0); 
      return sum + costs;
    }, 0);
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

    return { totalProfit, totalRevenue, totalSales: sales.length, avgProfit, profitMargin, averageSaleSpeed };
  }, [sales]);

  // Calculation for inventory stats
  const inventoryStats = React.useMemo(() => {
    const unsoldItems = inventoryItems.filter(item => item.status !== 'sold');
    const totalQuantity = unsoldItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    return { totalQuantity };
  }, [inventoryItems]);
  
  // Updated isLoading to include inventory loading state
  const isLoading = isLoadingSales || isLoadingInventory;

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 bg-gray-50 dark:bg-gray-900/95">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-48 mb-8 bg-gray-200 dark:bg-gray-800" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 bg-gray-200 dark:bg-gray-800" />)}
          </div>
          <Skeleton className="h-96 bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your reselling business performance</p>
          </div>
          <Link to={createPageUrl("AddSale")}>
            <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-md">
              <Plus className="w-5 h-5 mr-2" />
              Add Sale
            </Button>
          </Link>
        </div>

        {/* Return Deadline Banner */}
        {itemsWithUpcomingReturns.length > 0 && showReturnBanner && (
          <Alert className="mb-8 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-200 relative group">
            <AlarmClock className="h-4 w-4 !text-yellow-700 dark:!text-yellow-400" />
            <div className="flex justify-between items-start w-full">
              <div className="pr-8">
                <AlertTitle className="font-bold">Return Deadlines Approaching!</AlertTitle>
                <AlertDescription>
                  You have {itemsWithUpcomingReturns.length} item(s) with return deadlines within the next 10 days.
                  <Link to={createPageUrl("Inventory?filter=returnDeadline")} className="font-semibold underline ml-2 hover:text-yellow-800 dark:hover:text-yellow-100">
                    View Items
                  </Link>
                </AlertDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2 opacity-60 group-hover:opacity-100 transition-opacity" onClick={() => setShowReturnBanner(false)}>
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

        {/* New Stale Inventory Banner */}
        {staleItems.length > 0 && showStaleItemBanner && (
          <Alert className="mb-8 border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200 relative group">
            <Lightbulb className="h-4 w-4 !text-blue-700 dark:!text-blue-400" />
            <div className="flex justify-between items-start w-full">
              <div className="pr-8">
                <AlertTitle className="font-bold">Smart Reminder</AlertTitle>
                <AlertDescription>
                  {staleItems.length === 1 ? (
                    <>Your <span className="font-semibold text-blue-700 dark:text-blue-300">"{staleItems[0].item_name}"</span> has been sitting for 14+ days.</>
                  ) : (
                    <>{staleItems.length} items have been sitting for 14+ days.</>
                  )}
                  {' '}Consider dropping the price by 5% to boost sales.
                  <Link to={createPageUrl("Inventory?filter=stale")} className="font-semibold underline ml-2 hover:text-blue-800 dark:hover:text-blue-100">
                    View Items
                  </Link>
                </AlertDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2 opacity-60 group-hover:opacity-100 transition-opacity" onClick={() => setShowStaleItemBanner(false)}>
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

        {/* Updated grid layout for 6 stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Profit"
            value={`$${totalProfit.toFixed(2)}`}
            icon={DollarSign}
            bgGradient="bg-gradient-to-br from-green-500 to-emerald-600"
          />
          <StatCard
            title="Total Sales"
            value={totalSales}
            icon={ShoppingBag}
            bgGradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          />
          {/* New StatCard for Inventory */}
          <StatCard
            title="Items in Stock"
            value={inventoryStats.totalQuantity}
            icon={Package}
            bgGradient="bg-gradient-to-br from-purple-500 to-pink-600"
          />
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

        {/* Removed AiInsights component and adjusted grid for Gamification and TipOfTheDay */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Gamification sales={sales} stats={{ totalProfit, totalSales, avgProfit, profitMargin, averageSaleSpeed }} />
          <TipOfTheDay />
        </div>

        {/* Deal of the Month Component */}
        <div className="mb-6">
            <DealOfTheMonth sales={sales} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Profit Chart (Mobile: 1st, Desktop: Row 1, Col 1-4) */}
          <div className="lg:col-span-4 lg:row-start-1">
            <ProfitChart sales={sales} range={profitChartRange} onRangeChange={setProfitChartRange} />
          </div>

          {/* Platform Breakdown (Mobile: 3rd, Desktop: Row 1, Col 5-6) */}
          <div className="lg:col-span-2 lg:row-start-1">
            <PlatformBreakdown sales={sales} />
          </div>
            
          {/* Recent Sales (Mobile: 2nd, Desktop: Row 2, Col 1-6) */}
          <div className="lg:col-span-full">
             <RecentSales sales={sales} />
          </div>
        </div>
      </div>
    </div>
  );
}
