# Migrate Your Data from Base44 to Supabase

## The Problem

Your old inventory and sales data is still in Base44 with your old Base44 user ID. After signing in with Google OAuth, you have a **new Supabase user ID**, which doesn't match your old data.

## Solution: Find Your Old User ID and Migrate Data

### Step 1: Find Your Base44 User ID

**Option A: Check Base44 Dashboard**
1. Go to: https://base44.com (or your Base44 dashboard URL)
2. Sign in with your Gmail (bellevuecasey54@gmail.com)
3. Look for your user ID or account ID
4. It might be in the URL, settings, or API section

**Option B: Check Browser Console (If Base44 SDK Still Works)**
1. Open your app in browser
2. Open browser console (F12)
3. Run this:
   ```javascript
   // Try to access Base44 directly
   import('@/api/base44Client').then(({ base44 }) => {
     // Try to get your user info
     console.log('Base44 client:', base44);
   });
   ```

**Option C: Check Old Data Directly**
1. In browser console, try:
   ```javascript
   // Check localStorage for old user ID
   console.log('Old user ID:', localStorage.getItem('userId'));
   console.log('Temp user ID:', localStorage.getItem('temp_user_id'));
   
   // Check if Base44 stored anything
   Object.keys(localStorage).forEach(key => {
     if (key.includes('base44') || key.includes('user')) {
       console.log(key, ':', localStorage.getItem(key));
     }
   });
   ```

### Step 2: Export Data from Base44

**Option A: Use Base44 API/SDK**
If Base44 SDK still works, we can create an export script:

```javascript
// Run this in browser console (temporarily re-enable Base44)
import { base44 } from '@/api/base44Client';

// Export inventory
const inventory = await base44.entities.InventoryItem.list();
console.log('Inventory:', JSON.stringify(inventory, null, 2));

// Export sales
const sales = await base44.entities.Sale.list();
console.log('Sales:', JSON.stringify(sales, null, 2));

// Copy the JSON output
```

**Option B: Use Base44 Dashboard**
1. Go to Base44 dashboard
2. Export your data (if export feature exists)
3. Download as JSON/CSV

**Option C: Direct Database Access**
If you have access to Base44 database, query directly:
```sql
-- Get all inventory items
SELECT * FROM inventory_items WHERE user_id = 'your-base44-user-id';

-- Get all sales
SELECT * FROM sales WHERE user_id = 'your-base44-user-id';
```

### Step 3: Get Your New Supabase User ID

After signing in with Google OAuth:

1. **Open browser console** (F12)
2. **Run this**:
   ```javascript
   import('@/api/supabaseClient').then(({ supabase }) => {
     supabase.auth.getSession().then(({ data: { session } }) => {
       console.log('New Supabase User ID:', session.user.id);
       console.log('Email:', session.user.email);
     });
   });
   ```

Or simpler:
```javascript
// In browser console
const { supabase } = await import('/src/api/supabaseClient.js');
const { data: { session } } = await supabase.auth.getSession();
console.log('Your new Supabase User ID:', session.user.id);
```

### Step 4: Migrate Data to Supabase

**Option A: Manual Migration Script**

Create a migration script (`migrate-data.js`):

```javascript
// This script migrates data from Base44 to Supabase
// Run in browser console or as a Node script

const OLD_BASE44_USER_ID = 'your-old-base44-user-id';
const NEW_SUPABASE_USER_ID = 'your-new-supabase-user-id';

// 1. Export from Base44 (if still accessible)
const oldInventory = []; // Paste your exported inventory JSON here
const oldSales = []; // Paste your exported sales JSON here

// 2. Transform and import to Supabase
async function migrateInventory() {
  for (const item of oldInventory) {
    // Remove Base44-specific fields, add new user_id
    const { id, createdAt, updatedAt, userId, ...rest } = item;
    
    const newItem = {
      ...rest,
      user_id: NEW_SUPABASE_USER_ID,
      // Map fields if needed
      image_url: item.image_url || item.imageUrl,
      images: Array.isArray(item.images) ? item.images : [],
      purchase_date: item.purchase_date || item.purchaseDate,
      purchase_price: item.purchase_price || item.purchasePrice,
    };
    
    // Import to Supabase via API
    await fetch('/api/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': NEW_SUPABASE_USER_ID,
      },
      body: JSON.stringify(newItem),
    });
  }
}

async function migrateSales() {
  for (const sale of oldSales) {
    const { id, createdAt, updatedAt, userId, ...rest } = sale;
    
    const newSale = {
      ...rest,
      user_id: NEW_SUPABASE_USER_ID,
      sale_date: sale.sale_date || sale.saleDate,
      sale_price: sale.sale_price || sale.salePrice,
      inventory_id: sale.inventory_id || sale.inventoryId,
    };
    
    await fetch('/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': NEW_SUPABASE_USER_ID,
      },
      body: JSON.stringify(newSale),
    });
  }
}

// Run migration
await migrateInventory();
await migrateSales();
```

**Option B: SQL Migration (If You Have Direct Database Access)**

If you can access both databases:

```sql
-- In Supabase SQL Editor
-- Update user_id for all your data

-- First, get your new Supabase user ID (from Step 3)
-- Then run:

UPDATE inventory_items 
SET user_id = 'your-new-supabase-user-id'
WHERE user_id = 'your-old-base44-user-id';

UPDATE sales 
SET user_id = 'your-new-supabase-user-id'
WHERE user_id = 'your-old-base44-user-id';

UPDATE crosslistings 
SET user_id = 'your-new-supabase-user-id'
WHERE user_id = 'your-old-base44-user-id';
```

**Option C: Temporary Workaround - Use Old User ID**

If you know your old Base44 user ID, we can temporarily make the app use it:

1. **Update `src/api/newApiClient.js`**:
   ```javascript
   async function getUserId() {
     // TEMPORARY: Use old Base44 user ID
     const OLD_USER_ID = 'your-old-base44-user-id';
     if (OLD_USER_ID) return OLD_USER_ID;
     
     // Fallback to Supabase auth
     const { data: { session } } = await supabase.auth.getSession();
     return session?.user?.id || null;
   }
   ```

This is a temporary fix until you can migrate the data properly.

## Quick Check: Is Data Under Different Account?

To check if your data might be under a different email:

1. **Check Base44 Dashboard** - Try signing in with different emails
2. **Check Browser History** - Look for Base44 URLs with user IDs
3. **Check Old Screenshots/Notes** - You might have saved your user ID somewhere

## Next Steps

1. ✅ Find your old Base44 user ID (Step 1)
2. ✅ Get your new Supabase user ID (Step 3)
3. ⏭️ Export data from Base44 (Step 2)
4. ⏭️ Import to Supabase with new user ID (Step 4)

Let me know what you find and I can help create a specific migration script!


