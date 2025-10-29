
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Zap, TrendingUp, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const StatHighlight = ({ icon: Icon, color, title, value, itemName, saleId }) => {
    if (!saleId) {
        return (
             <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className={`p-3 rounded-full bg-gray-200 dark:bg-gray-700`}>
                    <Icon className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">No sales this month yet.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className={`p-3 rounded-full bg-gradient-to-br ${color} text-white shadow-md flex-shrink-0`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
                <Link to={createPageUrl(`SoldItemDetail?id=${saleId}`)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block">
                    {itemName}
                </Link>
            </div>
        </div>
    );
};

export default function DealOfTheMonth({ sales }) {
  const deals = React.useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthlySales = sales.filter(sale => {
        try {
            const saleDate = parseISO(sale.sale_date);
            return isWithinInterval(saleDate, { start: monthStart, end: monthEnd });
        } catch(e) { return false; }
    });

    if (monthlySales.length === 0) {
      return { highestProfit: null, fastestSale: null, highestRoi: null };
    }

    let highestProfit = null;
    let fastestSale = null;
    let highestRoi = null;

    monthlySales.forEach(sale => {
      const profit = sale.profit || 0;
      const purchasePrice = sale.purchase_price || 0;
      let roi = 0;
      if (purchasePrice > 0) {
        roi = (profit / purchasePrice) * 100;
      } else if (purchasePrice === 0 && profit > 0) {
        roi = Infinity;
      }
      
      const saleWithRoi = { ...sale, roi };

      let saleSpeed = null;
      if (sale.purchase_date) {
        try {
            saleSpeed = differenceInDays(parseISO(sale.sale_date), parseISO(sale.purchase_date));
        } catch (e) {
            saleSpeed = null;
        }
      }
      const saleWithSpeed = { ...saleWithRoi, saleSpeed };

      if (!highestProfit || profit > highestProfit.profit) {
        highestProfit = saleWithSpeed;
      }
      if (saleWithSpeed.saleSpeed !== null && (!fastestSale || saleWithSpeed.saleSpeed < fastestSale.saleSpeed)) {
        fastestSale = saleWithSpeed;
      }
      if (!highestRoi || saleWithSpeed.roi > highestRoi.roi) {
        highestRoi = saleWithSpeed;
      }
    });

    return { highestProfit, fastestSale, highestRoi };
  }, [sales]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Gift className="w-5 h-5 text-blue-500"/>
            Deals of the Month ({format(new Date(), 'MMMM yyyy')})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatHighlight
                icon={Award}
                color="from-amber-400 to-yellow-500"
                title="Highest Profit"
                value={deals.highestProfit ? `$${deals.highestProfit.profit.toFixed(2)}` : "N/A"}
                itemName={deals.highestProfit?.item_name}
                saleId={deals.highestProfit?.id}
            />
            <StatHighlight
                icon={Zap}
                color="from-sky-400 to-cyan-500"
                title="Fastest Sale"
                value={deals.fastestSale ? `${deals.fastestSale.saleSpeed} Day${deals.fastestSale.saleSpeed === 1 ? '' : 's'}` : "N/A"}
                itemName={deals.fastestSale?.item_name}
                saleId={deals.fastestSale?.id}
            />
            <StatHighlight
                icon={TrendingUp}
                color="from-green-500 to-emerald-600"
                title="Highest ROI"
                value={deals.highestRoi ? (isFinite(deals.highestRoi.roi) ? `${deals.highestRoi.roi.toFixed(1)}%` : '∞%') : "N/A"}
                itemName={deals.highestRoi?.item_name}
                saleId={deals.highestRoi?.id}
            />
        </div>
      </CardContent>
    </Card>
  );
}
