/**
 * eBay Browse API Client
 * 
 * This client provides access to eBay's Browse API for searching and retrieving item details.
 * Uses eBay Sandbox credentials for development.
 * 
 * API Documentation: https://developer.ebay.com/api-docs/buy/browse/overview.html
 */

// eBay Sandbox Configuration
// 
// To use environment variables, create a .env file in the root directory with:
//   VITE_EBAY_CLIENT_ID=your_client_id
//   VITE_EBAY_DEV_ID=your_dev_id
//   VITE_EBAY_CLIENT_SECRET=your_client_secret
//   VITE_EBAY_SANDBOX_TOKEN=your_sandbox_token
//
// For production, update baseUrl and oauthUrl below to use production endpoints.
const EBAY_CONFIG = {
  // Sandbox environment
  baseUrl: 'https://api.sandbox.ebay.com',
  // For production, use: baseUrl: 'https://api.ebay.com',
  
  // Your credentials - must be set via environment variables
  clientId: import.meta.env.VITE_EBAY_CLIENT_ID || '',
  devId: import.meta.env.VITE_EBAY_DEV_ID || '',
  clientSecret: import.meta.env.VITE_EBAY_CLIENT_SECRET || '',
  sandboxToken: import.meta.env.VITE_EBAY_SANDBOX_TOKEN || '',
  
  // OAuth endpoints
  oauthUrl: 'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
  // For production: oauthUrl: 'https://api.ebay.com/identity/v1/oauth2/token',
};

/**
 * Get OAuth access token for eBay API
 * Uses Client Credentials grant type for application access
 */
async function getAccessToken() {
  try {
    // For sandbox, you can use the sandbox user token directly
    // For production or full OAuth, use this endpoint:
    const credentials = btoa(`${EBAY_CONFIG.clientId}:${EBAY_CONFIG.clientSecret}`);
    
    const response = await fetch(EBAY_CONFIG.oauthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'https://api.ebay.com/oauth/api_scope',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting eBay access token:', error);
    // For sandbox testing, return null to use unauthenticated requests where possible
    return null;
  }
}

/**
 * Make an authenticated request to eBay API
 */
async function makeRequest(endpoint, options = {}) {
  const accessToken = await getAccessToken();
  
  const headers = {
    'Content-Type': 'application/json',
    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US', // Change based on your marketplace
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const url = `${EBAY_CONFIG.baseUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`eBay API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('eBay API request error:', error);
    throw error;
  }
}

/**
 * Search for items on eBay
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.q - Search query (keyword)
 * @param {string} params.category_ids - Category IDs (comma-separated)
 * @param {string} params.gtin - Global Trade Item Number (UPC, EAN, ISBN)
 * @param {string} params.charity_ids - Charity IDs (comma-separated)
 * @param {number} params.limit - Number of items to return (default: 20, max: 200)
 * @param {number} params.offset - Number of items to skip (for pagination)
 * @param {string} params.filter - Filter string (e.g., "price:[10..100],conditions:{NEW|USED}")
 * @param {string} params.sort - Sort order (e.g., "price", "-price", "distance")
 * @param {string} params.fieldgroups - Field groups to return (default: "MATCHING_ITEMS")
 * @param {string} params.aspect_filter - Aspect filters (e.g., "Brand:{Nike|Adidas}")
 * @param {string} params.compatibility_filter - Compatibility filter
 * @returns {Promise<Object>} Search results
 * 
 * @example
 * // Search by keyword
 * const results = await searchItems({ q: 'iPhone 15', limit: 10 });
 * 
 * // Search by category
 * const results = await searchItems({ category_ids: '26395', limit: 20 });
 * 
 * // Search with filters
 * const results = await searchItems({ 
 *   q: 'laptop', 
 *   filter: 'price:[100..500],conditions:{NEW}', 
 *   sort: 'price' 
 * });
 */
export async function searchItems(params = {}) {
  const {
    q,
    category_ids,
    gtin,
    charity_ids,
    limit = 20,
    offset = 0,
    filter,
    sort,
    fieldgroups = 'MATCHING_ITEMS',
    aspect_filter,
    compatibility_filter,
  } = params;

  // Build query string
  const queryParams = new URLSearchParams();
  
  if (q) queryParams.append('q', q);
  if (category_ids) queryParams.append('category_ids', category_ids);
  if (gtin) queryParams.append('gtin', gtin);
  if (charity_ids) queryParams.append('charity_ids', charity_ids);
  if (limit) queryParams.append('limit', limit.toString());
  if (offset) queryParams.append('offset', offset.toString());
  if (filter) queryParams.append('filter', filter);
  if (sort) queryParams.append('sort', sort);
  if (fieldgroups) queryParams.append('fieldgroups', fieldgroups);
  if (aspect_filter) queryParams.append('aspect_filter', aspect_filter);
  if (compatibility_filter) queryParams.append('compatibility_filter', compatibility_filter);

  const endpoint = `/buy/browse/v1/item_summary/search?${queryParams.toString()}`;
  
  return await makeRequest(endpoint);
}

/**
 * Get detailed information about a specific item
 * 
 * @param {string} itemId - The eBay RESTful item ID
 * @param {string} fieldgroups - Field groups to return (e.g., "PRODUCT", "COMPATIBILITY", etc.)
 * @returns {Promise<Object>} Item details
 * 
 * @example
 * const item = await getItem('v1|123456789012|0');
 */
export async function getItem(itemId, fieldgroups = 'PRODUCT') {
  if (!itemId) {
    throw new Error('Item ID is required');
  }

  const queryParams = new URLSearchParams();
  if (fieldgroups) {
    queryParams.append('fieldgroups', fieldgroups);
  }

  const endpoint = `/buy/browse/v1/item/${encodeURIComponent(itemId)}?${queryParams.toString()}`;
  
  return await makeRequest(endpoint);
}

/**
 * Get item details using a legacy eBay item ID
 * Converts legacy ID to RESTful ID and returns item details
 * 
 * @param {string} legacyItemId - Legacy eBay item ID (from older APIs)
 * @returns {Promise<Object>} Item details including RESTful ID
 * 
 * @example
 * const item = await getItemByLegacyId('123456789');
 */
export async function getItemByLegacyId(legacyItemId) {
  if (!legacyItemId) {
    throw new Error('Legacy item ID is required');
  }

  const endpoint = `/buy/browse/v1/item/get_item_by_legacy_id?legacy_item_id=${legacyItemId}`;
  
  return await makeRequest(endpoint);
}

/**
 * Get item group information (for items with variations)
 * 
 * @param {string} itemGroupId - The item group ID
 * @returns {Promise<Object>} Item group details including all variations
 * 
 * @example
 * const group = await getItemGroup('123456789012');
 */
export async function getItemGroup(itemGroupId) {
  if (!itemGroupId) {
    throw new Error('Item group ID is required');
  }

  const endpoint = `/buy/browse/v1/item_group/${encodeURIComponent(itemGroupId)}`;
  
  return await makeRequest(endpoint);
}

/**
 * Search for items using an image (visual search)
 * Note: This requires the image to be base64 encoded
 * 
 * @param {string} imageBase64 - Base64 encoded image string
 * @param {Object} params - Additional search parameters (same as searchItems)
 * @returns {Promise<Object>} Search results
 */
export async function searchByImage(imageBase64, params = {}) {
  if (!imageBase64) {
    throw new Error('Base64 encoded image is required');
  }

  const {
    limit = 20,
    offset = 0,
    filter,
    sort,
    fieldgroups = 'MATCHING_ITEMS',
  } = params;

  const queryParams = new URLSearchParams();
  queryParams.append('image', imageBase64);
  if (limit) queryParams.append('limit', limit.toString());
  if (offset) queryParams.append('offset', offset.toString());
  if (filter) queryParams.append('filter', filter);
  if (sort) queryParams.append('sort', sort);
  if (fieldgroups) queryParams.append('fieldgroups', fieldgroups);

  const endpoint = `/buy/browse/v1/item_summary/search_by_image?${queryParams.toString()}`;
  
  return await makeRequest(endpoint, {
    method: 'POST',
  });
}

/**
 * Get refinements for a search query
 * This helps create histograms and filters for search results
 * 
 * @param {Object} params - Same parameters as searchItems
 * @returns {Promise<Object>} Refinements including aspects, conditions, categories, etc.
 */
export async function getSearchRefinements(params = {}) {
  const results = await searchItems({
    ...params,
    fieldgroups: 'ASPECT_REFINEMENTS,CONDITION_REFINEMENTS,MATCHING_ITEMS',
  });

  return {
    aspects: results.aspectDistributions || [],
    conditions: results.conditionDistributions || [],
    categories: results.categoryDistributions || [],
    buyingOptions: results.buyingOptionDistributions || [],
    deliveryOptions: results.deliveryOptions || [],
  };
}

/**
 * Check item compatibility with a product
 * 
 * @param {string} itemId - The item ID to check
 * @param {string} epid - eBay Product ID
 * @returns {Promise<Object>} Compatibility information
 */
export async function checkCompatibility(itemId, epid) {
  if (!itemId || !epid) {
    throw new Error('Item ID and EPID are required');
  }

  const endpoint = `/buy/browse/v1/item/${encodeURIComponent(itemId)}/check_compatibility?epid=${epid}`;
  
  return await makeRequest(endpoint);
}

// Export configuration for external use if needed
export const ebayConfig = EBAY_CONFIG;

