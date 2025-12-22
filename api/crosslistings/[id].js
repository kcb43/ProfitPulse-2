/**
 * Vercel Serverless Function - Crosslistings API (Individual Item)
 * 
 * Handles:
 * - GET /api/crosslistings/:id - Get a specific crosslisting (public endpoint for Chrome extension)
 * - PUT /api/crosslistings/:id - Update a crosslisting
 * - DELETE /api/crosslistings/:id - Delete a crosslisting
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side use
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('⚠️ Supabase environment variables not configured');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get user ID from request
 * TODO: Implement proper authentication (NextAuth session)
 */
function getUserId(req) {
  if (req.query.userId) {
    return req.query.userId;
  }
  if (req.body && req.body.userId) {
    return req.body.userId;
  }
  return req.headers['x-user-id'] || null;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extract ID from query parameter (Vercel passes dynamic params as query.id)
    const id = req.query.id;

    if (!id) {
      return res.status(400).json({ 
        error: 'Missing ID',
        message: 'Crosslisting ID is required in the URL path.'
      });
    }

    // GET /api/crosslistings/:id - Get specific crosslisting (public for Chrome extension)
    if (req.method === 'GET') {
      try {
        const { data: listing, error } = await supabase
          .from('crosslistings')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !listing) {
          return res.status(404).json({ 
            error: 'Not found',
            message: 'Crosslisting not found.'
          });
        }

        // Return formatted data for Chrome extension
        return res.status(200).json({
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          images: Array.isArray(listing.images) ? listing.images : [],
          category: listing.category || null,
          condition: listing.condition || null,
        });
      } catch (error) {
        console.error('Error fetching crosslisting:', error);
        return res.status(500).json({ 
          error: 'Failed to fetch crosslisting',
          message: error.message 
        });
      }
    }

    // PUT /api/crosslistings/:id - Update crosslisting
    if (req.method === 'PUT') {
      const userId = getUserId(req);
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'User ID is required to update a crosslisting.'
        });
      }

      try {
        // Get the listing to verify it exists and check ownership
        const { data: existing, error: fetchError } = await supabase
          .from('crosslistings')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single();
        
        if (fetchError || !existing) {
          return res.status(404).json({ 
            error: 'Not found',
            message: 'Crosslisting not found.'
          });
        }

        const { title, description, price, images, category, condition } = req.body;

        // Build update object with only provided fields
        const updates = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (price !== undefined) updates.price = String(price);
        if (images !== undefined) updates.images = images;
        if (category !== undefined) updates.category = category || null;
        if (condition !== undefined) updates.condition = condition || null;

        // Update the listing
        const { data: updated, error: updateError } = await supabase
          .from('crosslistings')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError || !updated) {
          return res.status(500).json({ 
            error: 'Failed to update crosslisting',
            message: updateError?.message || 'Update failed'
          });
        }

        return res.status(200).json({
          id: updated.id,
          title: updated.title,
          description: updated.description,
          price: updated.price,
          images: Array.isArray(updated.images) ? updated.images : [],
          category: updated.category || null,
          condition: updated.condition || null,
          createdAt: updated.created_at,
          updatedAt: updated.updated_at,
        });
      } catch (error) {
        console.error('Error updating crosslisting:', error);
        return res.status(500).json({ 
          error: 'Failed to update crosslisting',
          message: error.message 
        });
      }
    }

    // DELETE /api/crosslistings/:id - Delete crosslisting
    if (req.method === 'DELETE') {
      const userId = getUserId(req);
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'User ID is required to delete a crosslisting.'
        });
      }

      try {
        // Verify listing exists and belongs to user, then delete
        const { error: deleteError } = await supabase
          .from('crosslistings')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (deleteError) {
          // Check if it's a not found error
          const { data: existing } = await supabase
            .from('crosslistings')
            .select('id')
            .eq('id', id)
            .single();

          if (!existing) {
            return res.status(404).json({ 
              error: 'Not found',
              message: 'Crosslisting not found.'
            });
          }

          return res.status(500).json({ 
            error: 'Failed to delete crosslisting',
            message: deleteError.message 
          });
        }

        return res.status(200).json({ 
          success: true,
          message: 'Crosslisting deleted successfully.'
        });
      } catch (error) {
        console.error('Error deleting crosslisting:', error);
        return res.status(500).json({ 
          error: 'Failed to delete crosslisting',
          message: error.message 
        });
      }
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Unexpected error in crosslistings API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

