/**
 * Import Your Data from Base44 to Supabase
 * 
 * Instructions:
 * 1. Make sure you're signed in with Google OAuth (bellevuecasey54@gmail.com)
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire file into console
 * 4. Follow the prompts
 */

console.log('🚀 Starting Data Import to Supabase...\n');

async function importDataToSupabase() {
  try {
    // Step 1: Get your new Supabase user ID
    console.log('📋 Step 1: Getting your Supabase user ID...');
    const { supabase } = await import('/src/api/supabaseClient.js');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('❌ You must be signed in! Go to /login and sign in with Google first.');
      return;
    }
    
    const newUserId = session.user.id;
    const email = session.user.email;
    console.log('✅ Signed in as:', email);
    console.log('✅ Your new Supabase User ID:', newUserId);
    console.log('');
    
    // Step 2: Load the exported JSON files
    console.log('📋 Step 2: Loading exported data...');
    console.log('⚠️  You need to load the JSON files manually.');
    console.log('   1. Open inventory-export.json in a text editor');
    console.log('   2. Copy ALL the content');
    console.log('   3. In console, type: const inventoryData = ');
    console.log('   4. Paste the JSON content');
    console.log('   5. Press Enter');
    console.log('');
    console.log('   Then do the same for sales:');
    console.log('   1. Open sales-export.json');
    console.log('   2. Copy ALL the content');
    console.log('   3. Type: const salesData = ');
    console.log('   4. Paste the JSON content');
    console.log('   5. Press Enter');
    console.log('');
    console.log('   Then run: await importInventoryAndSales(inventoryData, salesData, "' + newUserId + '");');
    console.log('');
    
    // Function to import inventory
    window.importInventoryAndSales = async function(inventoryData, salesData, userId) {
      console.log('🚀 Starting import...\n');
      
      let importedInventory = 0;
      let importedSales = 0;
      let errors = [];
      
      // Import inventory items
      if (inventoryData && Array.isArray(inventoryData)) {
        console.log(`📦 Importing ${inventoryData.length} inventory items...`);
        
        for (const item of inventoryData) {
          try {
            // Transform Base44 format to Supabase format
            const transformedItem = {
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
            
            // Import via API
            const response = await fetch('/api/inventory', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId,
              },
              body: JSON.stringify(transformedItem),
            });
            
            if (response.ok) {
              importedInventory++;
              if (importedInventory % 10 === 0) {
                console.log(`  ✅ Imported ${importedInventory}/${inventoryData.length} items...`);
              }
            } else {
              const error = await response.json();
              errors.push(`Inventory item "${item.item_name || item.itemName}": ${error.error || response.statusText}`);
            }
          } catch (error) {
            errors.push(`Inventory item error: ${error.message}`);
          }
        }
        
        console.log(`✅ Imported ${importedInventory} inventory items\n`);
      } else {
        console.log('⚠️  No inventory data found\n');
      }
      
      // Import sales
      if (salesData && Array.isArray(salesData)) {
        console.log(`💰 Importing ${salesData.length} sales...`);
        
        for (const sale of salesData) {
          try {
            // Transform Base44 format to Supabase format
            const transformedSale = {
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
            
            // Import via API
            const response = await fetch('/api/sales', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId,
              },
              body: JSON.stringify(transformedSale),
            });
            
            if (response.ok) {
              importedSales++;
              if (importedSales % 10 === 0) {
                console.log(`  ✅ Imported ${importedSales}/${salesData.length} sales...`);
              }
            } else {
              const error = await response.json();
              errors.push(`Sale "${sale.item_name || sale.itemName}": ${error.error || response.statusText}`);
            }
          } catch (error) {
            errors.push(`Sale error: ${error.message}`);
          }
        }
        
        console.log(`✅ Imported ${importedSales} sales\n`);
      } else {
        console.log('⚠️  No sales data found\n');
      }
      
      // Summary
      console.log('✨ Import Complete!\n');
      console.log(`📦 Inventory: ${importedInventory} items imported`);
      console.log(`💰 Sales: ${importedSales} sales imported`);
      
      if (errors.length > 0) {
        console.log(`\n⚠️  ${errors.length} errors occurred:`);
        errors.slice(0, 10).forEach(error => console.log('  -', error));
        if (errors.length > 10) {
          console.log(`  ... and ${errors.length - 10} more errors`);
        }
      }
      
      console.log('\n🎉 Your data has been imported! Refresh the page to see it.');
    };
    
    console.log('✅ Import function ready! Follow the instructions above to load your data.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the setup
importDataToSupabase();


