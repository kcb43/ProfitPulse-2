import React from 'react';
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ title, value, icon: Icon, trend, bgGradient }) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 ${bgGradient} rounded-full opacity-10`} />
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 [.dark_&]:!text-white">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${bgGradient} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${bgGradient.replace('bg-gradient-to-br', 'text').split(' ')[0].replace('to-', '')}`} />
          </div>
        </div>
        {trend && (
          <div className="flex items-center mt-4 text-sm">
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
            )}
            <span className={trend.isPositive ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {trend.value}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}