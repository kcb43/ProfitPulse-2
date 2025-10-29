
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO, startOfMonth } from 'date-fns';

export default function MonthlyPnlChart({ sales }) {
  const data = React.useMemo(() => {
    const monthlyData = sales.reduce((acc, sale) => {
      const month = format(startOfMonth(parseISO(sale.sale_date)), 'yyyy-MM');
      if (!acc[month]) {
        acc[month] = { revenue: 0, cost: 0, profit: 0, month: format(startOfMonth(parseISO(sale.sale_date)), 'MMM yyyy') };
      }
      const cost = (sale.purchase_price || 0) + (sale.shipping_cost || 0) + (sale.platform_fees || 0) + (sale.other_costs || 0);
      acc[month].revenue += sale.selling_price || 0;
      acc[month].cost += cost;
      acc[month].profit += sale.profit || 0;
      return acc;
    }, {});
    
    return Object.values(monthlyData).sort((a,b) => new Date(a.month) - new Date(b.month)).slice(-12);
  }, [sales]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gray-800 dark:bg-gray-800">
        <CardTitle className="text-xl font-bold text-white dark:text-white">Monthly Profit & Loss</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '12px' }}/>
            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} tickFormatter={(value) => `$${value}`}/>
            <Tooltip
              formatter={(value) => `$${value.toFixed(2)}`}
              cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
              contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}
            />
            <Legend wrapperStyle={{fontSize: '14px'}}/>
            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]}/>
            <Bar dataKey="cost" fill="#f97316" name="Costs" radius={[4, 4, 0, 0]}/>
            <Bar dataKey="profit" fill="#22c55e" name="Profit" radius={[4, 4, 0, 0]}/>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
