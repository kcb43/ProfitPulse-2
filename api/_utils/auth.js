export function getHeader(req, name) {
  if (!req || !req.headers) return null;
  const lower = String(name || '').toLowerCase();
  return req.headers[lower] || req.headers[name] || null;
}

export function getBearerToken(req) {
  const auth = getHeader(req, 'authorization');
  if (!auth) return null;
  const m = String(auth).match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

/**
 * Determine the user id from either:
 * - x-user-id header (legacy / internal)
 * - Authorization: Bearer <supabase_access_token> (preferred)
 */
export async function getUserIdFromRequest(req, supabase) {
  const xUserId = getHeader(req, 'x-user-id');
  if (xUserId) return xUserId;

  const token = getBearerToken(req);
  if (!token || !supabase?.auth?.getUser) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return data?.user?.id || null;
}


