import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const platformNames = {
  ebay: "eBay",
  facebook_marketplace: "Facebook",
  mercari: "Mercari",
  etsy: "Etsy",
  offer_up: "OfferUp",
};

export default function RecentSalesTable({ sales }) {
  const rows = React.useMemo(() => {
    const s = Array.isArray(sales) ? sales : [];
    return s.filter((x) => !x?.deleted_at).slice(0, 10);
  }, [sales]);

  return (
    <Card className="border border-gray-200/70 dark:border-gray-800/70 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">Recent Sales</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Item</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => {
                const revenue = Number(s?.selling_price ?? s?.sale_price ?? 0) || 0;
                const profit = Number(s?.profit ?? 0) || 0;
                const positive = profit >= 0;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link
                        className="hover:underline"
                        to={createPageUrl(`SoldItemDetail?id=${encodeURIComponent(s.id)}`)}
                      >
                        {s.item_name || "Untitled"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {(platformNames[s.platform] || s.platform || "other").replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">${revenue.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={positive ? "text-emerald-600 dark:text-emerald-300" : "text-red-600 dark:text-red-300"}>
                        {positive ? "" : "-"}${Math.abs(profit).toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No sales yet
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}


