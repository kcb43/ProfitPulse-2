import { createClient } from '@supabase/supabase-js';
import { getUserIdFromRequest } from '../_utils/auth.js';

// Initialize Supabase client for server-side use
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin access

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('⚠️ Supabase environment variables not configured');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const userId = await getUserIdFromRequest(req, supabase);

  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res, userId);
      case 'POST':
        return handlePost(req, res, userId);
      case 'PUT':
        return handlePut(req, res, userId);
      case 'DELETE':
        return handleDelete(req, res, userId);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Inventory API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// GET /api/inventory - List all inventory items
// GET /api/inventory?id=xxx - Get single item
async function handleGet(req, res, userId) {
  const { id, ...queryParams } = req.query;

  if (id) {
    // Get single item
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Item not found' });
    }

    return res.status(200).json(data);
  } else {
    // List all items
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);

    // Handle sorting
    if (queryParams.sort) {
      const sortField = queryParams.sort.startsWith('-') 
        ? queryParams.sort.substring(1) 
        : queryParams.sort;
      const ascending = !queryParams.sort.startsWith('-');
      query = query.order(sortField, { ascending });
    } else {
      query = query.order('purchase_date', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data || []);
  }
}

// POST /api/inventory - Create new inventory item
async function handlePost(req, res, userId) {
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const itemData = {
    ...req.body,
    user_id: userId,
    // Ensure images array exists
    images: req.body.images || (req.body.image_url ? [req.body.image_url] : []),
  };

  const { data, error } = await supabase
    .from('inventory_items')
    .insert([itemData])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json(data);
}

// PUT /api/inventory?id=xxx - Update inventory item
async function handlePut(req, res, userId) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Item ID required' });
  }

  const updateData = { ...req.body };
  delete updateData.id; // Don't allow ID updates
  delete updateData.user_id; // Don't allow user_id updates
  delete updateData.created_at; // Don't allow created_at updates

  // Ensure images array is properly formatted
  if (updateData.image_url && !updateData.images) {
    updateData.images = [updateData.image_url];
  }

  const { data, error } = await supabase
    .from('inventory_items')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: 'Item not found' });
  }

  return res.status(200).json(data);
}

// DELETE /api/inventory?id=xxx - Delete inventory item (soft delete)
async function handleDelete(req, res, userId) {
  const { id, hard } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Item ID required' });
  }

  if (hard === 'true') {
    // Hard delete
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } else {
    // Soft delete
    const { data, error } = await supabase
      .from('inventory_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Item not found' });
    }

    return res.status(200).json(data);
  }
}

