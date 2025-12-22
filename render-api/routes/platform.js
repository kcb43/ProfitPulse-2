/**
 * Platform connection routes
 * Handles storing and managing platform authentication cookies
 */

import express from 'express';
import { requireAuth } from '../utils/auth.js';
import { encrypt } from '../utils/encryption.js';
import { supabase } from '../utils/db.js';

const router = express.Router();

/**
 * POST /api/platform/connect
 * Store platform cookies for a user
 * 
 * Body:
 * {
 *   "platform": "mercari" | "facebook",
 *   "cookies": [{...cookie objects...}],
 *   "userAgent": "...",
 *   "meta": { "capturedAt": "ISO string" }
 * }
 */
router.post('/connect', requireAuth, async (req, res) => {
  try {
    const { platform, cookies, userAgent, meta } = req.body;
    const userId = req.userId;

    // Validate input
    if (!platform || !cookies || !Array.isArray(cookies)) {
      return res.status(400).json({
        error: 'Missing required fields: platform, cookies (array)',
      });
    }

    if (!['mercari', 'facebook'].includes(platform)) {
      return res.status(400).json({
        error: 'Invalid platform. Supported: mercari, facebook',
      });
    }

    // Encrypt cookies
    const sessionPayload = {
      cookies,
      userAgent: userAgent || null,
      capturedAt: meta?.capturedAt || new Date().toISOString(),
    };

    const encryptedPayload = encrypt(sessionPayload);

    // Upsert into platform_accounts
    const { data, error } = await supabase
      .from('platform_accounts')
      .upsert(
        {
          user_id: userId,
          platform,
          status: 'connected',
          session_payload_encrypted: encryptedPayload,
          session_meta: meta || {},
          last_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,platform',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to save platform connection',
        details: error.message,
      });
    }

    res.json({
      success: true,
      platform,
      status: 'connected',
      accountId: data.id,
    });
  } catch (error) {
    console.error('Platform connect error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

/**
 * GET /api/platform/status
 * Get connection status for all platforms
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase
      .from('platform_accounts')
      .select('platform, status, last_verified_at, created_at')
      .eq('user_id', userId);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to fetch platform status',
      });
    }

    res.json({
      platforms: data || [],
    });
  } catch (error) {
    console.error('Platform status error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * DELETE /api/platform/disconnect/:platform
 * Disconnect a platform
 */
router.delete('/disconnect/:platform', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { platform } = req.params;

    const { error } = await supabase
      .from('platform_accounts')
      .update({
        status: 'disconnected',
        session_payload_encrypted: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('platform', platform);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to disconnect platform',
      });
    }

    res.json({
      success: true,
      platform,
      status: 'disconnected',
    });
  } catch (error) {
    console.error('Platform disconnect error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;


