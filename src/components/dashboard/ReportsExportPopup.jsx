import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ReportsExportPopup({ sales, totalProfit, totalSales }) {
  const currentYear = new Date().getFullYear();
  
  const handleExportCSV = () => {
    // TODO: Implement CSV export
    console.log('Export CSV clicked');
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Export PDF clicked');
  };

  return (
    <div className="p-6 space-y-4">
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Quick Downloads</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-2 text-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            CSV Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="flex items-center gap-2 text-xs"
          >
            <FileText className="w-4 h-4" />
            PDF Report
          </Button>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Tax Reports</p>
        <Link to={createPageUrl("Reports", { tab: "tax" })}>
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-start gap-2 text-xs"
          >
            <Calendar className="w-4 h-4" />
            {currentYear} Tax Summary
          </Button>
        </Link>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <Link to={createPageUrl("Reports")}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            View Full Reports →
          </Button>
        </Link>
      </div>
    </div>
  );
}

