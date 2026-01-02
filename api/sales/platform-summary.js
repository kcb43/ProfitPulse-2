import { createClient } from '@supabase/supabase-js';
import { getUserIdFromRequest } from '../_utils/auth.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('⚠️ Supabase environment variables not configured');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function getUserId(req) {
  return req.headers['x-user-id'] || null;
}

function normalizePlatformKey(raw) {
  const v = String(raw ?? '').trim().toLowerCase();
  if (!v) return 'other';
  if (v === 'ebay') return 'ebay';
  if (v === 'etsy') return 'etsy';
  if (v === 'mercari') return 'mercari';
  if (v === 'offer_up' || v === 'offerup' || v === 'offer up') return 'offer_up';
  if (v === 'facebook' || v === 'facebook marketplace' || v === 'facebook_marketplace' || v === 'fbmp') return 'facebook_marketplace';
  return v.replace(/\s+/g, '_');
}

function mergePlatformRows(rows) {
  const acc = new Map();
  for (const r of rows || []) {
    const key = normalizePlatformKey(r?.platform);
    const cur = acc.get(key) || { platform: key, sales_count: 0, total_revenue: 0, total_profit: 0 };
    cur.sales_count += Number(r?.sales_count ?? 0) || 0;
    cur.total_revenue += Number(r?.total_revenue ?? 0) || 0;
    cur.total_profit += Number(r?.total_profit ?? 0) || 0;
    acc.set(key, cur);
  }
  return Array.from(acc.values()).sort((a, b) => b.total_profit - a.total_profit);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = (await getUserIdFromRequest(req, supabase)) || getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const rpcRes = await supabase.rpc('po_sales_platform_summary', { p_user_id: userId });
    if (!rpcRes.error) {
      return res.status(200).json(mergePlatformRows(rpcRes.data || []));
    }

    // If the function doesn't exist yet (migration not run), fall back to a JS aggregation.
    const rpcMsg = String(rpcRes.error?.message || '');
    const isMissingFn =
      rpcMsg.includes('function') && (rpcMsg.includes('does not exist') || rpcMsg.includes('not found'));
    if (!isMissingFn) {
      return res.status(500).json({ error: rpcRes.error.message });
    }

    const { data, error } = await supabase
      .from('sales')
      .select('platform, selling_price, sale_price, profit')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const merged = new Map();
    for (const row of data || []) {
      const key = normalizePlatformKey(row?.platform);
      const cur = merged.get(key) || { platform: key, sales_count: 0, total_revenue: 0, total_profit: 0 };
      cur.sales_count += 1;
      cur.total_revenue += Number(row?.selling_price ?? row?.sale_price ?? 0) || 0;
      cur.total_profit += Number(row?.profit ?? 0) || 0;
      merged.set(key, cur);
    }

    return res.status(200).json(Array.from(merged.values()).sort((a, b) => b.total_profit - a.total_profit));
  } catch (e) {
    console.error('Platform summary API error:', e);
    return res.status(500).json({ error: e?.message || 'Internal server error' });
  }
}


