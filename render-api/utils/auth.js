/**
 * Authentication utilities for verifying Supabase JWT tokens
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Verify JWT token from Authorization header
 * @param {string} authHeader - "Bearer <token>" format
 * @returns {Promise<{userId: string, error: null} | {userId: null, error: string}>}
 */
export async function verifyAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: null, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { userId: null, error: error?.message || 'Invalid token' };
    }

    return { userId: user.id, error: null };
  } catch (err) {
    return { userId: null, error: err.message };
  }
}

/**
 * Middleware for Express routes
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  verifyAuth(authHeader).then(({ userId, error }) => {
    if (error) {
      return res.status(401).json({ error });
    }

    req.userId = userId;
    next();
  });
}


