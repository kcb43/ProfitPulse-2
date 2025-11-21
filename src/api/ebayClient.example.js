/**
 * eBay Browse API - Usage Examples
 * 
 * This file contains examples of how to use the eBay Browse API client
 * in your application. See src/api/ebayClient.js for the actual implementation.
 */

import { 
  searchItems, 
  getItem, 
  getItemByLegacyId, 
  getItemGroup,
  searchByImage,
  getSearchRefinements,
  checkCompatibility 
} from './ebayClient';

// ============================================
// Example 1: Basic Search by Keyword
// ============================================
async function exampleBasicSearch() {
  try {
    const results = await searchItems({
      q: 'iPhone 15 Pro',
      limit: 10,
      sort: 'price' // Sort by price ascending
    });
    
    console.log('Search results:', results);
    console.log('Items found:', results.itemSummaries);
    
    // Access item data
    results.itemSummaries?.forEach(item => {
      console.log(`Item: ${item.title}`);
      console.log(`Price: ${item.price?.value} ${item.price?.currency}`);
      console.log(`Condition: ${item.condition}`);
      console.log(`Item ID: ${item.itemId}`);
    });
  } catch (error) {
    console.error('Search error:', error);
  }
}

// ============================================
// Example 2: Search with Filters
// ============================================
async function exampleSearchWithFilters() {
  const results = await searchItems({
    q: 'laptop',
    filter: 'price:[100..500],conditions:{NEW}', // Price between $100-$500, new items only
    sort: '-price', // Sort by price descending
    limit: 20
  });
  
  console.log('Filtered results:', results);
}

// ============================================
// Example 3: Search by Category
// ============================================
async function exampleCategorySearch() {
  // Category ID 58058 is "Cell Phones & Smartphones"
  const results = await searchItems({
    category_ids: '58058',
    limit: 10
  });
  
  console.log('Category results:', results);
}

// ============================================
// Example 4: Search by GTIN (UPC/EAN/ISBN)
// ============================================
async function exampleGtinSearch() {
  const results = await searchItems({
    gtin: '0194255277846', // Example UPC
    limit: 10
  });
  
  console.log('GTIN search results:', results);
}

// ============================================
// Example 5: Get Item Details
// ============================================
async function exampleGetItem() {
  try {
    const item = await getItem('v1|123456789012|0', 'PRODUCT');
    
    console.log('Item details:', item);
    console.log('Title:', item.title);
    console.log('Price:', item.price);
    console.log('Images:', item.image);
    console.log('Seller:', item.seller);
    console.log('Shipping:', item.shippingOptions);
  } catch (error) {
    console.error('Error getting item:', error);
  }
}

// ============================================
// Example 6: Get Item by Legacy ID
// ============================================
async function exampleLegacyId() {
  // Convert old eBay item ID to RESTful ID
  const item = await getItemByLegacyId('123456789');
  
  console.log('Item:', item);
  console.log('RESTful ID:', item.itemId); // Use this for future API calls
}

// ============================================
// Example 7: Get Item Group (Variations)
// ============================================
async function exampleItemGroup() {
  // For items with variations (size, color, etc.)
  const group = await getItemGroup('123456789012');
  
  console.log('Item group:', group);
  console.log('Variations:', group.items); // All variations of the item
}

// ============================================
// Example 8: Get Search Refinements
// ============================================
async function exampleRefinements() {
  const refinements = await getSearchRefinements({
    q: 'shoes',
    limit: 0 // Set to 0 if you only want refinements, not items
  });
  
  console.log('Available aspects:', refinements.aspects);
  console.log('Available conditions:', refinements.conditions);
  console.log('Available categories:', refinements.categories);
  
  // Use refinements to build filter options for your UI
}

// ============================================
// Example 9: Using with React Query Hook
// ============================================
/*
import { useEbaySearch, useEbayItem } from '@/hooks/useEbaySearch';

function MyComponent() {
  // Search for items
  const { data: searchResults, isLoading, error } = useEbaySearch({
    q: 'iPhone 15',
    limit: 10
  });
  
  // Get specific item details
  const { data: item } = useEbayItem('v1|123456789012|0');
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {searchResults?.itemSummaries?.map(item => (
        <div key={item.itemId}>
          <h3>{item.title}</h3>
          <p>${item.price?.value}</p>
          {item.image && <img src={item.image.imageUrl} alt={item.title} />}
        </div>
      ))}
    </div>
  );
}
*/

// ============================================
// Example 10: Check Compatibility
// ============================================
async function exampleCompatibility() {
  // Check if an item is compatible with a specific product
  const compatibility = await checkCompatibility(
    'v1|123456789012|0', // Item ID
    '1234567890' // eBay Product ID (EPID)
  );
  
  console.log('Compatibility:', compatibility);
  console.log('Is compatible:', compatibility.compatibilityStatus === 'COMPATIBLE');
}

// ============================================
// Common Filter Strings
// ============================================
const filterExamples = {
  // Price range
  priceRange: 'price:[10..100]',
  
  // Multiple conditions
  conditions: 'conditions:{NEW|USED}',
  
  // Free shipping
  freeShipping: 'deliveryCountry:US,deliveryOptions:{FREIGHT_SHIPPING|SELLER_ARRANGED_LOCAL_PICKUP}',
  
  // Buy It Now only
  buyItNow: 'buyingOptions:{FIXED_PRICE}',
  
  // Auction only
  auction: 'buyingOptions:{AUCTION}',
  
  // Combined filters
  combined: 'price:[50..200],conditions:{NEW},buyingOptions:{FIXED_PRICE}'
};

// ============================================
// Common Sort Options
// ============================================
const sortOptions = {
  priceAsc: 'price',           // Lowest price first
  priceDesc: '-price',         // Highest price first
  distance: 'distance',        // Closest first (requires location)
  newest: 'newlyListed',       // Newest listings first
  bestMatch: '',               // Best match (default)
  endingSoonest: 'endTimeSoonest' // Ending soonest first
};

export {
  exampleBasicSearch,
  exampleSearchWithFilters,
  exampleCategorySearch,
  exampleGtinSearch,
  exampleGetItem,
  exampleLegacyId,
  exampleItemGroup,
  exampleRefinements,
  exampleCompatibility,
  filterExamples,
  sortOptions
};

