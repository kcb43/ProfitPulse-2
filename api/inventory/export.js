import { createClient } from '@supabase/supabase-js';
import { getUserIdFromRequest } from '../_utils/auth.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function parsePositiveInt(value, { min = 1, max = 5000 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < min) return null;
  return Math.min(i, max);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userId = await getUserIdFromRequest(req, supabase);
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const includeDeleted = String(req.query.include_deleted || '').toLowerCase() === 'true';
  const deletedOnly = String(req.query.deleted_only || '').toLowerCase() === 'true';
  const search = req.query.search ? String(req.query.search).trim() : '';
  const status = req.query.status ? String(req.query.status).trim() : '';
  const excludeStatus = req.query.exclude_status ? String(req.query.exclude_status).trim() : '';
  const idsCsv = req.query.ids ? String(req.query.ids) : '';
  const ids = idsCsv ? idsCsv.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5000) : null;
  const limit = parsePositiveInt(req.query.limit) || 5000;

  // Columns to export (stable for spreadsheets). Keep JSON arrays as JSON strings.
  const columns = [
    'id',
    'item_name',
    'status',
    'purchase_price',
    'purchase_date',
    'quantity',
    'quantity_sold',
    'source',
    'category',
    'return_deadline',
    'return_deadline_dismissed',
    'image_url',
    'images',
    'notes',
    'deleted_at',
    'created_at',
    'updated_at',
  ];

  let query = supabase
    .from('inventory_items')
    .select(columns.join(','))
    .eq('user_id', userId);

  if (ids && ids.length) query = query.in('id', ids);
  if (search) query = query.ilike('item_name', `%${search}%`);
  if (status) query = query.eq('status', status);
  if (excludeStatus) query = query.neq('status', excludeStatus);

  if (deletedOnly) query = query.not('deleted_at', 'is', null);
  else if (!includeDeleted) query = query.is('deleted_at', null);

  query = query.order('purchase_date', { ascending: false }).limit(limit);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const rows = Array.isArray(data) ? data : [];
  const header = columns.join(',');
  const body = rows
    .map((row) => columns.map((c) => csvEscape(row?.[c])).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="inventory-export.csv"');
  return res.status(200).send([header, body].filter(Boolean).join('\n'));
}


