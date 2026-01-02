import { createClient } from '@supabase/supabase-js';
import { getUserIdFromRequest } from '../_utils/auth.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('⚠️ Supabase environment variables not configured');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
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
    console.error('Image Templates API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// GET /api/image-templates - List all templates
// GET /api/image-templates?id=xxx - Get single template
async function handleGet(req, res, userId) {
  const { id } = req.query;

  if (id) {
    const { data, error } = await supabase
      .from('image_editor_templates')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.status(200).json(data);
  } else {
    const { data, error } = await supabase
      .from('image_editor_templates')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data || []);
  }
}

// POST /api/image-templates - Create new template
async function handlePost(req, res, userId) {
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const templateData = {
    ...req.body,
    user_id: userId,
  };

  const { data, error } = await supabase
    .from('image_editor_templates')
    .insert([templateData])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json(data);
}

// PUT /api/image-templates?id=xxx - Update template
async function handlePut(req, res, userId) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Template ID required' });
  }

  const updateData = { ...req.body };
  delete updateData.id;
  delete updateData.user_id;
  delete updateData.created_at;

  const { data, error } = await supabase
    .from('image_editor_templates')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: 'Template not found' });
  }

  return res.status(200).json(data);
}

// DELETE /api/image-templates?id=xxx - Delete template (soft delete)
async function handleDelete(req, res, userId) {
  const { id, hard } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Template ID required' });
  }

  if (hard === 'true') {
    const { error } = await supabase
      .from('image_editor_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } else {
    const { data, error } = await supabase
      .from('image_editor_templates')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.status(200).json(data);
  }
}

