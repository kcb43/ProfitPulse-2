# Step-by-Step Import Guide

## Fix the 500 Errors First

The 500 errors mean the API routes can't connect to Supabase. Let's fix this:

### Check 1: Is `.env.local` created?

1. Go to `F:\bareretail\`
2. Look for `.env.local` file
3. If it doesn't exist, create it (see below)
4. If it exists, make sure it has these 3 lines:

```env
VITE_SUPABASE_URL=https://hlcwhpajorzbleabavcr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_AmJEyN9K_q2OJAUCGiO3eA_NZYf6rXm
SUPABASE_SERVICE_ROLE_KEY=sb_secret_jfF_FPZMZNXkJcAp8da0SA_UcqFHU4-
```

### Check 2: Restart Dev Server

**CRITICAL:** After creating/updating `.env.local`:

1. **Stop** your dev server (Ctrl+C)
2. **Start** it again: `npm run dev`
3. **Wait** for it to fully start

### Check 3: Test API Route

In browser console, test:

```javascript
fetch('/api/inventory', {
  headers: { 'x-user-id': 'test-123' }
})
.then(r => r.text())
.then(console.log);
```

If you still get 500, check the **terminal** where `npm run dev` is running - it will show the actual error.

## Once 500 Errors Are Fixed

### Step 1: Get Your User ID

1. **Sign in** at http://localhost:5173/login
2. **Open console** (F12)
3. **Run**:
   ```javascript
   const { supabase } = await import('/src/api/supabaseClient.js');
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Your User ID:', session.user.id);
   ```
4. **Copy** the user ID (it's a long UUID)

### Step 2: Load Your Data

1. **Open** `inventory-export.json` in Notepad
2. **Select ALL** (Ctrl+A)
3. **Copy** (Ctrl+C)
4. **In console**, type: `const inventoryData = ` then paste, press Enter

5. **Open** `sales-export.json` in Notepad
6. **Select ALL** (Ctrl+A)  
7. **Copy** (Ctrl+C)
8. **In console**, type: `const salesData = ` then paste, press Enter

### Step 3: Import

Copy this script and **replace YOUR_USER_ID** with the ID from Step 1:

```javascript
async function importAll() {
  const userId = 'YOUR_USER_ID_HERE'; // Paste your user ID
  
  console.log('🚀 Importing...');
  
  // Import inventory
  let inv = 0;
  for (const item of inventoryData) {
    try {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({
          item_name: item.item_name || item.itemName || 'Item',
          purchase_price: parseFloat(item.purchase_price || item.purchasePrice || 0),
          purchase_date: item.purchase_date || item.purchaseDate || null,
          source: item.source || null,
          status: item.status || 'available',
          category: item.category || null,
          notes: item.notes || null,
          image_url: item.image_url || item.imageUrl || null,
          images: Array.isArray(item.images) ? item.images : [],
          quantity: item.quantity || 1,
          quantity_sold: item.quantity_sold || item.quantitySold || 0,
        }),
      });
      inv++;
      if (inv % 5 === 0) console.log(`Items: ${inv}/${inventoryData.length}`);
    } catch (e) {}
  }
  console.log(`✅ ${inv} items imported`);
  
  // Import sales
  let sales = 0;
  for (const sale of salesData) {
    try {
      await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({
          inventory_id: sale.inventory_id || sale.inventoryId || null,
          item_name: sale.item_name || sale.itemName || null,
          sale_price: parseFloat(sale.sale_price || sale.salePrice || 0),
          sale_date: sale.sale_date || sale.saleDate || null,
          platform: sale.platform || null,
          shipping_cost: parseFloat(sale.shipping_cost || sale.shippingCost || 0),
          platform_fees: parseFloat(sale.platform_fees || sale.platformFees || 0),
          vat_fees: parseFloat(sale.vat_fees || sale.vatFees || 0),
          other_costs: parseFloat(sale.other_costs || sale.otherCosts || 0),
          profit: parseFloat(sale.profit || 0),
          notes: sale.notes || null,
          image_url: sale.image_url || sale.imageUrl || null,
        }),
      });
      sales++;
      if (sales % 5 === 0) console.log(`Sales: ${sales}/${salesData.length}`);
    } catch (e) {}
  }
  console.log(`✅ ${sales} sales imported`);
  console.log('✨ Done! Refresh page.');
}

await importAll();
```

## Troubleshooting

**Still getting 500 errors?**
- Check terminal for actual error message
- Verify `.env.local` exists and has correct values
- Make sure dev server was restarted after creating `.env.local`

**"User ID required" error?**
- Make sure you replaced `YOUR_USER_ID_HERE` with actual ID

**"inventoryData is not defined"?**
- Make sure you loaded the data in Step 2

Let me know what error you see in the terminal!


