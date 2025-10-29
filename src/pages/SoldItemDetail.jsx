
import React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, DollarSign, Tag, ShoppingCart, Calendar, Upload, BarChart, Info, FileText, TrendingUp, Percent, Zap, Pencil, Trash2 } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";

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

const platformNames = {
  ebay: "eBay",
  facebook_marketplace: "Facebook",
  etsy: "Etsy",
  mercari: "Mercari",
  offer_up: "OfferUp"
};

const platformColors = {
  ebay: "bg-blue-500 text-white border-blue-600 dark:bg-blue-700 dark:text-gray-100 dark:border-blue-800",
  facebook_marketplace: "bg-indigo-500 text-white border-indigo-600 dark:bg-indigo-700 dark:text-gray-100 dark:border-indigo-800",
  etsy: "bg-orange-500 text-white border-orange-600 dark:bg-orange-700 dark:text-gray-100 dark:border-orange-800",
  mercari: "bg-red-500 text-white border-red-600 dark:bg-red-700 dark:text-gray-100 dark:border-red-800",
  offer_up: "bg-green-500 text-white border-green-600 dark:bg-green-700 dark:text-gray-100 dark:border-green-800",
  default: "bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
};

const sourceIcons = {
  "Amazon": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e86fb5ac26f8511acce7ec/af08cfed1_Logo.png",
};

const DEFAULT_IMAGE_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e86fb5ac26f8511acce7ec/4abea2f77_box.png";

function ImageUploader({ saleId, saleItemName }) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = React.useState(false);

  const mutation = useMutation({
    mutationFn: async ({ file, itemName }) => {
      setIsUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const salesToUpdate = await base44.entities.Sale.filter({ item_name: itemName });
      const updatePromises = salesToUpdate.map(sale => 
        base44.entities.Sale.update(sale.id, { image_url: file_url })
      );
      await Promise.all(updatePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale'] });
      setIsUploading(false);
    },
    onError: () => {
      setIsUploading(false);
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && saleItemName) {
      mutation.mutate({ file, itemName: saleItemName });
    }
  };

  return (
    <div className="mt-6">
      <Label htmlFor="image-upload" className="font-semibold text-gray-700 dark:text-gray-300">Update Image</Label>
      <div className="flex items-center gap-2 mt-2">
        <Input id="image-upload" type="file" onChange={handleFileChange} className="flex-1 dark:bg-gray-800 dark:text-white dark:border-gray-700" disabled={isUploading} />
        <Button onClick={() => document.getElementById('image-upload').click()} disabled={isUploading} className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </div>
  );
}

export default function SoldItemDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(location.search);
  const saleId = searchParams.get('id');

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const { data: sale, isLoading, isError } = useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => base44.entities.Sale.get(saleId),
    enabled: !!saleId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (saleId) => {
      const saleToDelete = await base44.entities.Sale.get(saleId);
      
      if (saleToDelete.inventory_id) {
        try {
          const inventoryItem = await base44.entities.InventoryItem.get(saleToDelete.inventory_id);
          const quantitySoldInSale = saleToDelete.quantity_sold || 1;
          const newQuantitySold = Math.max(0, (inventoryItem.quantity_sold || 0) - quantitySoldInSale);
          const isSoldOut = newQuantitySold >= inventoryItem.quantity;
          
          await base44.entities.InventoryItem.update(saleToDelete.inventory_id, {
            quantity_sold: newQuantitySold,
            status: isSoldOut ? "sold" : (newQuantitySold > 0 ? inventoryItem.status : "available")
          });
        } catch (error) {
          console.error("Failed to update inventory item on sale deletion:", error);
        }
      }
      
      return base44.entities.Sale.delete(saleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      navigate(createPageUrl("Dashboard"));
    },
    onError: (error) => {
      console.error("Error deleting sale:", error);
    },
    onSettled: () => {
      setDeleteDialogOpen(false);
    }
  });

  const handleDelete = () => {
    if (saleId) {
      deleteMutation.mutate(saleId);
    }
  };
  
  const purchasePrice = sale?.purchase_price ?? 0;
  const shippingCost = sale?.shipping_cost ?? 0;
  const platformFees = sale?.platform_fees ?? 0;
  const otherCosts = sale?.other_costs ?? 0;

  const totalCosts = purchasePrice + shippingCost + platformFees + otherCosts;
  const profit = sale?.profit ?? 0;
  const sellingPrice = sale?.selling_price ?? 0;

  const roi = totalCosts > 0 ? (profit / totalCosts) * 100 : (profit > 0 ? Infinity : 0);
  const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : (profit > 0 ? Infinity : 0);

  let saleSpeed = null;
  if (sale?.sale_date && sale?.purchase_date) {
    try {
      const saleDate = parseISO(sale.sale_date);
      const purchaseDate = parseISO(sale.purchase_date);
      saleSpeed = differenceInDays(saleDate, purchaseDate);
    } catch (e) {
      console.error("Error parsing dates for sale speed:", e);
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto dark:bg-gray-900">
        <Skeleton className="h-8 w-48 mb-8 bg-gray-200 dark:bg-gray-700" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="w-full h-96 bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-24 w-full bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-24 w-full bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }
  
  if (isError || !sale) {
    return <div className="p-8 text-center text-red-500 dark:text-red-400 dark:bg-gray-900">Error: Could not load sale details.</div>
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white dark:text-white">{sale?.item_name}</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Sale Details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg overflow-hidden dark:bg-gray-800">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-4">
                <img 
                  src={sale?.image_url || DEFAULT_IMAGE_URL} 
                  alt={sale?.item_name} 
                  className="w-full h-full object-contain"
                />
              </div>
              <CardContent className="pt-6">
                <ImageUploader saleId={sale.id} saleItemName={sale.item_name} />
              </CardContent>
            </Card>

            {sale?.notes && (
              <Card className="border-0 shadow-sm dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                    <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 italic">"{sale.notes}"</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800">
              <CardHeader className="border-b border-green-100 dark:border-green-800">
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-400">
                  <DollarSign className="w-6 h-6" />
                  Net Profit
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-4xl md:text-5xl font-bold text-green-600 dark:text-green-400">
                  ${profit?.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">Sale Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Selling Price</span>
                  <span className="font-semibold text-white dark:text-white">${sellingPrice?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Platform</span>
                  <Badge className={`${platformColors[sale?.platform] || platformColors.default}`}>
                    {platformNames[sale?.platform] || "N/A"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sale Date</span>
                  <span className="font-semibold text-white dark:text-white">
                    {sale && format(parseISO(sale.sale_date), 'MMM dd, yyyy')}
                  </span>
                </div>
                {sale?.category && (
                  <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Category</span>
                    <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-200">{sale.category}</Badge>
                  </div>
                )}
                {sale?.source && (
                  <div className="flex justify-between items-center py-2 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Source</span>
                    <span className="font-semibold text-white dark:text-white">
                      {sourceIcons[sale.source] ? (
                        <img src={sourceIcons[sale.source]} alt={sale.source} className="w-auto h-4 object-contain inline-block mr-1 align-text-bottom" />
                      ) : sale.source}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Purchase Price</span>
                  <span className="font-semibold text-white dark:text-white">${purchasePrice?.toFixed(2)}</span>
                </div>
                {shippingCost > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Shipping</span>
                    <span className="font-semibold text-white dark:text-white">${shippingCost?.toFixed(2)}</span>
                  </div>
                )}
                {platformFees > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Platform Fees</span>
                    <span className="font-semibold text-white dark:text-white">${platformFees?.toFixed(2)}</span>
                  </div>
                )}
                {otherCosts > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Other Costs</span>
                    <span className="font-semibold text-white dark:text-white">${otherCosts?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t dark:border-gray-700 font-semibold">
                  <span className="text-white dark:text-white">Total Costs</span>
                  <span className="text-white dark:text-white">${totalCosts.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ROI</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {isFinite(roi) ? `${roi.toFixed(1)}%` : '∞%'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profit Margin</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {isFinite(profitMargin) ? `${profitMargin.toFixed(1)}%` : '∞%'}
                  </span>
                </div>
                {saleSpeed !== null && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sale Speed</span>
                  </div>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {saleSpeed} days
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Link to={createPageUrl("AddSale", { searchItemName: sale?.item_name })} className="flex-1">
                <Button variant="outline" className="w-full dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white">
                  <BarChart className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </Link>
              <Link to={createPageUrl(`AddSale?id=${sale?.id}`)} className="flex-1">
                <Button variant="outline" className="w-full dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="flex-1 dark:bg-red-700 dark:hover:bg-red-600 dark:text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Delete Sale?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-300">
              Are you sure you want to delete this sale? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 dark:text-white"
            >
              {deleteMutation.isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
