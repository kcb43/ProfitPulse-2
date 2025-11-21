/**
 * React hook for eBay Browse API search functionality
 * 
 * This hook provides an easy way to search eBay items in React components
 * using React Query for caching and state management.
 */

import { useQuery } from '@tanstack/react-query';
import { searchItems, getItem, getItemByLegacyId } from '@/api/ebayClient';

/**
 * Hook to search for items on eBay
 * 
 * @param {Object} searchParams - Search parameters (same as searchItems function)
 * @param {Object} options - React Query options
 * @returns {Object} Query result with data, isLoading, error, etc.
 * 
 * @example
 * const { data, isLoading, error } = useEbaySearch({ 
 *   q: 'iPhone 15', 
 *   limit: 10 
 * });
 */
export function useEbaySearch(searchParams = {}, options = {}) {
  return useQuery({
    queryKey: ['ebay-search', searchParams],
    queryFn: () => searchItems(searchParams),
    enabled: !!searchParams.q || !!searchParams.category_ids || !!searchParams.gtin,
    ...options,
  });
}

/**
 * Hook to get details for a specific eBay item
 * 
 * @param {string} itemId - eBay RESTful item ID
 * @param {Object} options - React Query options
 * @returns {Object} Query result with item data
 * 
 * @example
 * const { data: item, isLoading } = useEbayItem('v1|123456789012|0');
 */
export function useEbayItem(itemId, options = {}) {
  return useQuery({
    queryKey: ['ebay-item', itemId],
    queryFn: () => getItem(itemId),
    enabled: !!itemId,
    ...options,
  });
}

/**
 * Hook to get item details using legacy eBay ID
 * 
 * @param {string} legacyItemId - Legacy eBay item ID
 * @param {Object} options - React Query options
 * @returns {Object} Query result with item data
 * 
 * @example
 * const { data: item } = useEbayItemByLegacyId('123456789');
 */
export function useEbayItemByLegacyId(legacyItemId, options = {}) {
  return useQuery({
    queryKey: ['ebay-item-legacy', legacyItemId],
    queryFn: () => getItemByLegacyId(legacyItemId),
    enabled: !!legacyItemId,
    ...options,
  });
}

