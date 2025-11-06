
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, differenceInDays, isAfter } from "date-fns";
import { Plus, Package, DollarSign, Trash2, Edit, ShoppingCart, Tag, Filter, AlarmClock, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

const sourceIcons = {
  "Amazon": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e86fb5ac26f8511acce7ec/af08cfed1_Logo.png",
};

const statusColors = {
  available: "bg-blue-100 text-blue-800",
  listed: "bg-yellow-100 text-yellow-800",
  sold: "bg-gray-100 text-gray-800",
};

const DEFAULT_IMAGE_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e86fb5ac26f8511acce7ec/4abea2f77_box.png";

export default function InventoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filters, setFilters] = useState({ search: "", status: "not_sold", daysInStock: "all" });
  const [sort, setSort] = useState("newest");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [itemToSell, setItemToSell] = useState(null);
  const [quantityToSell, setQuantityToSell] = useState(1);

  const { data: inventoryItems, isLoading } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: () => base44.entities.InventoryItem.list('-purchase_date'),
    initialData: [],
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const filterParam = searchParams.get('filter');
    
    if (filterParam === 'stale') {
      setFilters(prev => ({ ...prev, daysInStock: "stale", status: "not_sold" }));
    } else if (filterParam === 'returnDeadline') {
      setFilters(prev => ({ ...prev, daysInStock: "returnDeadline", status: "not_sold" }));
    }
  }, [location.search]);

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId) => {
      try {
        await base44.entities.InventoryItem.delete(itemId);
        return itemId;
      } catch (error) {
        throw new Error(`Failed to delete item: ${error.message}`);
      }
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      toast({
        title: "Item Deleted",
        description: "The inventory item has been successfully removed.",
      });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Error Deleting Item",
        description: error.message || "Failed to delete item. Please try again.",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (itemIds) => {
      const results = [];
      for (const id of itemIds) {
        try {
          await base44.entities.InventoryItem.delete(id);
          results.push({ id, success: true });
        } catch (error) {
          results.push({ id, success: false, error: error.message });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      setSelectedItems([]);
      setBulkDeleteDialogOpen(false);
      
      if (failCount === 0) {
        toast({
          title: "Items Deleted",
          description: `${successCount} selected items have been successfully removed.`,
        });
      } else {
        toast({
          title: "Bulk Delete Completed",
          description: `Deleted ${successCount} items. ${failCount} items failed to delete.`,
          variant: failCount === results.length ? "destructive" : "default",
        });
      }
    },
    onError: (error) => {
      console.error("Bulk delete error:", error);
      toast({
        title: "Error Deleting Items",
        description: "Failed to delete items. Please try again.",
        variant: "destructive",
      });
      setBulkDeleteDialogOpen(false);
    },
  });

  const inventorySummary = React.useMemo(() => {
    const unsoldItems = inventoryItems.filter(item => item.status !== 'sold');
    const totalInvested = unsoldItems.reduce((sum, item) => sum + (item.purchase_price || 0), 0);
    const totalQuantity = unsoldItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    return { totalInvested, totalQuantity };
  }, [inventoryItems]);

  const filteredItems = inventoryItems.filter(item => {
    const today = new Date();

    const statusMatch = filters.status === "all" ||
      (filters.status === "not_sold" && item.status !== "sold") ||
      item.status === filters.status;
    const searchMatch = item.item_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.category?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.source?.toLowerCase().includes(filters.search.toLowerCase());
    
    let daysInStockMatch = true;
    if (filters.daysInStock !== "all" && item.status !== "sold") {
      if (filters.daysInStock === "stale") {
        if (item.purchase_date) {
          const daysSincePurchase = differenceInDays(today, parseISO(item.purchase_date));
          daysInStockMatch = daysSincePurchase >= 14;
        } else {
          daysInStockMatch = false;
        }
      } else if (filters.daysInStock === "returnDeadline") {
        if (item.return_deadline) {
          const deadline = parseISO(item.return_deadline);
          const daysUntilDeadline = differenceInDays(deadline, today);
          daysInStockMatch = daysUntilDeadline >= 0 && daysUntilDeadline <= 10;
        } else {
          daysInStockMatch = false;
        }
      }
    }
    
    return statusMatch && searchMatch && daysInStockMatch;
  });

  const sortedItems = React.useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      switch (sort) {
        case "newest":
          return new Date(b.created_date) - new Date(a.created_date);
        case "oldest":
          return new Date(a.created_date) - new Date(b.created_date);
        case "price-high":
          return (b.purchase_price || 0) - (a.purchase_price || 0);
        case "price-low":
          return (a.purchase_price || 0) - (b.purchase_price || 0);
        case "name-az":
          return a.item_name.localeCompare(b.item_name);
        case "name-za":
          return b.item_name.localeCompare(a.item_name);
        case "purchase-newest":
          return new Date(b.purchase_date) - new Date(a.purchase_date);
        case "purchase-oldest":
          return new Date(a.purchase_date) - new Date(b.purchase_date);
        default:
          return 0;
      }
    });
  }, [filteredItems, sort]);

  const handleSelect = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(sortedItems.map(i => i.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteItemMutation.mutate(itemToDelete.id);
    }
  };

  const confirmBulkDelete = () => {
    if (selectedItems.length > 0) {
      bulkDeleteMutation.mutate(selectedItems);
    }
  };

  const proceedToAddSale = (item, quantity) => {
    const params = new URLSearchParams();
    params.set('inventoryId', item.id);
    params.set('itemName', item.item_name);

    const perItemPrice = item.purchase_price / (item.quantity > 0 ? item.quantity : 1);
    params.set('purchasePrice', perItemPrice.toFixed(2));
    
    params.set('purchaseDate', item.purchase_date);
    if (item.source) params.set('source', item.source);
    if (item.category) params.set('category', item.category);
    if (item.image_url) params.set('imageUrl', item.image_url);
    params.set('inventoryQuantity', item.quantity);
    params.set('soldQuantity', quantity);

    navigate(createPageUrl(`AddSale?${params.toString()}`));
  };

  const handleMarkAsSold = (item) => {
    const availableToSell = item.quantity - (item.quantity_sold || 0);
    if (availableToSell > 1) {
      setItemToSell(item);
      setQuantityToSell(1);
      setQuantityDialogOpen(true);
    } else if (availableToSell === 1) {
      proceedToAddSale(item, 1);
    }
  };

  const handleQuantityDialogConfirm = () => {
    const availableToSell = itemToSell.quantity - (itemToSell.quantity_sold || 0);
    if (itemToSell && quantityToSell > 0 && quantityToSell <= availableToSell) {
      proceedToAddSale(itemToSell, quantityToSell);
      setQuantityDialogOpen(false);
      setItemToSell(null);
      setQuantityToSell(1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inventory</h1>
              <p className="text-sm text-muted-foreground mt-1">Track items you have for sale.</p>
            </div>
            <Link to={createPageUrl("AddInventoryItem")}>
              <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-md w-full sm:w-auto">
                <Plus className="w-5 h-5 mr-2" />
                Add Item
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Invested</p>
                  <p className="text-xl font-bold text-foreground">${inventorySummary.totalInvested.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Items in Stock</p>
                  <p className="text-xl font-bold text-foreground">{inventorySummary.totalQuantity}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg mb-4">
            <CardHeader className="border-b bg-gray-800 dark:bg-gray-800">
              <CardTitle className="text-base sm:text-lg text-white">Filters & Sort</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <Label htmlFor="search" className="text-xs mb-1.5 block">Search</Label>
                  <div className="relative">
                    <Input 
                      id="search"
                      placeholder="Search..." 
                      value={filters.search} 
                      onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} 
                      className="pl-8"
                    />
                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status" className="text-xs mb-1.5 block">Status</Label>
                  <Select id="status" value={filters.status} onValueChange={val => setFilters(f => ({ ...f, status: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_sold">Available/Listed</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="listed">Listed</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="all">All Items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="days" className="text-xs mb-1.5 block">Age</Label>
                  <Select id="days" value={filters.daysInStock} onValueChange={val => setFilters(f => ({ ...f, daysInStock: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ages</SelectItem>
                      <SelectItem value="stale">14+ Days</SelectItem>
                      <SelectItem value="returnDeadline">Return Soon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sort" className="text-xs mb-1.5 block">Sort By</Label>
                  <Select id="sort" value={sort} onValueChange={setSort}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="name-az">Name: A to Z</SelectItem>
                      <SelectItem value="name-za">Name: Z to A</SelectItem>
                      <SelectItem value="purchase-newest">Purchase: Newest</SelectItem>
                      <SelectItem value="purchase-oldest">Purchase: Oldest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedItems.length > 0 && (
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4">
              <span className="text-sm font-medium">
                {selectedItems.length} item(s) selected
              </span>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          )}

          {sortedItems.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-gray-800 dark:bg-gray-800 rounded-t-lg">
              <Checkbox
                checked={selectedItems.length === sortedItems.length && sortedItems.length > 0}
                onCheckedChange={handleSelectAll}
                id="select-all"
                className="!bg-transparent !border-green-600 border-2 data-[state=checked]:!bg-green-600 data-[state=checked]:!border-green-600 [&[data-state=checked]]:!bg-green-600 [&[data-state=checked]]:!border-green-600"
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer text-white">
                Select All ({sortedItems.length})
              </label>
            </div>
          )}

          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Loading...</div>
          ) : sortedItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {sortedItems.map(item => {
                const today = new Date();
                const deadline = item.return_deadline ? parseISO(item.return_deadline) : null;
                const daysRemaining = deadline && isAfter(deadline, today) ? differenceInDays(deadline, today) + 1 : null;
                const perItemPrice = item.purchase_price / (item.quantity > 0 ? item.quantity : 1);
                const quantitySold = item.quantity_sold || 0;
                const isSoldOut = quantitySold >= item.quantity;
                const availableToSell = item.quantity - quantitySold;

                return (
                  <Card key={item.id} className="group overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => handleSelect(item.id)}
                          id={`select-${item.id}`}
                          className="!bg-transparent !border-green-600 border-2 data-[state=checked]:!bg-green-600 data-[state=checked]:!border-green-600 [&[data-state=checked]]:!bg-green-600 [&[data-state=checked]]:!border-green-600 backdrop-blur"
                        />
                      </div>
                      
                      <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                        <img 
                          src={item.image_url || DEFAULT_IMAGE_URL}
                          alt={item.item_name} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className={`${statusColors[item.status]} text-[10px] px-1.5 py-0.5`}>
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-2 min-h-[2.5rem] text-foreground">{item.item_name}</h3>
                      
                      <div className="space-y-1.5 text-xs mb-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price:</span>
                          <span className="font-medium text-foreground">
                            ${item.purchase_price.toFixed(2)}
                            {item.quantity > 1 && (
                              <span className="text-muted-foreground ml-1">(${perItemPrice.toFixed(2)} ea)</span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Qty:</span>
                          <span className="font-medium text-foreground">
                            {item.quantity}
                            {quantitySold > 0 && (
                              <span className={`ml-1 ${isSoldOut ? 'text-red-600 font-bold' : 'text-blue-600'}`}>
                                {isSoldOut ? '(Sold Out)' : `(${quantitySold} sold)`}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-medium text-foreground">{format(parseISO(item.purchase_date), 'MMM dd')}</span>
                        </div>
                      </div>

                      {daysRemaining !== null && (
                        <div className="mb-3 p-1.5 bg-red-100 dark:bg-red-900/30 border-l-2 border-red-500 rounded-r text-red-800 dark:text-red-200">
                          <p className="font-semibold text-[10px] flex items-center gap-1">
                            <AlarmClock className="w-3 h-3" />
                            {daysRemaining}d to return
                          </p>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        {!isSoldOut && item.status !== 'sold' && availableToSell > 0 && (
                          <Button 
                            onClick={() => handleMarkAsSold(item)} 
                            className="w-full bg-green-600 hover:bg-green-700 h-8 text-xs"
                          >
                            <ShoppingCart className="w-3 h-3 mr-1.5" />
                            Mark Sold
                          </Button>
                        )}
                        <div className="grid grid-cols-3 gap-1">
                          <Link to={createPageUrl(`AddInventoryItem?id=${item.id}`)} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full h-7 px-2">
                              <Edit className="w-3 h-3" />
                            </Button>
                          </Link>
                          <Link to={createPageUrl(`AddInventoryItem?copyId=${item.id}`)} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full h-7 px-2">
                              <Copy className="w-3 h-3" />
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteClick(item)} 
                            disabled={deleteItemMutation.isPending && itemToDelete?.id === item.id}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-7 px-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-muted-foreground text-lg">No inventory items found</p>
              <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters or add a new item.</p>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.item_name}"? This is permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteItemMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteItemMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Items?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the {selectedItems.length} selected items? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedItems([])}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={quantityDialogOpen} onOpenChange={setQuantityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How many did you sell?</DialogTitle>
            <DialogDescription>
              You have {itemToSell?.quantity - (itemToSell?.quantity_sold || 0)} of "{itemToSell?.item_name}" available. How many are you marking as sold?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="quantity-to-sell">Quantity Sold</Label>
            <Input
              id="quantity-to-sell"
              type="number"
              min="1"
              max={itemToSell ? itemToSell.quantity - (itemToSell.quantity_sold || 0) : 1}
              value={quantityToSell}
              onChange={(e) => setQuantityToSell(parseInt(e.target.value, 10) || 1)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuantityDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleQuantityDialogConfirm}
              className="bg-green-600 hover:bg-green-700"
              disabled={quantityToSell < 1 || quantityToSell > (itemToSell ? itemToSell.quantity - (itemToSell.quantity_sold || 0) : 1)}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
