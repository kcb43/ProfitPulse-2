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
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // PostgREST aggregates (fast, server-side)
    const { data, error } = await supabase
      .from('sales')
      .select('profit_sum:profit.sum(), revenue_sum:selling_price.sum(), sales_count:id.count()')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const row = Array.isArray(data) ? data[0] : data;
    const totalProfit = Number(row?.profit_sum ?? 0) || 0;
    const totalRevenue = Number(row?.revenue_sum ?? 0) || 0;
    const totalSales = Number(row?.sales_count ?? 0) || 0;

    return res.status(200).json({
      totalProfit,
      totalRevenue,
      totalSales,
    });
  } catch (e) {
    console.error('Sales summary API error:', e);
    return res.status(500).json({ error: e?.message || 'Internal server error' });
  }
}


