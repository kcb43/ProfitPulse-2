/**
 * AUTO migrate your Base44 Inventory + Sales into Supabase.
 *
 * IMPORTANT:
 * - Run this on your LOCAL dev server (`npm run dev`) in the browser console.
 * - Make sure you're signed in first.
 * - This will INSERT rows; if you run it multiple times, you may create duplicates.
 */

console.log('🚀 AUTO Base44 → Supabase migration starting...');

async function autoMigrateBase44ToSupabase() {
  // 1) Ensure Supabase session
  const { supabase } = await import('/src/api/supabaseClient.js');
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    console.error('❌ Not signed in. Go to /login and sign in first, then retry.');
    return;
  }

  const targetUserId = session.user.id;
  console.log('✅ Supabase user:', session.user.email, targetUserId);

  // 2) Pull from Base44 (legacy)
  const { legacyBase44 } = await import('/src/api/legacyBase44Client.js');

  let inventory = [];
  let sales = [];
  try {
    inventory = await legacyBase44.entities.InventoryItem.list();
    console.log(`✅ Base44 inventory rows: ${inventory?.length || 0}`);
  } catch (e) {
    console.error('❌ Failed to load Base44 inventory:', e);
  }

  try {
    sales = await legacyBase44.entities.Sale.list();
    console.log(`✅ Base44 sales rows: ${sales?.length || 0}`);
  } catch (e) {
    console.error('❌ Failed to load Base44 sales:', e);
  }

  if ((!inventory || inventory.length === 0) && (!sales || sales.length === 0)) {
    console.error('❌ No Base44 data returned. If you cancelled Base44, the data may be inaccessible now.');
    return;
  }

  // 3) Identify Base44 user ids present and pick one
  const base44UserIds = new Set();
  const grabUid = (x) => x?.user_id || x?.userId || x?.userID || x?.owner_id || x?.ownerId || null;

  for (const row of inventory) {
    const uid = grabUid(row);
    if (uid) base44UserIds.add(uid);
  }
  for (const row of sales) {
    const uid = grabUid(row);
    if (uid) base44UserIds.add(uid);
  }

  const candidates = Array.from(base44UserIds);
  if (candidates.length === 0) {
    console.warn('⚠️ Could not find a Base44 user id field on rows; importing everything as-is.');
  } else {
    // Choose the candidate with the largest sales count / profit sum (heuristic)
    const stats = candidates.map((uid) => {
      const s = sales.filter((x) => grabUid(x) === uid);
      const profitSum = s.reduce((sum, x) => sum + (Number(x.profit ?? 0) || 0), 0);
      return { uid, salesCount: s.length, profitSum };
    }).sort((a, b) => (b.salesCount - a.salesCount) || (Math.abs(b.profitSum) - Math.abs(a.profitSum)));

    console.log('🔎 Base44 user candidates (top first):');
    console.table(stats.slice(0, 10));

    const chosen = stats[0]?.uid;
    console.log('✅ Using Base44 user id:', chosen);

    inventory = inventory.filter((x) => grabUid(x) === chosen);
    sales = sales.filter((x) => grabUid(x) === chosen);
  }

  // 4) Import into Supabase via your API (dev server proxies /api → profitorbit.io)
  const postJson = async (url, body) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': targetUserId,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`${url} failed: ${res.status} ${txt}`);
    }
    return res.json();
  };

  let invOk = 0, invFail = 0;
  for (const item of inventory) {
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
    try {
      await postJson('/api/inventory', transformedItem);
      invOk++;
    } catch (e) {
      invFail++;
      console.warn('Inventory import failed:', transformedItem.item_name, e.message);
    }
  }
  console.log(`📦 Inventory imported: ok=${invOk} fail=${invFail}`);

  let salesOk = 0, salesFail = 0;
  let profitImported = 0;
  for (const sale of sales) {
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
    try {
      await postJson('/api/sales', transformedSale);
      salesOk++;
      profitImported += Number(transformedSale.profit || 0);
    } catch (e) {
      salesFail++;
      console.warn('Sale import failed:', transformedSale.item_name, e.message);
    }
  }
  console.log(`💰 Sales imported: ok=${salesOk} fail=${salesFail} profitSum≈${profitImported.toFixed(2)}`);

  console.log('✅ Migration complete. Refresh /dashboard.');
}

autoMigrateBase44ToSupabase().catch((e) => console.error('❌ Migration crashed:', e));


