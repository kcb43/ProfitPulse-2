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
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const rpcRes = await supabase.rpc('po_sales_platform_summary', { p_user_id: userId });
    if (rpcRes.error) {
      return res.status(500).json({ error: rpcRes.error.message });
    }
    return res.status(200).json(rpcRes.data || []);
  } catch (e) {
    console.error('Platform summary API error:', e);
    return res.status(500).json({ error: e?.message || 'Internal server error' });
  }
}


