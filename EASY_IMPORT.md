# Easy Data Import - Step by Step

## The Problem

You're getting errors because:
1. The API routes need your user ID
2. The import script needs to get your Supabase user ID

## ✅ Simple Solution

### Step 1: Get Your Supabase User ID

1. **Make sure you're signed in** at http://localhost:5173/login
2. **Open browser console** (F12)
3. **Run this**:
   ```javascript
   const { supabase } = await import('/src/api/supabaseClient.js');
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Your User ID:', session.user.id);
   console.log('Copy this ID:', session.user.id);
   ```
4. **Copy your user ID** (it's a long UUID)

### Step 2: Load Your Data

1. **Open** `inventory-export.json` in Notepad
2. **Copy ALL content** (Ctrl+A, Ctrl+C)
3. **In console**, type: `const inventoryData = ` then paste, press Enter
4. **Open** `sales-export.json` in Notepad  
5. **Copy ALL content** (Ctrl+A, Ctrl+C)
6. **In console**, type: `const salesData = ` then paste, press Enter

### Step 3: Import the Data

**Copy and paste this entire script** into console (replace `YOUR_USER_ID` with the ID from Step 1):

```javascript
async function importMyData() {
  const userId = 'YOUR_USER_ID_HERE'; // Paste your user ID from Step 1
  
  console.log('🚀 Starting import for user:', userId);
  
  let inventoryCount = 0;
  let salesCount = 0;
  
  // Import inventory
  if (inventoryData && Array.isArray(inventoryData)) {
    console.log(`📦 Importing ${inventoryData.length} inventory items...`);
    
    for (const item of inventoryData) {
      try {
        const transformed = {
          item_name: item.item_name || item.itemName || 'Unnamed Item',
          purchase_price: parseFloat(item.purchase_price || item.purchasePrice || 0),
          purchase_date: item.purchase_date || item.purchaseDate || null,
          source: item.source || null,
          status: item.status || 'available',
          category: item.category || null,
          notes: item.notes || null,
          image_url: item.image_url || item.imageUrl || null,
          images: Array.isArray(item.images) ? item.images : (item.image_url || item.imageUrl ? [item.image_url || item.imageUrl] : []),
          quantity: item.quantity || 1,
          quantity_sold: item.quantity_sold || item.quantitySold || 0,
          return_deadline: item.return_deadline || item.returnDeadline || null,
        };
        
        const response = await fetch('/api/inventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify(transformed),
        });
        
        if (response.ok) {
          inventoryCount++;
          if (inventoryCount % 10 === 0) console.log(`  ✅ ${inventoryCount}/${inventoryData.length} items...`);
        }
      } catch (e) {
        console.error('Error importing item:', e);
      }
    }
    console.log(`✅ Imported ${inventoryCount} inventory items\n`);
  }
  
  // Import sales
  if (salesData && Array.isArray(salesData)) {
    console.log(`💰 Importing ${salesData.length} sales...`);
    
    for (const sale of salesData) {
      try {
        const transformed = {
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
        };
        
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify(transformed),
        });
        
        if (response.ok) {
          salesCount++;
          if (salesCount % 10 === 0) console.log(`  ✅ ${salesCount}/${salesData.length} sales...`);
        }
      } catch (e) {
        console.error('Error importing sale:', e);
      }
    }
    console.log(`✅ Imported ${salesCount} sales\n`);
  }
  
  console.log('✨ Done! Refresh page to see your data.');
}

// Run it
await importMyData();
```

## Even Simpler: Use the File Directly

If you want, I can create a script that reads the JSON files directly. But the method above should work!

## Troubleshooting

**"User ID required" error:**
- Make sure you replaced `YOUR_USER_ID_HERE` with your actual user ID from Step 1

**500 errors:**
- Check that `.env.local` has Supabase credentials
- Restart your dev server after creating `.env.local`

**"inventoryData is not defined":**
- Make sure you loaded the data in Step 2

Try this and let me know if it works!


