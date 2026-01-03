import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BarChart3, CalendarDays, GalleryHorizontal, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function HubCard({ title, description, to, icon: Icon, gradient }) {
  return (
    <Link to={to} className="block">
      <Card className="border border-border/60 bg-card/60 hover:bg-muted/40 transition-colors shadow-sm">
        <CardContent className="p-4 flex items-start gap-3">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-md`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-foreground">{title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Analytics() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
        <Card className="border border-border/60 shadow-sm bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            Reports and insights across your reselling business.
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <HubCard
            title="Reports"
            description="Category + tax + summaries"
            to={createPageUrl("Reports")}
            icon={FileText}
            gradient="from-orange-500 via-amber-500 to-yellow-600"
          />
          <HubCard
            title="Profit Calendar"
            description="Calendar view of profit"
            to={createPageUrl("ProfitCalendar")}
            icon={CalendarDays}
            gradient="from-emerald-500 to-green-500"
          />
          <HubCard
            title="Showcase"
            description="Your top flips and highlights"
            to={createPageUrl("Gallery")}
            icon={GalleryHorizontal}
            gradient="from-purple-500 to-pink-600"
          />
        </div>
      </div>
    </div>
  );
}


