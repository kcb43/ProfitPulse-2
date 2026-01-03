export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // NOTE:
  // Platform “connection status” for extension-based marketplaces is primarily client-side
  // (extension cookies/session). This endpoint exists to prevent 404s and provide a stable shape
  // for the UI. We can later back it with Supabase if we decide to persist server-side state.
  const platforms = [
    { id: 'ebay', connected: false },
    { id: 'facebook', connected: false },
    { id: 'mercari', connected: false },
    { id: 'etsy', connected: false },
    { id: 'poshmark', connected: false },
  ];

  return res.status(200).json({ platforms });
}


