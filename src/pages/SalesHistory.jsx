
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Trash2, Package, Pencil, Copy, ArchiveRestore, TrendingUp, Zap, CalendarIcon as Calendar } from "lucide-react";
import { format, parseISO, differenceInDays, endOfDay } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";

const platformIcons = {
  ebay: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e86fb5ac26f8511acce7ec/0fd7174e9_294688_ebay_icon.png",
  facebook_marketplace: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e86fb5ac26f8511acce7ec/f0f473258_sdfsdv.jpeg",
  mercari: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e86fb5ac26f8511acce7ec/bd1b6983d_idtCxk9ltW_1760335987655.jpeg",
  etsy: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e86fb5ac26f8511acce7ec/8e08e47d1_Symbol.png",
  offer_up: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e86fb5ac26f8511acce7ec/c0f886f60_Symbol.png"
};

const platformColors = {
  ebay: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  facebook_marketplace: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100",
  etsy: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100",
  mercari: "bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-100",
  offer_up: "bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-100"
};

const platformNames = {
  ebay: "eBay",
  facebook_marketplace: "Facebook",
  etsy: "Etsy",
  mercari: "Mercari",
  offer_up: "OfferUp"
};

export default function SalesHistory() {
  const [filters, setFilters] = useState({
    searchTerm: "",
    platform: "all",
    minProfit: "",
    maxProfit: "",
    startDate: null,
    endDate: null,
  });
  const [sort, setSort] = useState({ by: "sale_date", order: "desc" }); // Default sort by sale_date desc

  const [selectedSales, setSelectedSales] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { data: rawSales, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
    initialData: [],
  });

  const salesWithMetrics = React.useMemo(() => {
    if (!rawSales) return [];

    // First, map and calculate metrics for each sale
    const salesWithCalculatedMetrics = rawSales.map(sale => {
      const purchasePrice = sale.purchase_price || 0;
      const profit = sale.profit || 0; // Assuming sale.profit is already calculated

      let roi = 0;
      if (purchasePrice > 0) {
        roi = (profit / purchasePrice) * 100;
      } else if (purchasePrice === 0) {
        if (profit > 0) {
          roi = Infinity; // Infinite ROI for positive profit with 0 purchase price
        } else if (profit < 0) {
          roi = -Infinity; // Negative Infinite ROI for negative profit with 0 purchase price
        } else { // profit === 0
          roi = 0; // 0 ROI for 0 profit with 0 purchase price
        }
      }

      const saleDate = parseISO(sale.sale_date);
      const purchaseDate = sale.purchase_date ? parseISO(sale.purchase_date) : null;
      const saleSpeed = purchaseDate ? differenceInDays(saleDate, purchaseDate) : null;

      return { ...sale, profit, roi, saleSpeed };
    });

    // Then, sort the sales based on current sort state
    return [...salesWithCalculatedMetrics].sort((a, b) => {
      let comparison = 0;
      switch (sort.by) {
        case 'profit':
          comparison = (b.profit || 0) - (a.profit || 0); // Highest profit first
          break;
        case 'roi':
          const aRoi = a.roi === Infinity ? Number.MAX_VALUE : (a.roi === -Infinity ? Number.MIN_SAFE_INTEGER : a.roi);
          const bRoi = b.roi === Infinity ? Number.MAX_VALUE : (b.roi === -Infinity ? Number.MIN_SAFE_INTEGER : b.roi);
          comparison = (bRoi || 0) - (aRoi || 0); // Highest ROI first
          break;
        case 'sale_speed':
          if (a.saleSpeed === null && b.saleSpeed === null) comparison = 0;
          else if (a.saleSpeed === null) comparison = 1;
          else if (b.saleSpeed === null) comparison = -1;
          else comparison = a.saleSpeed - b.saleSpeed;
          break;
        default: // "Most Recent" should sort by creation date
          comparison = new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
          break;
      }
      
      // For "Fastest Sale" (sale_speed), we want ascending order (smaller numbers first)
      if (sort.by === 'sale_speed') {
          return comparison; // `a.saleSpeed - b.saleSpeed` already gives ascending
      }
      
      // For all other sorts (profit, ROI, created_date), we want descending order
      return comparison;
    });
  }, [rawSales, sort]);

  const deleteSaleMutation = useMutation({
    mutationFn: async (sale) => {
      // If this sale was linked to an inventory item, update the inventory first
      if (sale.inventory_id) {
        try {
          const inventoryItem = await base44.entities.InventoryItem.get(sale.inventory_id);
          const quantitySoldInSale = sale.quantity_sold || 1;
          const newQuantitySold = Math.max(0, (inventoryItem.quantity_sold || 0) - quantitySoldInSale);
          
          await base44.entities.InventoryItem.update(sale.inventory_id, {
            quantity_sold: newQuantitySold,
            // Update status: if we still have sold quantity, keep current status; if all returned, set to available
            status: newQuantitySold === 0 ? "available" : (newQuantitySold < inventoryItem.quantity ? inventoryItem.status : "sold")
          });
        } catch (error) {
          console.error("Failed to update inventory item on sale deletion:", error);
          // Continue with sale deletion even if inventory update fails
        }
      }
      
      // Delete the sale
      return base44.entities.Sale.delete(sale.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      setDeleteDialogOpen(false);
      setSaleToDelete(null);
    },
    onError: (error) => {
      console.error("Failed to delete sale:", error);
      alert("Failed to delete sale. Please try again.");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (saleIds) => {
      // First, update inventory items for all sales that have inventory_id
      const salesToDelete = salesWithMetrics.filter(s => saleIds.includes(s.id));
      
      for (const sale of salesToDelete) {
        if (sale.inventory_id) {
          try {
            const inventoryItem = await base44.entities.InventoryItem.get(sale.inventory_id);
            const quantitySoldInSale = sale.quantity_sold || 1;
            const newQuantitySold = Math.max(0, (inventoryItem.quantity_sold || 0) - quantitySoldInSale);
            
            await base44.entities.InventoryItem.update(sale.inventory_id, {
              quantity_sold: newQuantitySold,
              status: newQuantitySold === 0 ? "available" : (newQuantitySold < inventoryItem.quantity ? inventoryItem.status : "sold")
            });
          } catch (error) {
            console.error("Failed to update inventory item on bulk sale deletion:", error);
            // Continue with other sales
          }
        }
      }
      
      // Then delete all sales
      return Promise.all(saleIds.map(id => base44.entities.Sale.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      setSelectedSales([]); // Corrected from setSelectedItems to setSelectedSales
      setBulkDeleteDialogOpen(false);
    },
    onError: (error) => {
      console.error("Failed to bulk delete sales:", error);
      alert("Failed to delete sales. Please try again.");
    },
  });

  const handleAddToInventory = (sale) => {
    const params = new URLSearchParams();
    params.set('itemName', sale.item_name);
    if (sale.purchase_price) params.set('purchasePrice', sale.purchase_price);
    if (sale.purchase_date) params.set('purchaseDate', sale.purchase_date);
    if (sale.source) params.set('source', sale.source);
    if (sale.category) params.set('category', sale.category);
    if (sale.image_url) params.set('imageUrl', sale.image_url);
    if (sale.notes) params.set('notes', sale.notes);

    navigate(createPageUrl(`AddInventoryItem?${params.toString()}`));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredSales = salesWithMetrics.filter(sale => {
    const matchesSearch = sale.item_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         sale.category?.toLowerCase().includes(filters.searchTerm.toLowerCase());
    const matchesPlatform = filters.platform === "all" || sale.platform === filters.platform;

    const profit = sale.profit || 0;
    const matchesMinProfit = filters.minProfit === "" || profit >= parseFloat(filters.minProfit);
    const matchesMaxProfit = filters.maxProfit === "" || profit <= parseFloat(filters.maxProfit);

    const saleDate = parseISO(sale.sale_date);
    const matchesStartDate = !filters.startDate || saleDate >= filters.startDate;
    // For endDate, ensure it includes the whole day by comparing against the end of the selected day
    const matchesEndDate = !filters.endDate || saleDate <= endOfDay(filters.endDate);

    return matchesSearch && matchesPlatform && matchesMinProfit && matchesMaxProfit && matchesStartDate && matchesEndDate;
  });

  const handleSelect = (saleId) => {
    setSelectedSales(prev =>
      prev.includes(saleId)
        ? prev.filter(id => id !== saleId)
        : [...prev, saleId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedSales(filteredSales.map(s => s.id));
    } else {
      setSelectedSales([]);
    }
  };

  const handleDeleteClick = (sale) => {
    setSaleToDelete(sale);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Sales History</h1>
          <p className="text-muted-foreground mt-1">View and manage all your sales</p>
        </div>

        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="border-b bg-gray-800 dark:bg-gray-800">
            <CardTitle className="flex items-center gap-2 text-white">
              <Filter className="w-5 h-5" />
              Filters & Sort
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="relative">
                <Label htmlFor="search">Search</Label>
                <Search className="absolute left-3 bottom-2.5 w-5 h-5 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Item name or category..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="pl-10"
                />
              </div>
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select value={filters.platform} onValueChange={(v) => handleFilterChange('platform', v)}>
                  <SelectTrigger id="platform">
                    <SelectValue placeholder="All Platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="ebay">eBay</SelectItem>
                    <SelectItem value="facebook_marketplace">Facebook</SelectItem>
                    <SelectItem value="etsy">Etsy</SelectItem>
                    <SelectItem value="mercari">Mercari</SelectItem>
                    <SelectItem value="offer_up">OfferUp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="min-profit">Min Profit</Label>
                    <Input id="min-profit" type="number" placeholder="$ Min" value={filters.minProfit} onChange={e => handleFilterChange('minProfit', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="max-profit">Max Profit</Label>
                    <Input id="max-profit" type="number" placeholder="$ Max" value={filters.maxProfit} onChange={e => handleFilterChange('maxProfit', e.target.value)} />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Sale Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <Calendar className="mr-2 h-4 w-4" />
                          {filters.startDate ? format(filters.startDate, "MMM d, yyyy") : "Pick Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarPicker mode="single" selected={filters.startDate} onSelect={d => handleFilterChange('startDate', d)} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Sale End Date</Label>
                     <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <Calendar className="mr-2 h-4 w-4" />
                          {filters.endDate ? format(filters.endDate, "MMM d, yyyy") : "Pick Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarPicker mode="single" selected={filters.endDate} onSelect={d => handleFilterChange('endDate', d)} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gray-800 dark:bg-gray-800">
            <div className="flex justify-between items-center flex-wrap gap-2">
              {selectedSales.length > 0 ? (
                <>
                  <CardTitle className="text-white">{selectedSales.length} sale(s) selected</CardTitle>
                  <Button variant="destructive" onClick={() => setBulkDeleteDialogOpen(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                </>
              ) : (
                <>
                  <CardTitle className="text-white">All Sales ({filteredSales.length})</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sort-by" className="text-sm font-medium text-white">Sort by:</Label>
                     <Select value={sort.by} onValueChange={(v) => setSort({ by: v })}>
                        <SelectTrigger id="sort-by" className="w-[180px]">
                           <SelectValue placeholder="Sort by"/>
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="sale_date">Most Recent</SelectItem>
                           <SelectItem value="profit">Highest Profit</SelectItem>
                           <SelectItem value="roi">Highest ROI</SelectItem>
                           <SelectItem value="sale_speed">Fastest Sale</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : (
              <div className="divide-y">
                {filteredSales.length > 0 && (
                  <div className="p-6 flex items-center gap-4 bg-gray-50/50 dark:bg-gray-800/30">
                    <Checkbox
                      checked={selectedSales.length === filteredSales.length && filteredSales.length > 0}
                      onCheckedChange={handleSelectAll}
                      id="select-all"
                      className="!bg-transparent !border-green-600 border-2 data-[state=checked]:!bg-green-600 data-[state=checked]:!border-green-600 [&[data-state=checked]]:!bg-green-600 [&[data-state=checked]]:!border-green-600"
                    />
                    <label htmlFor="select-all" className="font-medium text-sm text-foreground">Select All</label>
                  </div>
                )}
                {filteredSales.map((sale) => (
                  <div key={sale.id} className="flex items-start gap-4 p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                    <Checkbox
                      checked={selectedSales.includes(sale.id)}
                      onCheckedChange={() => handleSelect(sale.id)}
                      id={`select-${sale.id}`}
                      className="mt-1 !bg-transparent !border-green-600 border-2 data-[state=checked]:!bg-green-600 data-[state=checked]:!border-green-600 [&[data-state=checked]]:!bg-green-600 [&[data-state=checked]]:!border-green-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex items-start gap-3 mb-2">
                            <Link to={createPageUrl(`SoldItemDetail?id=${sale.id}`)} className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground text-lg break-words hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer">{sale.item_name}</h3>
                            </Link>
                            <Badge className={`${platformColors[sale.platform]} border flex-shrink-0`}>
                              {platformIcons[sale.platform] && <img src={platformIcons[sale.platform]} alt={platformNames[sale.platform]} className="w-4 h-4 mr-1.5 rounded-sm object-contain" />}
                              {platformNames[sale.platform]}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <p className="text-muted-foreground">Sale Date</p>
                              <p className="font-medium text-foreground">
                                {format(parseISO(sale.sale_date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Selling Price</p>
                              <p className="font-medium text-foreground">${sale.selling_price?.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Costs</p>
                              <p className="font-medium text-foreground">
                                ${((sale.purchase_price || 0) + (sale.shipping_cost || 0) + (sale.platform_fees || 0) + (sale.other_costs || 0)).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Profit</p>
                              <p className={`font-bold text-lg ${sale.profit >= 0 ? 'text-green-400 dark:text-green-400' : 'text-red-600'} ${sale.profit >= 0 ? 'dark:[text-shadow:0_0_6px_rgba(34,197,94,0.5)]' : ''}`}>
                                ${sale.profit?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm border-t border-gray-200 dark:border-gray-700 pt-3">
                             <div className="flex items-center text-foreground" title="Return on Investment">
                                <TrendingUp className="w-4 h-4 mr-1.5 text-blue-500"/>
                                <span className="font-medium">ROI:</span>
                                <span className="ml-1 font-semibold text-blue-600 dark:text-blue-400">
                                  {isFinite(sale.roi) ? `${sale.roi.toFixed(1)}%` : (sale.roi > 0 ? '∞%' : '-∞%')}
                                </span>
                             </div>
                             <div className="flex items-center text-foreground" title="Sale Speed">
                                <Zap className="w-4 h-4 mr-1.5 text-orange-500"/>
                                <span className="font-medium">Sold in:</span>
                                <span className="ml-1 font-semibold text-orange-600 dark:text-orange-400">
                                  {sale.saleSpeed !== null ? `${sale.saleSpeed} day(s)` : 'N/A'}
                                </span>
                             </div>
                          </div>
                          
                          {(sale.category || sale.notes || sale.image_url) && (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground mt-3">
                              {sale.image_url && (
                                <img src={sale.image_url} alt={sale.item_name} className="w-10 h-10 object-cover rounded-md border" />
                              )}
                              {sale.category && (
                                <p>
                                  <span className="font-medium">Category:</span> {sale.category}
                                </p>
                              )}
                              {sale.notes && (
                                <p className="italic">
                                  <span className="font-medium not-italic">Notes:</span> "{sale.notes}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center self-end md:self-start flex-shrink-0">
                          <Link to={createPageUrl(`AddSale?id=${sale.id}`)}>
                            <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              <Pencil className="w-5 h-5" />
                            </Button>
                          </Link>
                          <Link to={createPageUrl(`AddSale?copyId=${sale.id}`)}>
                            <Button variant="ghost" size="icon" className="text-foreground hover:text-foreground/80 hover:bg-muted/50">
                              <Copy className="w-5 h-5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAddToInventory(sale)}
                            className="text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <ArchiveRestore className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(sale)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredSales.length === 0 && (
                  <div className="p-12 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground text-lg">No sales found</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      {(filters.searchTerm || filters.platform !== "all" || filters.minProfit || filters.maxProfit || filters.startDate || filters.endDate)
                        ? "Try adjusting your filters"
                        : "Start adding sales to see them here"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sale?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{saleToDelete?.item_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSaleMutation.mutate(saleToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Sales?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the {selectedSales.length} selected sales? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate(selectedSales)}
              className="bg-red-600 hover:bg-red-700"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
