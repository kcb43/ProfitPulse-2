
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  parseISO,
  startOfWeek,
  endOfWeek,
  getDaysInMonth
} from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom'; // Assuming react-router-dom for Link

// Dummy createPageUrl for compilation. In a real app, this would be a real utility.
const createPageUrl = (url) => url;

export default function ProfitCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSales, setSelectedSales] = useState([]);

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
    initialData: [],
  });

  // Helper functions for month navigation
  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  // Helper function for day click (dialog)
  const handleDayClick = (day, salesForDay) => {
    setSelectedDay(day);
    setSelectedSales(salesForDay);
    setDialogOpen(true);
  };

  // Re-evaluation of calendar data and profit aggregation
  const { profitByDay, calendarDays } = useMemo(() => {
    // Calendar should cover 6 weeks to ensure all days of the month are visible
    // Start of week is Sunday by default in date-fns, but explicitly setting for clarity
    const calendarStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 }); 
    const calendarEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 }); 

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Aggregate sales data by day
    const aggregatedProfitByDay = {};
    sales.forEach(sale => {
      let saleDate;
      try {
        saleDate = parseISO(sale.sale_date);
      } catch (error) {
        // console.error("Error parsing sale_date:", sale.sale_date, error);
        return; // Skip this sale if date is invalid
      }

      const formattedDate = format(saleDate, 'yyyy-MM-dd');
      if (!aggregatedProfitByDay[formattedDate]) {
        aggregatedProfitByDay[formattedDate] = { profit: 0, sales: [] };
      }
      aggregatedProfitByDay[formattedDate].profit += (sale.profit || 0);
      aggregatedProfitByDay[formattedDate].sales.push(sale);
    });

    return {
      profitByDay: aggregatedProfitByDay,
      calendarDays: days
    };
  }, [sales, currentMonth]);

  // Re-evaluation of monthly stats
  const { monthlyProfit, monthlySalesCount, avgDailyProfit } = useMemo(() => {
    let totalProfit = 0;
    let salesCount = 0;
    const daysInCurrentMonth = getDaysInMonth(currentMonth);

    // Filter sales only for the current month
    const salesInCurrentMonth = sales.filter(sale => {
      try {
        return isSameMonth(parseISO(sale.sale_date), currentMonth);
      } catch {
        return false;
      }
    });

    salesInCurrentMonth.forEach(sale => {
      totalProfit += (sale.profit || 0);
      salesCount++;
    });

    const averageDaily = daysInCurrentMonth > 0 ? totalProfit / daysInCurrentMonth : 0;

    return {
      monthlyProfit: totalProfit,
      monthlySalesCount: salesCount,
      avgDailyProfit: averageDaily
    };
  }, [sales, currentMonth]);

  if (isLoading) {
    return <div className="p-4 sm:p-8 text-center text-gray-700 dark:text-gray-300">Loading calendar...</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Profit Calendar</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Track your daily profits at a glance</p>
        </div>

        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="border-b bg-gray-800 dark:bg-gray-800 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-lg sm:text-xl text-white">
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleToday}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-3">
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map((day, index) => {
                const dayData = profitByDay[format(day, 'yyyy-MM-dd')];
                const profit = dayData?.profit || 0;
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <div
                    key={index}
                    onClick={() => dayData && handleDayClick(day, dayData.sales)}
                    className={`
                      aspect-square p-1 rounded-lg text-center flex flex-col justify-between
                      ${!isCurrentMonth ? 'opacity-30' : ''}
                      ${isToday ? 'ring-2 ring-blue-500' : ''}
                      ${dayData ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
                      ${profit > 0 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-gray-50 dark:bg-gray-800/50'}
                    `}
                  >
                    <div className={`text-[10px] sm:text-xs font-medium ${
                      dayData 
                        ? 'text-foreground' 
                        : 'text-muted-foreground'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    {dayData && (
                      <div className="text-[9px] sm:text-[10px] font-bold text-green-600 dark:text-green-400">
                        ${profit.toFixed(0)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">This Month</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 [.dark_&]:!text-white">${monthlyProfit.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Sales Count</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 [.dark_&]:!text-white">{monthlySalesCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Avg Daily</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 [.dark_&]:!text-white">${avgDailyProfit.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Sales on {selectedDay && format(selectedDay, 'MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedSales.map(sale => (
              <Link key={sale.id} to={createPageUrl(`SoldItemDetail?id=${sale.id}`)}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-foreground">{sale.item_name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Sold for ${sale.selling_price?.toFixed(2)}
                        </p>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        +${sale.profit?.toFixed(2)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
