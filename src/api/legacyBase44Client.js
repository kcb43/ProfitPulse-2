import { createClient } from '@base44/sdk';

/**
 * Legacy Base44 client (read-only migration helper).
 *
 * This is intentionally separate from `src/api/base44Client.js` because the app now uses
 * Supabase-backed API routes for normal operation. We keep this solely so we can
 * export/migrate any remaining Base44 data for your account.
 */
export const legacyBase44 = createClient({
  appId: '68e86fb5ac26f8511acce7ec',
  requiresAuth: false,
});


