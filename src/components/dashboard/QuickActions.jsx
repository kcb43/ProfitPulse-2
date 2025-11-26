import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Package, Layers, BarChart3, FileText } from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      title: "Add Inventory",
      icon: Package,
      link: createPageUrl("AddInventoryItem"),
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Add Sale",
      icon: Plus,
      link: createPageUrl("AddSale"),
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "Create Listing",
      icon: Layers,
      link: createPageUrl("Crosslist"),
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      title: "View Reports",
      icon: BarChart3,
      link: createPageUrl("Reports"),
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20"
    }
  ];

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.link}>
                <Button
                  variant="outline"
                  className={`w-full h-auto flex flex-col items-center justify-center gap-2 p-4 hover:shadow-md transition-all ${action.bgColor} border-2 hover:border-opacity-50`}
                >
                  <Icon className={`w-5 h-5 ${action.color}`} />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {action.title}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

