/**
 * SUPER SIMPLE Import Script
 * 
 * Just follow these steps:
 * 1. Sign in at /login
 * 2. Open console (F12)
 * 3. Get your user ID (see below)
 * 4. Load your JSON files
 * 5. Run the import
 */

// STEP 1: Get your user ID
// Copy and paste this into console:
const { supabase } = await import('/src/api/supabaseClient.js');
const { data: { session } } = await supabase.auth.getSession();
const MY_USER_ID = session.user.id;
console.log('✅ Your User ID:', MY_USER_ID);
console.log('📋 Copy this ID for the import script below');

// STEP 2: Load your data
// Open inventory-export.json, copy ALL content, then:
// const inventoryData = [paste JSON here];

// Open sales-export.json, copy ALL content, then:
// const salesData = [paste JSON here];

// STEP 3: Run this import function
async function quickImport() {
  const userId = MY_USER_ID; // Use the ID from Step 1
  
  console.log('🚀 Starting import...\n');
  
  let invCount = 0, saleCount = 0;
  
  // Import inventory
  if (typeof inventoryData !== 'undefined' && Array.isArray(inventoryData)) {
    console.log(`📦 Importing ${inventoryData.length} items...`);
    for (const item of inventoryData) {
      try {
        const data = {
          item_name: item.item_name || item.itemName || 'Item',
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
        };
        
        const r = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          body: JSON.stringify(data),
        });
        if (r.ok) {
          invCount++;
          if (invCount % 5 === 0) console.log(`  ${invCount}/${inventoryData.length}...`);
        }
      } catch (e) {}
    }
    console.log(`✅ ${invCount} items imported\n`);
  }
  
  // Import sales
  if (typeof salesData !== 'undefined' && Array.isArray(salesData)) {
    console.log(`💰 Importing ${salesData.length} sales...`);
    for (const sale of salesData) {
      try {
        const data = {
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
        
        const r = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          body: JSON.stringify(data),
        });
        if (r.ok) {
          saleCount++;
          if (saleCount % 5 === 0) console.log(`  ${saleCount}/${salesData.length}...`);
        }
      } catch (e) {}
    }
    console.log(`✅ ${saleCount} sales imported\n`);
  }
  
  console.log(`✨ Done! ${invCount} items, ${saleCount} sales imported. Refresh page!`);
}

// To run: await quickImport();


