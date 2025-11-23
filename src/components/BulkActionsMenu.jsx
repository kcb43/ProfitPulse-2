
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ChevronDown, Copy, Edit, Trash2, ListChecks, ListX, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function BulkActionsMenu({ selectedItems = [], onActionComplete }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!selectedItems || selectedItems.length === 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" disabled>
            Bulk Actions
            <ChevronDown className="ml-1.5 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
      </DropdownMenu>
    );
  }

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      // Delete all selected items
      const deletePromises = selectedItems.map(itemId =>
        base44.entities.InventoryItem.delete(itemId)
      );
      await Promise.all(deletePromises);

      toast({
        title: "Items deleted",
        description: `${selectedItems.length} item${selectedItems.length === 1 ? '' : 's'} deleted successfully.`,
      });

      queryClient.invalidateQueries(['inventoryItems']);
      if (onActionComplete) onActionComplete();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting items:', error);
      toast({
        title: "Error deleting items",
        description: error.message || "Failed to delete items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkMarkAsNotListed = async () => {
    setIsProcessing(true);
    try {
      const updatePromises = selectedItems.map(itemId =>
        base44.entities.InventoryItem.update(itemId, { status: 'available' })
      );
      await Promise.all(updatePromises);

      toast({
        title: "Items updated",
        description: `${selectedItems.length} item${selectedItems.length === 1 ? '' : 's'} marked as not listed.`,
      });

      queryClient.invalidateQueries(['inventoryItems']);
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Error updating items:', error);
      toast({
        title: "Error updating items",
        description: error.message || "Failed to update items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkCopy = async () => {
    setIsProcessing(true);
    try {
      // Fetch items, duplicate them
      const items = await Promise.all(
        selectedItems.map(id => base44.entities.InventoryItem.get(id))
      );

      const copyPromises = items.map(item => {
        const { id, ...itemData } = item;
        return base44.entities.InventoryItem.create({
          ...itemData,
          item_name: `${itemData.item_name || 'Item'} (Copy)`,
        });
      });

      await Promise.all(copyPromises);

      toast({
        title: "Items copied",
        description: `${selectedItems.length} item${selectedItems.length === 1 ? '' : 's'} copied successfully.`,
      });

      queryClient.invalidateQueries(['inventoryItems']);
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Error copying items:', error);
      toast({
        title: "Error copying items",
        description: error.message || "Failed to copy items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const comingSoon = (label) =>
    toast({
      title: label,
      description: "This action will be available after marketplace integrations.",
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" disabled={isProcessing}>
            Bulk Actions ({selectedItems.length})
            <ChevronDown className="ml-1.5 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem onClick={() => comingSoon("Bulk Delist & Relist")}>
            <ListChecks className="mr-2 h-4 w-4" />
            <span>Bulk Delist &amp; Relist</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => comingSoon("Bulk Edit Labels")}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Bulk Edit Labels</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleBulkCopy} disabled={isProcessing}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Bulk Copy Items</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} disabled={isProcessing}>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Bulk Delete</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => comingSoon("Bulk Delist")} disabled={isProcessing}>
            <ListX className="mr-2 h-4 w-4" />
            <span>Bulk Delist</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleBulkMarkAsNotListed} disabled={isProcessing}>
            <EyeOff className="mr-2 h-4 w-4" />
            <span>Bulk Mark as Not Listed</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => comingSoon("Bulk Edit")} disabled={isProcessing}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Bulk Edit</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItems.length} item{selectedItems.length === 1 ? '' : 's'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedItems.length} selected item{selectedItems.length === 1 ? '' : 's'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
