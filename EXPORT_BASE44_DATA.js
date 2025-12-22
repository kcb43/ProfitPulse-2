/**
 * Export Your Data from Base44
 * 
 * Run this in your browser console (F12) after loading your app
 * This will try to access Base44 and export all your data
 */

console.log('🚀 Starting Base44 Data Export...\n');

async function exportBase44Data() {
  try {
    // Try to import Base44 SDK
    console.log('📦 Loading Base44 SDK...');
    const { base44 } = await import('/src/api/base44Client.js');
    console.log('✅ Base44 SDK loaded!\n');
    
    // Try to get inventory items
    console.log('📦 Exporting Inventory Items...');
    try {
      const inventory = await base44.entities.InventoryItem.list();
      console.log(`✅ Found ${inventory?.length || 0} inventory items`);
      
      // Save to localStorage for later
      localStorage.setItem('exported_inventory', JSON.stringify(inventory));
      
      // Also log to console so you can copy it
      console.log('\n📋 Inventory Data (copy this):');
      console.log(JSON.stringify(inventory, null, 2));
      
      // Download as file
      const inventoryBlob = new Blob([JSON.stringify(inventory, null, 2)], { type: 'application/json' });
      const inventoryUrl = URL.createObjectURL(inventoryBlob);
      const inventoryLink = document.createElement('a');
      inventoryLink.href = inventoryUrl;
      inventoryLink.download = 'inventory-export.json';
      inventoryLink.click();
      console.log('✅ Inventory exported to inventory-export.json\n');
    } catch (error) {
      console.error('❌ Error exporting inventory:', error);
    }
    
    // Try to get sales
    console.log('📦 Exporting Sales...');
    try {
      const sales = await base44.entities.Sale.list();
      console.log(`✅ Found ${sales?.length || 0} sales`);
      
      // Save to localStorage
      localStorage.setItem('exported_sales', JSON.stringify(sales));
      
      // Log to console
      console.log('\n📋 Sales Data (copy this):');
      console.log(JSON.stringify(sales, null, 2));
      
      // Download as file
      const salesBlob = new Blob([JSON.stringify(sales, null, 2)], { type: 'application/json' });
      const salesUrl = URL.createObjectURL(salesBlob);
      const salesLink = document.createElement('a');
      salesLink.href = salesUrl;
      salesLink.download = 'sales-export.json';
      salesLink.click();
      console.log('✅ Sales exported to sales-export.json\n');
    } catch (error) {
      console.error('❌ Error exporting sales:', error);
    }
    
    // Try to get crosslistings
    console.log('📦 Exporting Crosslistings...');
    try {
      const crosslistings = await base44.entities.Crosslisting?.list();
      if (crosslistings) {
        console.log(`✅ Found ${crosslistings?.length || 0} crosslistings`);
        localStorage.setItem('exported_crosslistings', JSON.stringify(crosslistings));
        
        const crosslistingsBlob = new Blob([JSON.stringify(crosslistings, null, 2)], { type: 'application/json' });
        const crosslistingsUrl = URL.createObjectURL(crosslistingsBlob);
        const crosslistingsLink = document.createElement('a');
        crosslistingsLink.href = crosslistingsUrl;
        crosslistingsLink.download = 'crosslistings-export.json';
        crosslistingsLink.click();
        console.log('✅ Crosslistings exported\n');
      }
    } catch (error) {
      console.log('⚠️ Could not export crosslistings:', error.message);
    }
    
    // Try to find user ID from the data
    console.log('🔍 Looking for User ID in exported data...');
    const inventory = JSON.parse(localStorage.getItem('exported_inventory') || '[]');
    const sales = JSON.parse(localStorage.getItem('exported_sales') || '[]');
    
    const userIds = new Set();
    inventory.forEach(item => {
      if (item.userId) userIds.add(item.userId);
      if (item.user_id) userIds.add(item.user_id);
    });
    sales.forEach(sale => {
      if (sale.userId) userIds.add(sale.userId);
      if (sale.user_id) userIds.add(sale.user_id);
    });
    
    if (userIds.size > 0) {
      console.log('✅ Found User IDs:', Array.from(userIds));
      console.log('📝 Your Base44 User ID is likely:', Array.from(userIds)[0]);
      localStorage.setItem('base44_user_id', Array.from(userIds)[0]);
    } else {
      console.log('⚠️ Could not find user ID in data');
    }
    
    console.log('\n✨ Export complete! Check your downloads folder for JSON files.');
    console.log('📋 Data is also saved in localStorage for easy access.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n💡 If Base44 SDK is not available, you may need to:');
    console.log('   1. Temporarily re-enable Base44 in your code');
    console.log('   2. Or access Base44 dashboard directly');
    console.log('   3. Or check if data is in Supabase already with different user ID');
  }
}

// Run the export
exportBase44Data();


