import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { DollarSign, TrendingUp, Calendar, Info, Package } from 'lucide-react';

const DEFAULT_IMAGE_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e86fb5ac26f8511acce7ec/4abea2f77_box.png";

const platformNames = {
  ebay: "eBay",
  facebook_marketplace: "Facebook",
  etsy: "Etsy",
  mercari: "Mercari",
  offer_up: "OfferUp"
};

export default function ShowcaseItemModal({ item, isOpen, onClose }) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        <div className="flex flex-col md:grid md:grid-cols-2">
          <div className="order-1 md:order-2">
            <img 
              src={item.image_url || DEFAULT_IMAGE_URL} 
              alt={item.item_name} 
              className="w-full h-48 md:h-full object-cover md:rounded-r-lg" 
            />
          </div>
          <div className="p-4 md:p-6 order-2 md:order-1">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg font-bold pr-6">{item.item_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600"/>
                  Net Profit
                </span>
                <span className="font-bold text-lg text-green-600">${item.profit.toFixed(2)}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Sell Price</p>
                  <p className="font-semibold">${item.selling_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Buy Price</p>
                  <p className="font-semibold">${item.purchase_price.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500"/>
                  <span className="text-xs">ROI:</span>
                </div>
                <span className="font-bold text-blue-600">
                  {isFinite(item.roi) ? `${item.roi.toFixed(1)}%` : '∞%'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500"/>
                  <span className="text-xs">Days Listed:</span>
                </div>
                <span className="font-bold text-orange-600">{item.saleSpeed} Days</span>
              </div>

              <div className="pt-3 border-t space-y-2">
                <p className="flex items-center gap-2 text-xs">
                  <Package className="w-4 h-4 text-gray-500"/>
                  Sold on: <Badge variant="secondary" className="text-xs">{platformNames[item.platform]}</Badge>
                </p>
                <p className="flex items-center gap-2 text-xs">
                  <Calendar className="w-4 h-4 text-gray-500"/>
                  Date: {format(parseISO(item.sale_date), 'MMM dd, yyyy')}
                </p>
              </div>

              {item.notes && (
                <div className="pt-3 border-t">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0"/>
                    <div className="min-w-0">
                      <p className="font-medium text-xs text-gray-600 dark:text-gray-400">Notes</p>
                      <p className="italic text-xs break-words mt-1">"{item.notes}"</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}