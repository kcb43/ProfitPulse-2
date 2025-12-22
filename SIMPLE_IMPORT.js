/**
 * SIMPLE Data Import Script
 * 
 * 1. Make sure you're signed in at /login
 * 2. Open browser console (F12)
 * 3. Copy and paste this ENTIRE file
 * 4. Follow the prompts
 */

console.log('🚀 Simple Data Import Tool\n');

// Step 1: Check if signed in
async function checkAuth() {
  try {
    const { supabase } = await import('/src/api/supabaseClient.js');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth error:', error);
      return null;
    }
    
    if (!session) {
      console.error('❌ Not signed in!');
      console.log('👉 Go to http://localhost:5173/login and sign in first');
      return null;
    }
    
    console.log('✅ Signed in as:', session.user.email);
    console.log('✅ User ID:', session.user.id);
    console.log('');
    return session.user.id;
  } catch (error) {
    console.error('❌ Error checking auth:', error);
    return null;
  }
}

// Step 2: Import function
async function importData(inventoryJson, salesJson) {
  const userId = await checkAuth();
  if (!userId) {
    return;
  }
  
  console.log('📦 Starting import...\n');
  
  let inventoryCount = 0;
  let salesCount = 0;
  const errors = [];
  
  // Import inventory
  if (inventoryJson && Array.isArray(inventoryJson)) {
    console.log(`Importing ${inventoryJson.length} inventory items...`);
    
    for (let i = 0; i < inventoryJson.length; i++) {
      const item = inventoryJson[i];
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
          if (inventoryCount % 5 === 0) {
            console.log(`  ✅ ${inventoryCount}/${inventoryJson.length} items imported...`);
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: response.statusText }));
          errors.push(`Item ${i + 1}: ${errorData.error || 'Failed'}`);
        }
      } catch (error) {
        errors.push(`Item ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`✅ Imported ${inventoryCount} inventory items\n`);
  }
  
  // Import sales
  if (salesJson && Array.isArray(salesJson)) {
    console.log(`Importing ${salesJson.length} sales...`);
    
    for (let i = 0; i < salesJson.length; i++) {
      const sale = salesJson[i];
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
          if (salesCount % 5 === 0) {
            console.log(`  ✅ ${salesCount}/${salesJson.length} sales imported...`);
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: response.statusText }));
          errors.push(`Sale ${i + 1}: ${errorData.error || 'Failed'}`);
        }
      } catch (error) {
        errors.push(`Sale ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`✅ Imported ${salesCount} sales\n`);
  }
  
  // Summary
  console.log('✨ Import Complete!\n');
  console.log(`📦 Inventory: ${inventoryCount} items`);
  console.log(`💰 Sales: ${salesCount} sales`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} errors (showing first 5):`);
    errors.slice(0, 5).forEach(e => console.log('  -', e));
  }
  
  console.log('\n🎉 Done! Refresh the page to see your data.');
}

// Make function available globally
window.importData = importData;
window.checkAuth = checkAuth;

// Auto-check auth
checkAuth().then(userId => {
  if (userId) {
    console.log('\n📋 Next steps:');
    console.log('1. Open inventory-export.json and copy ALL content');
    console.log('2. In console, type: const inventoryData = ');
    console.log('3. Paste the JSON, press Enter');
    console.log('4. Open sales-export.json and copy ALL content');
    console.log('5. In console, type: const salesData = ');
    console.log('6. Paste the JSON, press Enter');
    console.log('7. Run: await importData(inventoryData, salesData);');
    console.log('');
  }
});


