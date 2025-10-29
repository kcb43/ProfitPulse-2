
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Calculator, Copy, Upload, Calendar as CalendarIcon, BarChart } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const platformOptions = [
  { value: "ebay", label: "eBay" },
  { value: "facebook_marketplace", label: "Facebook" },
  { value: "etsy", label: "Etsy" },
  { value: "mercari", label: "Mercari" },
  { value: "offer_up", label: "OfferUp" }
];

const PREDEFINED_SOURCES = ["Amazon", "Walmart", "Best Buy"];
const PREDEFINED_CATEGORIES = [
  "Electronics",
  "Clothing & Apparel",
  "Home & Garden",
  "Kitchen",
  "Toys & Hobbies",
  "Collectibles",
  "Books, Movies & Music",
  "Sporting Goods",
  "Tools",
  "Health & Beauty",
  "Jewelry & Watches",
  "Antiques"
];


export default function AddSale() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const searchParams = new URLSearchParams(location.search);
  const inventoryId = searchParams.get('inventoryId');
  const saleId = searchParams.get('id'); // For editing
  const copyId = searchParams.get('copyId'); // For copying
  
  const idToLoad = saleId || copyId; // This will be the ID for fetching an existing sale

  const { data: existingSale, isLoading: isLoadingSale } = useQuery({
    queryKey: ['sale', idToLoad],
    queryFn: () => base44.entities.Sale.get(idToLoad),
    enabled: !!idToLoad, // Only fetch if saleId or copyId is present
  });

  // NEW: Fetch inventory item details if inventoryId is present and we're creating a new sale
  const { data: inventoryItemDetails, isLoading: isLoadingInventoryItem } = useQuery({
    queryKey: ['inventoryItemForSaleCreation', inventoryId], // Unique key for this specific use case
    queryFn: () => base44.entities.InventoryItem.get(inventoryId),
    enabled: !!inventoryId && !idToLoad, // Only fetch if linking from inventory and not editing/copying a sale
    staleTime: 0, // Ensure we get the latest quantity_sold when creating a new sale
  });

  // Prefill from inventory item, if present, used only for initial creation from inventory
  const itemNameFromUrl = searchParams.get('itemName');
  const purchasePriceFromUrl = searchParams.get('purchasePrice');
  const purchaseDateFromUrl = searchParams.get('purchaseDate');
  const sourceFromUrl = searchParams.get('source');
  const categoryFromUrl = searchParams.get('category');
  const imageUrlFromUrl = searchParams.get('imageUrl');
  const soldQuantityFromUrl = searchParams.get('soldQuantity'); // NEW: Read sold quantity from URL

  const [formData, setFormData] = useState({
    item_name: "",
    platform: "",
    purchase_price: "",
    purchase_date: new Date().toISOString().split('T')[0],
    source: "",
    selling_price: "",
    shipping_cost: "",
    platform_fees: "",
    other_costs: "",
    vat_fees: "",
    sale_date: new Date().toISOString().split('T')[0],
    category: "",
    notes: "",
    image_url: "",
    quantity_sold: 1, // Default for new sales
  });

  // NEW: Store per-item purchase price for multi-quantity inventory items
  const [perItemPurchasePrice, setPerItemPurchasePrice] = useState(null);

  // NEW: Calculate available quantity for the input field based on fetched inventory details
  const totalItemQuantity = inventoryItemDetails?.quantity || 0;
  const soldFromItem = inventoryItemDetails?.quantity_sold || 0;
  const remainingItemQuantity = totalItemQuantity - soldFromItem;
  
  // NEW: Calculate remaining after the current sale quantity
  const currentQuantityToSell = parseInt(formData.quantity_sold, 10) || 0;
  const remainingAfterThisSale = remainingItemQuantity - currentQuantityToSell;

  const [calculatedProfit, setCalculatedProfit] = useState(null);
  const [isOtherSource, setIsOtherSource] = useState(false);
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setIsOtherSource(false);
    setIsOtherCategory(false);
    
    if (existingSale) {
      const dataToLoad = { ...existingSale };
      if (copyId) {
        dataToLoad.sale_date = new Date().toISOString().split('T')[0];
        dataToLoad.profit = null;
        delete dataToLoad._id;
        dataToLoad.notes = '';
        dataToLoad.inventory_id = null; // Don't copy inventory association when creating a new sale from an existing one
      }

      setFormData(prev => ({
        ...prev,
        ...dataToLoad,
        purchase_price: String(dataToLoad.purchase_price ?? ''),
        selling_price: String(dataToLoad.selling_price ?? ''),
        shipping_cost: String(dataToLoad.shipping_cost ?? ''),
        platform_fees: String(dataToLoad.platform_fees ?? ''),
        other_costs: String(dataToLoad.other_costs ?? ''),
        vat_fees: String(dataToLoad.vat_fees ?? ''),
        notes: dataToLoad.notes ?? '',
        quantity_sold: String(dataToLoad.quantity_sold ?? 1),
      }));

      const currentSource = dataToLoad.source;
      if (currentSource && !PREDEFINED_SOURCES.includes(currentSource)) {
        setIsOtherSource(true);
      }

      const currentCategory = dataToLoad.category;
      if (currentCategory && !PREDEFINED_CATEGORIES.includes(currentCategory)) {
        setIsOtherCategory(true);
      }

    } else if (inventoryId && !idToLoad && inventoryItemDetails) { // Add inventoryItemDetails as condition
      const initialSource = sourceFromUrl || "";
      const initialCategory = categoryFromUrl || "";
      const initialQuantitySold = soldQuantityFromUrl ? parseInt(soldQuantityFromUrl, 10) : 1; // NEW: Parse sold quantity from URL

      // FIX: purchasePriceFromUrl is ALREADY the per-item price (calculated in Inventory.js)
      const calculatedPerItemPrice = parseFloat(purchasePriceFromUrl) || 0;
      const initialPurchasePrice = calculatedPerItemPrice * initialQuantitySold;

      // Store the per-item price for future calculations
      setPerItemPurchasePrice(calculatedPerItemPrice);

      setFormData(prev => ({
        ...prev,
        item_name: itemNameFromUrl || "",
        purchase_price: initialPurchasePrice.toFixed(2), // Set calculated price based on quantity
        purchase_date: purchaseDateFromUrl || new Date().toISOString().split('T')[0],
        source: initialSource,
        category: initialCategory,
        image_url: imageUrlFromUrl || "",
        sale_date: new Date().toISOString().split('T')[0],
        quantity_sold: initialQuantitySold, // NEW: Set the quantity from URL
      }));

      if (initialSource && !PREDEFINED_SOURCES.includes(initialSource)) {
        setIsOtherSource(true);
      }
      if (initialCategory && !PREDEFINED_CATEGORIES.includes(initialCategory)) {
        setIsOtherCategory(true);
      }
    }
  }, [existingSale, inventoryId, idToLoad, copyId, itemNameFromUrl, purchasePriceFromUrl, purchaseDateFromUrl, sourceFromUrl, categoryFromUrl, imageUrlFromUrl, soldQuantityFromUrl, inventoryItemDetails]);

  // NEW: Update purchase_price when quantity_sold changes (only for inventory items)
  useEffect(() => {
    if (inventoryId && !idToLoad && perItemPurchasePrice !== null) {
      const quantitySold = parseInt(formData.quantity_sold, 10) || 1;
      const newPurchasePrice = perItemPurchasePrice * quantitySold;
      setFormData(prev => ({
        ...prev,
        purchase_price: newPurchasePrice.toFixed(2)
      }));
    }
  }, [formData.quantity_sold, inventoryId, idToLoad, perItemPurchasePrice]);

  const saleMutation = useMutation({
    mutationFn: (saleData) => {
      const purchasePrice = parseFloat(saleData.purchase_price) || 0;
      const sellingPrice = parseFloat(saleData.selling_price) || 0;
      const shippingCost = parseFloat(saleData.shipping_cost) || 0;
      const platformFees = parseFloat(saleData.platform_fees) || 0;
      const otherCosts = parseFloat(saleData.other_costs) || 0;
      const vatFees = parseFloat(saleData.vat_fees) || 0;
      const quantitySold = parseInt(saleData.quantity_sold, 10) || 1;

      const totalCosts = purchasePrice + shippingCost + platformFees + otherCosts + vatFees;
      const profit = sellingPrice - totalCosts;

      const finalData = { 
        ...saleData, 
        purchase_price: purchasePrice, 
        selling_price: sellingPrice, 
        shipping_cost: shippingCost, 
        platform_fees: platformFees, 
        other_costs: otherCosts,
        vat_fees: vatFees,
        profit: profit,
        quantity_sold: quantitySold,
        inventory_id: inventoryId || saleData.inventory_id || null // Added inventory_id here
      };
      
      if (saleId) {
        return base44.entities.Sale.update(saleId, finalData);
      }
      return base44.entities.Sale.create(finalData);
    },
    onSuccess: async () => {
      // Invalidate sales queries first
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      
      // Update inventory item quantity_sold for NEW sales created from inventory
      if (inventoryId && !saleId && !copyId) {
        try {
            // Get the latest inventory item state
            const originalItem = await base44.entities.InventoryItem.get(inventoryId);
            const quantitySold = parseInt(formData.quantity_sold, 10) || 1;
            
            // Update quantity_sold by adding the newly sold quantity
            const newQuantitySold = (originalItem.quantity_sold || 0) + quantitySold;
            // Check if all items are now sold
            const isSoldOut = newQuantitySold >= originalItem.quantity;
            
            await base44.entities.InventoryItem.update(inventoryId, { 
                quantity_sold: newQuantitySold,
                // If sold out, set status to "sold"; otherwise, maintain existing status
                status: isSoldOut ? "sold" : originalItem.status
            });
            
            // Invalidate inventory queries to refresh the display
            queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryItemForSaleCreation', inventoryId] });
        } catch (error) {
            console.error("Failed to update inventory item quantity_sold:", error);
            alert("Sale created but failed to update inventory. Please refresh the page.");
        }
      }
      
      navigate(createPageUrl(saleId || copyId ? "SalesHistory" : "Dashboard"));
    },
    onError: (error) => {
      console.error("Failed to save sale:", error);
      alert("Failed to save sale. Please try again.");
    },
  });

  const handleChange = (field, value) => {
    if (field === 'quantity_sold') {
      const parsedValue = parseInt(value, 10);
      let finalValue = isNaN(parsedValue) ? '' : parsedValue;

      // If creating a new sale from inventory, enforce max quantity based on remaining
      if (inventoryId && !idToLoad && remainingItemQuantity > 0) {
        if (parsedValue > remainingItemQuantity) {
          finalValue = remainingItemQuantity;
        } else if (parsedValue < 1) { // Ensure minimum of 1 if valid
            finalValue = 1;
        }
      } else if (isNaN(parsedValue) || parsedValue < 1) { // For other cases, ensure minimum of 1
        finalValue = 1;
      }

      setFormData(prev => ({ ...prev, [field]: finalValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('image_url', file_url);
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      e.target.value = null; 
    }
  };

  const handleSourceSelectChange = (value) => {
    if (value === 'other') {
      setIsOtherSource(true);
      handleChange('source', '');
    } else {
      setIsOtherSource(false);
      handleChange('source', value);
    }
  };
  
  const handleCategorySelectChange = (value) => {
    if (value === 'other') {
      setIsOtherCategory(true);
      handleChange('category', '');
    } else {
      setIsOtherCategory(false);
      handleChange('category', value);
    }
  };

  const calculateProfit = () => {
    const purchasePrice = parseFloat(formData.purchase_price) || 0;
    const sellingPrice = parseFloat(formData.selling_price) || 0;
    const shippingCost = parseFloat(formData.shipping_cost) || 0;
    const platformFees = parseFloat(formData.platform_fees) || 0;
    const otherCosts = parseFloat(formData.other_costs) || 0;
    const vatFees = parseFloat(formData.vat_fees) || 0;

    const totalCosts = purchasePrice + shippingCost + platformFees + otherCosts + vatFees;
    const profit = sellingPrice - totalCosts;
    
    setCalculatedProfit(profit);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saleMutation.mutate(formData);
  };

  // Show a loading indicator if sale data is being fetched for edit/copy, or inventory data for new sale from inventory
  if (isLoadingSale || (inventoryId && !idToLoad && isLoadingInventoryItem)) {
    return <div className="p-8 text-center text-gray-700 dark:text-gray-300">Loading data...</div>
  }

  const isEbay = formData.platform === 'ebay';

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl(saleId || copyId ? "SalesHistory" : "Dashboard"))}
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{saleId ? "Edit Sale" : (copyId ? "Copy Sale" : "Add New Sale")}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{saleId ? "Update the details of this sale" : (copyId ? "Create a new sale from a copy" : "Record a new sale and track your profit")}</p>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gray-800 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl text-white dark:text-white">Sale Details</CardTitle>
              {copyId && (
                <Badge className="bg-orange-100 text-orange-800 border border-orange-200">Copied</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {inventoryId && !idToLoad && (
                    <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                        <AlertDescription className="dark:text-blue-200">
                            Creating a sale for inventory item: <span className="font-semibold">{formData.item_name}</span>
                        </AlertDescription>
                    </Alert>
                )}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="item_name" className="dark:text-gray-200">Item Name *</Label>
                  <Input
                    id="item_name"
                    value={formData.item_name}
                    onChange={(e) => handleChange('item_name', e.target.value)}
                    placeholder="e.g., Vintage Nike Sneakers"
                    required
                  />
                </div>

                {/* Search Button - Shows when item name is entered */}
                {formData.item_name && (
                  <div className="space-y-2 flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => alert('Search functionality coming soon! This will search for similar sold listings across all platforms.')}
                      className="w-full dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                      <BarChart className="w-4 h-4 mr-2" />
                      Search Sold Listings
                    </Button>
                  </div>
                )}

                {/* Quantity Sold field */}
                <div className="space-y-2">
                   <Label htmlFor="quantity_sold" className="dark:text-gray-200">Quantity Sold *</Label>
                   <Input 
                       id="quantity_sold" 
                       type="number" 
                       min="1" 
                       // Apply max only if creating a new sale from inventory and there's a remaining quantity to limit by
                       max={inventoryId && !idToLoad && remainingItemQuantity > 0 ? remainingItemQuantity : undefined} 
                       value={formData.quantity_sold} 
                       onChange={(e) => handleChange('quantity_sold', e.target.value)} 
                       required
                       className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                   />
                   {inventoryId && !idToLoad && totalItemQuantity > 0 && ( // Display messages only if total quantity is set
                       <>
                           {remainingItemQuantity <= 0 ? (
                               <p className="text-sm text-red-500 dark:text-red-400">
                                 Warning: This inventory item is marked as sold out.
                               </p>
                           ) : (
                               <p className="text-sm text-gray-500 dark:text-gray-400">
                                 {remainingAfterThisSale} of {totalItemQuantity} remaining after this sale.
                               </p>
                           )}
                       </>
                   )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_price" className="dark:text-gray-200">
                    Purchase Price {inventoryId && !idToLoad && perItemPurchasePrice !== null ? `($${perItemPurchasePrice.toFixed(2)} per item)` : ''} *
                  </Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_price}
                    onChange={(e) => handleChange('purchase_price', e.target.value)}
                    placeholder="0.00"
                    required
                    className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>

                 <div className="space-y-2">
                  <Label htmlFor="source_select" className="dark:text-gray-200">Source</Label>
                  <Select
                    onValueChange={handleSourceSelectChange}
                    value={isOtherSource ? 'other' : formData.source}
                  >
                    <SelectTrigger id="source_select">
                      <SelectValue placeholder="Select a source">{isOtherSource && formData.source ? formData.source : (PREDEFINED_SOURCES.includes(formData.source) ? formData.source : "Select a source")}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PREDEFINED_SOURCES.map(source => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                      <SelectItem value="other">Other...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="platform" className="dark:text-gray-200">Sold On *</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => handleChange('platform', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platformOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isOtherSource ? (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="other_source" className="dark:text-gray-200">Custom Source</Label>
                    <Input
                      id="other_source"
                      value={formData.source}
                      onChange={(e) => handleChange('source', e.target.value)}
                      placeholder="e.g., Garage Sale, Flea Market"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="purchase_date" className="dark:text-gray-200">Purchase Date *</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white dark:text-white pointer-events-none z-10" />
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => handleChange('purchase_date', e.target.value)}
                      required
                      className="pl-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="selling_price" className="dark:text-gray-200">Selling Price *</Label>
                  <Input
                    id="selling_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.selling_price}
                    onChange={(e) => handleChange('selling_price', e.target.value)}
                    placeholder="0.00"
                    required
                    className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sale_date" className="dark:text-gray-200">Sale Date *</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white dark:text-white pointer-events-none z-10" />
                    <Input
                      id="sale_date"
                      type="date"
                      value={formData.sale_date}
                      onChange={(e) => handleChange('sale_date', e.target.value)}
                      required
                      className="pl-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipping_cost" className="dark:text-gray-200">Shipping Cost</Label>
                  <Input
                    id="shipping_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.shipping_cost}
                    onChange={(e) => handleChange('shipping_cost', e.target.value)}
                    placeholder="0.00"
                    className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform_fees" className="dark:text-gray-200">
                    {isEbay ? 'Sales Tax (collected from buyer)' : 'Platform Fees'}
                  </Label>
                  <Input
                    id="platform_fees"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.platform_fees}
                    onChange={(e) => handleChange('platform_fees', e.target.value)}
                    placeholder="0.00"
                    className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="other_costs" className="dark:text-gray-200">
                    {isEbay ? 'Transaction Fees' : 'Other Costs'}
                  </Label>
                  <Input
                    id="other_costs"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.other_costs}
                    onChange={(e) => handleChange('other_costs', e.target.value)}
                    placeholder="0.00"
                    className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>

                {isEbay && (
                  <div className="space-y-2">
                    <Label htmlFor="vat_fees" className="dark:text-gray-200">
                      VAT Fees (if applicable, collected from buyer)
                    </Label>
                    <Input
                      id="vat_fees"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.vat_fees}
                      onChange={(e) => handleChange('vat_fees', e.target.value)}
                      placeholder="0.00"
                      className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="category_select" className="dark:text-gray-200">Category</Label>
                  <Select
                    onValueChange={handleCategorySelectChange}
                    value={isOtherCategory ? 'other' : formData.category}
                  >
                    <SelectTrigger id="category_select">
                      <SelectValue placeholder="Select a category">{isOtherCategory && formData.category ? formData.category : (PREDEFINED_CATEGORIES.includes(formData.category) ? formData.category : "Select a category")}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PREDEFINED_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value="other">Other...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isOtherCategory ? (
                  <div className="space-y-2">
                    <Label htmlFor="other_category" className="dark:text-gray-200">Custom Category</Label>
                    <Input
                      id="other_category"
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      placeholder="e.g., Video Games"
                    />
                  </div>
                ) : <div />}


                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes" className="dark:text-gray-200">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Any additional details about this sale..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="image-upload" className="dark:text-gray-200">Item Image</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload-input').click()}
                      disabled={isUploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                    <Input 
                      id="image-upload-input" 
                      type="file" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      disabled={isUploading} 
                      accept="image/*" 
                    />
                  </div>
                  {formData.image_url && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image Preview:</p>
                      <img src={formData.image_url} alt="Item Preview" className="max-h-40 object-contain rounded-md border p-2 bg-gray-50 dark:bg-gray-800" />
                    </div>
                  )}
                </div>

              </div>

              <div className="border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={calculateProfit}
                  className="mb-4"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Profit
                </Button>

                {calculatedProfit !== null && (
                  <Alert className={calculatedProfit >= 0 ? "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800" : "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800"}>
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span className="font-medium dark:text-gray-200">Estimated Profit:</span>
                        <span className={`text-2xl font-bold ${calculatedProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          ${calculatedProfit.toFixed(2)}
                        </span>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl(saleId || copyId ? "SalesHistory" : "Dashboard"))}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saleMutation.isPending || isUploading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saleMutation.isPending ? 'Saving...' : (saleId ? 'Update Sale' : 'Save Sale')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
