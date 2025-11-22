/**
 * React hook for eBay Browse API search functionality
 * 
 * This hook provides an easy way to search eBay items in React components
 * using React Query for caching and state management.
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { searchItems, getItem, getItemByLegacyId } from '@/api/ebayClient';

/**
 * Hook to search for items on eBay (single page)
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
 * Hook to search for items on eBay with infinite scroll/pagination
 * 
 * @param {Object} searchParams - Search parameters (same as searchItems function, but limit is per page)
 * @param {Object} options - React Query infinite query options
 * @returns {Object} Infinite query result with data, fetchNextPage, hasNextPage, etc.
 * 
 * @example
 * const { data, fetchNextPage, hasNextPage, isLoading } = useEbaySearchInfinite({ 
 *   q: 'iPhone 15', 
 *   limit: 100 
 * });
 */
export function useEbaySearchInfinite(searchParams = {}, options = {}) {
  const { limit = 100, ...restParams } = searchParams;
  
  return useInfiniteQuery({
    queryKey: ['ebay-search-infinite', { ...restParams, limit }],
    queryFn: ({ pageParam = 0 }) => {
      return searchItems({
        ...restParams,
        limit,
        offset: pageParam * limit,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      // Calculate if there are more pages
      const currentOffset = allPages.length * limit;
      const total = lastPage?.total || 0;
      
      // If we've loaded all items or got fewer items than requested, no more pages
      if (currentOffset >= total || (lastPage?.itemSummaries?.length || 0) < limit) {
        return undefined;
      }
      
      // Return the next page number (0-indexed)
      return allPages.length;
    },
    enabled: !!searchParams.q || !!searchParams.category_ids || !!searchParams.gtin,
    initialPageParam: 0,
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

