# Soft Delete Pattern for Persistence

This document describes the standardized pattern for implementing soft deletes that persist across page refreshes.

## Problem
When items are deleted with optimistic updates, they may disappear immediately in the UI, but after a page refresh, they reappear. This happens when the server update doesn't persist or when the cache is refetched before the server has processed the deletion.

## Solution Pattern

### 1. Mutation Function - Server Verification
After updating `deleted_at`, immediately verify the server saved it:

```javascript
mutationFn: async (itemId) => {
  const deletedAt = new Date().toISOString();
  
  // Soft delete: set deleted_at timestamp
  await base44.entities.InventoryItem.update(itemId, {
    deleted_at: deletedAt
  });
  
  // Verify the update was successful by fetching the item
  try {
    const updatedItem = await base44.entities.InventoryItem.get(itemId);
    if (!updatedItem.deleted_at) {
      console.error("Server update failed: deleted_at not set on server", updatedItem);
      throw new Error("Failed to persist deletion - server did not save deleted_at field");
    }
  } catch (verifyError) {
    console.error("Failed to verify deletion on server:", verifyError);
    throw new Error("Failed to verify deletion was saved to server");
  }
  
  return { itemId, deletedAt };
}
```

### 2. Optimistic Update - Immediate UI Response
Update the cache immediately so the item disappears right away:

```javascript
onMutate: async (itemId) => {
  // IMMEDIATELY update the cache before server responds
  await queryClient.cancelQueries({ queryKey: ['inventoryItems'] });
  
  const previousData = queryClient.getQueryData(['inventoryItems']);
  const deletedAt = new Date().toISOString();
  
  // Update cache immediately - item disappears right away
  queryClient.setQueryData(['inventoryItems'], (old = []) => {
    return old.map(item => 
      item.id === itemId ? { ...item, deleted_at: deletedAt } : item
    );
  });
  
  return { previousData };
}
```

### 3. Success Handler - Delayed Refetch & Cache Sync
After successful deletion, wait a moment, then refetch to verify server state:

```javascript
onSuccess: async (data, itemId) => {
  // Wait a moment, then refetch to verify server state matches our optimistic update
  setTimeout(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      // Update the cache with the verified server data
      const updatedItem = await base44.entities.InventoryItem.get(itemId);
      if (updatedItem.deleted_at) {
        // Ensure cache has the correct deleted_at value
        queryClient.setQueryData(['inventoryItems'], (old = []) => {
          if (!Array.isArray(old)) return old;
          return old.map(item => 
            item.id === itemId ? { ...item, deleted_at: updatedItem.deleted_at } : item
          );
        });
      }
    } catch (error) {
      console.error("Error verifying deletion on server:", error);
    }
  }, 500);
  
  // Show success toast, close dialogs, etc.
  toast({
    title: "✅ Item Deleted Successfully",
    description: `"${itemName}" has been moved to deleted items. You can recover it within 30 days.`,
  });
  setDeleteDialogOpen(false);
}
```

### 4. Error Handler - Rollback on Failure
If the mutation fails, rollback the optimistic update:

```javascript
onError: (error, itemId, context) => {
  // Rollback on error
  if (context?.previousData) {
    queryClient.setQueryData(['inventoryItems'], context.previousData);
  }
  toast({
    title: "❌ Delete Failed",
    description: `Failed to delete item: ${error.message || 'Unknown error'}`,
    variant: "destructive",
  });
  setDeleteDialogOpen(false);
}
```

## Bulk Delete Pattern

For bulk operations, loop through items and verify each one:

```javascript
mutationFn: async (itemIds) => {
  const deletedAt = new Date().toISOString();
  const results = [];
  
  for (const id of itemIds) {
    try {
      await base44.entities.InventoryItem.update(id, {
        deleted_at: deletedAt
      });
      // Verify the update was successful
      const updatedItem = await base44.entities.InventoryItem.get(id);
      if (!updatedItem.deleted_at) {
        throw new Error("Server did not save deleted_at field");
      }
      results.push({ id, success: true });
    } catch (error) {
      console.error(`Failed to delete item ${id}:`, error);
      results.push({ id, success: false, error: error.message });
    }
  }
  
  return results;
}
```

Then in `onSuccess`, verify all successful deletions:

```javascript
onSuccess: async (results) => {
  setTimeout(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      const successfulIds = results.filter(r => r.success).map(r => r.id);
      for (const id of successfulIds) {
        try {
          const updatedItem = await base44.entities.InventoryItem.get(id);
          if (updatedItem.deleted_at) {
            queryClient.setQueryData(['inventoryItems'], (old = []) => {
              if (!Array.isArray(old)) return old;
              return old.map(item => 
                item.id === id ? { ...item, deleted_at: updatedItem.deleted_at } : item
              );
            });
          }
        } catch (error) {
          console.error(`Error verifying deletion for item ${id}:`, error);
        }
      }
    } catch (error) {
      console.error("Error verifying bulk deletion on server:", error);
    }
  }, 500);
  
  // Show success/failure toast
}
```

## Key Points

1. **Immediate Verification**: After updating `deleted_at`, immediately fetch the item to verify it was saved
2. **Optimistic Update**: Update the cache immediately for instant UI feedback
3. **Delayed Refetch**: After 500ms, refetch and sync the cache with server state
4. **Error Handling**: If verification fails, throw an error so the mutation fails and the optimistic update is rolled back
5. **No Immediate Invalidation**: Don't call `invalidateQueries` in `onSuccess` immediately - use the delayed refetch pattern instead

## Files Using This Pattern

- `src/pages/Inventory.jsx` - Single and bulk delete for inventory items
- `src/pages/SalesHistory.jsx` - Single and bulk delete for sales
- `src/components/BulkActionsMenu.jsx` - Bulk delete for inventory items from Crosslist page

## Future Implementation

When adding delete functionality to new pages, use this pattern to ensure deletions persist across page refreshes.
