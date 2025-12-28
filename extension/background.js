/**
 * Profit Orbit Extension - Background Service Worker (MV3)
 *
 * MUST parse cleanly. Any syntax error prevents registration and causes:
 * - "Service worker registration failed. Status code: 15"
 * - "Uncaught SyntaxError: Illegal return statement"
 */
console.log('Profit Orbit Extension: Background script loaded');
console.log('EXT BUILD:', '2025-12-28-background-clean-5');

// -----------------------------
// Helpers
// -----------------------------

function isProfitOrbitAppUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.hostname === 'profitorbit.io') return true;
    if (u.hostname.endsWith('.vercel.app')) return true;
    if (u.hostname === 'localhost' && (u.port === '5173' || u.port === '5174')) return true;
    return false;
  } catch (_) {
    return false;
  }
}

async function ensurePageApiInjected(tabId) {
  // DEPRECATED: Page API is injected via `extension/manifest.json`.
  // Kept as a stub to avoid breaking any legacy calls.
  return;
}

async function notifyProfitOrbit(message) {
  const tabs = await chrome.tabs.query({
    url: [
      'https://profitorbit.io/*',
      'https://*.vercel.app/*',
      'http://localhost:5173/*',
      'http://localhost:5174/*',
    ],
  });

  for (const tab of tabs) {
    if (!tab?.id) continue;
    try {
      await chrome.tabs.sendMessage(tab.id, message);
    } catch (_) {
      // ignore
    }
  }
}

// -----------------------------
// Marketplace status state
// -----------------------------

let marketplaceStatus = {
  mercari: { loggedIn: false, userName: null, lastChecked: null },
  facebook: { loggedIn: false, userName: null, lastChecked: null },
  poshmark: { loggedIn: false, userName: null, lastChecked: null },
  ebay: { loggedIn: false, userName: null, lastChecked: null },
  etsy: { loggedIn: false, userName: null, lastChecked: null },
};

chrome.storage.local.get(['marketplaceStatus'], (result) => {
  if (result?.marketplaceStatus) marketplaceStatus = result.marketplaceStatus;
});

function saveMarketplaceStatus() {
  try {
    chrome.storage.local.set({ marketplaceStatus }, () => {});
  } catch (_) {
    // ignore
  }
}

// NOTE:
// The Profit Orbit Page API is injected via `manifest.json` content_scripts (world=MAIN).
// Avoid re-injecting from the background script, which caused repeated "Page API: Loading..." spam
// when injection checks fail or tabs are mid-navigation.

// -----------------------------
// Mercari API Recorder (webRequest)
// -----------------------------

const mercariApiRecorder = {
  enabled: false,
  startedAt: null,
  maxRecords: 200,
  records: [],
  pending: new Map(),
};

// -----------------------------
// Facebook API Recorder (webRequest)
// -----------------------------

const facebookApiRecorder = {
  enabled: false,
  startedAt: null,
  maxRecords: 400,
  records: [],
  pending: new Map(),
};

// -----------------------------
// Mercari API-mode listing (no tabs/windows)
// -----------------------------

const MERCARI_PERSISTED = {
  sellQuery: {
    operationName: 'sellQuery',
    sha256Hash: '563d5747ce3413a076648387bb173b383ba91fd31fc933ddf561d5eb37b4a1a5',
  },
  uploadTempListingPhotos: {
    operationName: 'uploadTempListingPhotos',
    sha256Hash: '9aa889ac01e549a01c66c7baabc968b0e4a7fa4cd0b6bd32b7599ce10ca09a10',
  },
  kandoSuggestQuery: {
    operationName: 'kandoSuggestQuery',
    sha256Hash: '5311dbb78d8a2b30d218c0a1899d7b9948a4f3ee1ddd5fbd9807595c30109980',
  },
  createListing: {
    operationName: 'createListing',
    sha256Hash: '265dab5d0d382d3c83dda7d65e9ad111f47c27aa5d92c7d9a4bacd890d5e32c0',
  },
};

function deepFindFirst(obj, predicate, seen = new Set()) {
  if (!obj || typeof obj !== 'object') return null;
  if (seen.has(obj)) return null;
  seen.add(obj);

  try {
    if (predicate(obj)) return obj;
  } catch (_) {}

  if (Array.isArray(obj)) {
    for (const v of obj) {
      const found = deepFindFirst(v, predicate, seen);
      if (found) return found;
    }
    return null;
  }

  for (const k of Object.keys(obj)) {
    const found = deepFindFirst(obj[k], predicate, seen);
    if (found) return found;
  }
  return null;
}

function parseMercariGraphqlResponse(json) {
  if (!json) throw new Error('Empty response');
  if (json.errors && Array.isArray(json.errors) && json.errors.length) {
    const msg = json.errors.map((e) => e?.message).filter(Boolean).join(' | ') || 'GraphQL error';
    const err = new Error(msg);
    err.details = json.errors;
    throw err;
  }
  return json.data ?? json;
}

async function normalizeMercariImageForUpload(inputBlob, filename = 'image.jpg') {
  // Mercari error says "<10mb". Keep headroom for multipart overhead.
  const MAX_BYTES = 10 * 1024 * 1024 - 200 * 1024;
  const MAX_DIM = 1600;

  const ensureJpgName = (name) => {
    const n = String(name || 'image').trim() || 'image';
    return n.toLowerCase().endsWith('.jpg') || n.toLowerCase().endsWith('.jpeg') ? n : `${n}.jpg`;
  };

  if (!inputBlob || typeof inputBlob.size !== 'number') {
    throw new Error('Invalid image blob');
  }

  const inType = String(inputBlob.type || '');
  const inSize = Number(inputBlob.size || 0);

  // If it's already acceptable, keep it.
  const okType = inType === 'image/jpeg' || inType === 'image/png';
  if (okType && inSize > 0 && inSize <= MAX_BYTES) {
    return { blob: inputBlob, filename: ensureJpgName(filename), note: `ok (${inType} ${inSize})` };
  }

  // Convert to JPEG (also handles webp/unknown types) and compress/resize if needed.
  let bitmap;
  try {
    bitmap = await createImageBitmap(inputBlob);
  } catch (e) {
    throw new Error(`Image decode failed (type=${inType || 'unknown'} size=${inSize}): ${e?.message || String(e)}`);
  }

  const ow = bitmap.width || 0;
  const oh = bitmap.height || 0;
  if (!ow || !oh) throw new Error(`Invalid bitmap dimensions (w=${ow} h=${oh})`);

  let scale = Math.min(1, MAX_DIM / Math.max(ow, oh));
  const qualities = [0.86, 0.78, 0.68, 0.58];

  const encode = async (scaleFactor, q) => {
    const w = Math.max(1, Math.round(ow * scaleFactor));
    const h = Math.max(1, Math.round(oh * scaleFactor));
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('OffscreenCanvas 2d context unavailable');
    ctx.drawImage(bitmap, 0, 0, w, h);
    const out = await canvas.convertToBlob({ type: 'image/jpeg', quality: q });
    return { out, w, h, q, scaleFactor };
  };

  let last = null;
  for (let pass = 0; pass < 5; pass++) {
    for (const q of qualities) {
      const r = await encode(scale, q);
      last = r;
      if (r.out.size <= MAX_BYTES) {
        return {
          blob: r.out,
          filename: ensureJpgName(filename),
          note: `jpeg w=${r.w} h=${r.h} q=${q} scale=${scale.toFixed(3)} size=${r.out.size}`,
        };
      }
    }
    scale = scale * 0.85;
    if (scale < 0.15) break;
  }

  throw new Error(`Image still >10MB after re-encode (lastSize=${last?.out?.size || 'n/a'})`);
}

async function getMercariAuthHeaders() {
  const stored = await chrome.storage.local.get(['mercariApiHeaders']);
  const hdrs = stored?.mercariApiHeaders || null;
  if (!hdrs || !hdrs.authorization || !hdrs['x-csrf-token'] || !hdrs['x-de-device-token']) {
    throw new Error(
      'Missing Mercari API session headers. Open https://www.mercari.com/ in this Chrome profile, refresh once, then try again.'
    );
  }
  return hdrs;
}

async function getMercariListingDefaults() {
  const stored = await chrome.storage.local.get(['mercariListingDefaults']);
  return stored?.mercariListingDefaults || {};
}

async function setMercariListingDefaults(patch) {
  const cur = await getMercariListingDefaults();
  await chrome.storage.local.set({ mercariListingDefaults: { ...cur, ...patch, updatedAt: Date.now() } });
}

function buildMercariFetchHeaders(baseHeaders, overrides = {}) {
  const headers = new Headers();
  // Only include what Mercari expects (avoid cookies; browser will attach cookies automatically).
  const allow = [
    'authorization',
    'accept',
    'accept-language',
    'content-type',
    'x-csrf-token',
    'x-de-device-token',
    'x-platform',
    'x-double-web',
    'apollo-require-preflight',
    'x-app-version',
  ];
  for (const k of allow) {
    const v = baseHeaders?.[k];
    if (v) headers.set(k, v);
  }
  for (const [k, v] of Object.entries(overrides || {})) {
    if (v === undefined || v === null) continue;
    headers.set(k, v);
  }
  return headers;
}

async function mercariPersistedJson(operationName, sha256Hash, variables) {
  const auth = await getMercariAuthHeaders();
  const headers = buildMercariFetchHeaders(auth, { 'content-type': 'application/json' });
  const resp = await fetch('https://www.mercari.com/v1/api', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      operationName,
      variables: variables || {},
      extensions: { persistedQuery: { version: 1, sha256Hash } },
    }),
    credentials: 'include',
  });

  const text = await resp.text().catch(() => '');
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_) {
    json = null;
  }
  if (!resp.ok) {
    throw new Error(`Mercari API HTTP ${resp.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
  }
  return parseMercariGraphqlResponse(json);
}

async function mercariUploadTempListingPhoto(blob, filename = 'blob') {
  const auth = await getMercariAuthHeaders();
  const form = new FormData();
  form.append(
    'operations',
    JSON.stringify({
      operationName: MERCARI_PERSISTED.uploadTempListingPhotos.operationName,
      variables: { input: { photos: [null] } },
      extensions: { persistedQuery: { version: 1, sha256Hash: MERCARI_PERSISTED.uploadTempListingPhotos.sha256Hash } },
    })
  );
  form.append('map', JSON.stringify({ '1': ['variables.input.photos.0'] }));
  // Use a File when available so the part has a filename + mime type.
  const safeName = String(filename || 'image.jpg');
  const part =
    typeof File === 'function'
      ? new File([blob], safeName, { type: blob?.type || 'image/jpeg' })
      : blob;
  form.append('1', part, safeName);

  // Let fetch set the multipart boundary. Do NOT set content-type manually.
  const headers = buildMercariFetchHeaders(auth);
  headers.delete('content-type');

  const resp = await fetch('https://www.mercari.com/v1/api', {
    method: 'POST',
    headers,
    body: form,
    credentials: 'include',
  });
  const json = await resp.json().catch(() => null);
  if (!resp.ok) throw new Error(`Mercari upload failed: HTTP ${resp.status}`);
  const data = parseMercariGraphqlResponse(json);

  // Mercari's uploadTempListingPhotos commonly returns:
  // data.uploadTempListingPhotos.photoIds: string[]
  let photoId =
    data?.uploadTempListingPhotos?.photoIds?.[0] ||
    data?.uploadTempListingPhotos?.photoId ||
    null;

  // Fallback: search for { photoIds: [...] } anywhere in response
  if (!photoId) {
    const nodeWithPhotoIds = deepFindFirst(data, (o) => Array.isArray(o?.photoIds) && o.photoIds.length > 0);
    if (nodeWithPhotoIds?.photoIds?.[0]) photoId = nodeWithPhotoIds.photoIds[0];
  }

  // Last resort: any UUID-like string in an array
  if (!photoId) {
    const uuidNode = deepFindFirst(
      data,
      (o) =>
        Array.isArray(o) &&
        o.length > 0 &&
        typeof o[0] === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(o[0])
    );
    if (Array.isArray(uuidNode) && uuidNode[0]) photoId = uuidNode[0];
  }

  if (!photoId) {
    // Persist raw response for debugging (stored locally in the extension).
    try {
      chrome.storage.local.set({ mercariLastUploadDebug: { t: Date.now(), filename: safeName, data } }, () => {});
    } catch (_) {}
    console.error('🔴 [MERCARI] uploadTempListingPhotos response shape unexpected', data);
    throw new Error('Upload succeeded but could not find photoId in response');
  }

  return { photoId, raw: data };
}

async function mercariKandoSuggest(photoId, blob, filename = 'blob') {
  const auth = await getMercariAuthHeaders();
  const form = new FormData();
  form.append(
    'operations',
    JSON.stringify({
      operationName: MERCARI_PERSISTED.kandoSuggestQuery.operationName,
      variables: { input: { photoId, photo: null } },
      extensions: { persistedQuery: { version: 1, sha256Hash: MERCARI_PERSISTED.kandoSuggestQuery.sha256Hash } },
    })
  );
  form.append('map', JSON.stringify({ '1': ['variables.input.photo'] }));
  form.append('1', blob, filename);

  const headers = buildMercariFetchHeaders(auth);
  headers.delete('content-type');

  const resp = await fetch('https://www.mercari.com/v1/api', {
    method: 'POST',
    headers,
    body: form,
    credentials: 'include',
  });
  const json = await resp.json().catch(() => null);
  if (!resp.ok) throw new Error(`Mercari suggest failed: HTTP ${resp.status}`);
  const data = parseMercariGraphqlResponse(json);
  return data;
}

function extractMercariSuggestion(data) {
  // Try to locate a node that looks like a listing suggestion with ids.
  const node = deepFindFirst(data, (o) => {
    const hasCat = typeof o?.categoryId === 'number' || typeof o?.categoryId === 'string';
    const hasBrand = typeof o?.brandId === 'number' || typeof o?.brandId === 'string';
    const hasCond = typeof o?.conditionId === 'number' || typeof o?.conditionId === 'string';
    return hasCat || hasBrand || hasCond;
  });

  const asNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  return {
    categoryId: asNum(node?.categoryId),
    brandId: asNum(node?.brandId),
    conditionId: asNum(node?.conditionId),
    sizeId: asNum(node?.sizeId),
    shippingPackageWeight: asNum(node?.shippingPackageWeight) || asNum(node?.suggestedWeightInOunce) || null,
    raw: node || null,
  };
}

async function fetchBlobFromUrl(url) {
  try {
    const u = typeof url === 'string' ? url : null;
    if (!u) {
      const asText = (() => {
        try {
          return JSON.stringify(url);
        } catch (_) {
          return String(url);
        }
      })();
      throw new Error(`image url was not a string: ${asText}`);
    }

    const resp = await fetch(u, { method: 'GET', cache: 'no-store', credentials: 'omit' });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`HTTP ${resp.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
    }
    return await resp.blob();
  } catch (e) {
    // If host_permissions is missing, Chrome throws TypeError: Failed to fetch (no status).
    const printable = (() => {
      try {
        return typeof url === 'string' ? url : JSON.stringify(url);
      } catch (_) {
        return String(url);
      }
    })();
    throw new Error(`Failed to fetch image URL (check host_permissions): ${printable} (${e?.message || String(e)})`);
  }
}

async function mercariCreateListing(input) {
  const data = await mercariPersistedJson(
    MERCARI_PERSISTED.createListing.operationName,
    MERCARI_PERSISTED.createListing.sha256Hash,
    { input }
  );

  // Expected shape: data.createListing.id
  let itemId = data?.createListing?.id || null;

  // Fallback: find any plausible id string anywhere
  if (!itemId) {
    const node = deepFindFirst(data, (o) => typeof o?.id === 'string' && String(o.id).length >= 6);
    itemId = node?.id || null;
  }

  if (!itemId) {
    try {
      chrome.storage.local.set({ mercariLastCreateDebug: { t: Date.now(), data } }, () => {});
    } catch (_) {}
  }
  return { itemId, raw: data };
}

function shouldRecordMercariUrl(url) {
  if (!url) return false;
  return (
    url.includes('www.mercari.com/v1/api') ||
    url.includes('mercari.com/v1/api') ||
    url.includes('api.mercari.com/') ||
    url.includes('www.mercari.com/api') ||
    url.includes('mercari.com/api')
  );
}

function decodeRequestBody(details) {
  const rb = details?.requestBody;
  if (!rb) return null;

  if (rb.formData && typeof rb.formData === 'object') {
    return { kind: 'formData', value: rb.formData };
  }

  if (Array.isArray(rb.raw) && rb.raw.length > 0) {
    try {
      const bytes = rb.raw[0]?.bytes;
      if (!bytes) return { kind: 'raw', value: null };
      const u8 = new Uint8Array(bytes);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(u8);
      const maxLen = 200_000;
      return {
        kind: 'rawText',
        value: text.length > maxLen ? `${text.slice(0, maxLen)}\\n/* …truncated… */` : text,
        truncated: text.length > maxLen,
        byteLength: u8.byteLength,
      };
    } catch (e) {
      return { kind: 'raw', value: null, error: e?.message || String(e) };
    }
  }

  return null;
}

function isFacebookInitiator(initiator) {
  try {
    if (!initiator || typeof initiator !== 'string') return false;
    return (
      initiator.includes('://www.facebook.com') ||
      initiator.includes('://m.facebook.com') ||
      initiator.includes('://web.facebook.com')
    );
  } catch (_) {
    return false;
  }
}

function shouldRecordFacebookRequest(details) {
  const url = details?.url || '';
  if (!url) return false;

  // Primary targets for Marketplace listing:
  // - GraphQL mutations/queries
  // - Upload endpoints (rupload / upload)
  const isGraphql =
    url.includes('facebook.com/api/graphql') ||
    url.includes('facebook.com/graphql') ||
    url.includes('graph.facebook.com/graphql');

  const isUpload =
    url.includes('upload.facebook.com') ||
    url.includes('rupload.facebook.com') ||
    url.includes('/upload/') ||
    url.includes('/rupload/');

  if (isGraphql || isUpload) return true;

  // If we start seeing missing calls, we can broaden, but keep it tight to reduce noise.
  return false;
}

function redactHeaderValue(name, value) {
  const n = String(name || '').toLowerCase();
  if (!value) return value;
  if (n === 'authorization') return '***';
  if (n === 'cookie') return '***';
  if (n === 'x-fb-lsd') return '***';
  if (n === 'x-csrf-token') return '***';
  return value;
}

function redactFacebookBody(bodyObj) {
  if (!bodyObj || typeof bodyObj !== 'object') return bodyObj;
  if (bodyObj.kind !== 'rawText' || typeof bodyObj.value !== 'string') return bodyObj;

  // Redact common sensitive fields that appear in urlencoded bodies for GraphQL:
  // fb_dtsg, lsd, jazoest, __user, __a
  const s = bodyObj.value;
  const redacted = s
    .replace(/(fb_dtsg=)[^&\s]+/gi, '$1***')
    .replace(/(\blsd=)[^&\s]+/gi, '$1***')
    .replace(/(jazoest=)[^&\s]+/gi, '$1***')
    .replace(/(__user=)[^&\s]+/gi, '$1***')
    .replace(/(__a=)[^&\s]+/gi, '$1***');

  return { ...bodyObj, value: redacted };
}

function pushFinalMercariRecord(rec) {
  mercariApiRecorder.records.push(rec);
  if (mercariApiRecorder.records.length > mercariApiRecorder.maxRecords) {
    mercariApiRecorder.records.splice(0, mercariApiRecorder.records.length - mercariApiRecorder.maxRecords);
  }
}

function pushFinalFacebookRecord(rec) {
  facebookApiRecorder.records.push(rec);
  if (facebookApiRecorder.records.length > facebookApiRecorder.maxRecords) {
    facebookApiRecorder.records.splice(0, facebookApiRecorder.records.length - facebookApiRecorder.maxRecords);
  }
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      if (!mercariApiRecorder.enabled) return;
      if (!shouldRecordMercariUrl(details.url)) return;
      if (details.type === 'image' || details.type === 'media') return;

      mercariApiRecorder.pending.set(details.requestId, {
        requestId: details.requestId,
        t: Date.now(),
        method: details.method,
        url: details.url,
        type: details.type,
        tabId: details.tabId,
        initiator: details.initiator || null,
        requestBody: decodeRequestBody(details),
        requestHeaders: null,
        statusCode: null,
        fromCache: null,
        error: null,
      });
    } catch (_) {}
  },
  { urls: ['https://*.mercari.com/*', 'https://mercari.com/*'] },
  ['requestBody']
);

// Facebook recorder: request body
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      if (!facebookApiRecorder.enabled) return;
      if (!shouldRecordFacebookRequest(details)) return;
      if (details.type === 'image' || details.type === 'media') return;

      facebookApiRecorder.pending.set(details.requestId, {
        requestId: details.requestId,
        t: Date.now(),
        method: details.method,
        url: details.url,
        type: details.type,
        tabId: details.tabId,
        initiator: details.initiator || null,
        requestBody: redactFacebookBody(decodeRequestBody(details)),
        requestHeaders: null,
        statusCode: null,
        fromCache: null,
        error: null,
      });
    } catch (_) {}
  },
  { urls: ['https://*.facebook.com/*', 'https://facebook.com/*', 'https://*.fbcdn.net/*', 'https://graph.facebook.com/*'] },
  ['requestBody']
);

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    try {
      // Persist key Mercari headers for API-mode
      if (details.url.includes('mercari.com/v1/api')) {
        const required = new Set([
          'authorization',
          'content-type',
          'x-csrf-token',
          'x-de-device-token',
          'x-app-version',
          'x-platform',
          'x-double-web',
          'apollo-require-preflight',
          'accept',
          'accept-language',
        ]);
        const captured = {};
        for (const h of details.requestHeaders || []) {
          const name = String(h?.name || '').toLowerCase();
          if (required.has(name) && h?.value) captured[name] = h.value;
        }
        if (Object.keys(captured).length) {
          chrome.storage.local.set(
            { mercariApiHeaders: captured, mercariApiHeadersTimestamp: Date.now() },
            () => {}
          );
        }
      }

      if (!mercariApiRecorder.enabled) return;
      if (!shouldRecordMercariUrl(details.url)) return;

      const rec =
        mercariApiRecorder.pending.get(details.requestId) || {
          requestId: details.requestId,
          t: Date.now(),
          method: details.method,
          url: details.url,
          type: details.type,
          tabId: details.tabId,
          initiator: details.initiator || null,
          requestBody: null,
          requestHeaders: null,
          statusCode: null,
          fromCache: null,
          error: null,
        };

      const keep = new Set([
        'authorization',
        'content-type',
        'x-csrf-token',
        'x-de-device-token',
        'x-app-version',
        'x-platform',
        'x-double-web',
        'apollo-require-preflight',
        'accept',
        'accept-language',
      ]);
      const headers = {};
      for (const h of details.requestHeaders || []) {
        const name = String(h?.name || '').toLowerCase();
        if (keep.has(name)) headers[name] = h.value;
      }
      rec.requestHeaders = headers;
      mercariApiRecorder.pending.set(details.requestId, rec);
    } catch (_) {}
  },
  {
    urls: ['https://www.mercari.com/v1/api*', 'https://api.mercari.com/*', 'https://*.mercari.com/*'],
    // NOTE: webRequest "types" does NOT include "fetch" (fetch requests are generally reported as "xmlhttprequest").
    types: ['xmlhttprequest'],
  },
  ['requestHeaders', 'extraHeaders']
);

// Facebook recorder: headers
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    try {
      if (!facebookApiRecorder.enabled) return;
      if (!shouldRecordFacebookRequest(details)) return;

      const rec =
        facebookApiRecorder.pending.get(details.requestId) || {
          requestId: details.requestId,
          t: Date.now(),
          method: details.method,
          url: details.url,
          type: details.type,
          tabId: details.tabId,
          initiator: details.initiator || null,
          requestBody: null,
          requestHeaders: null,
          statusCode: null,
          fromCache: null,
          error: null,
        };

      // Keep a focused set of headers that are useful for replay debugging.
      const keep = new Set([
        'content-type',
        'accept',
        'accept-language',
        'origin',
        'referer',
        'x-fb-lsd',
        'x-asbd-id',
        'x-fb-friendly-name',
        'x-fb-request-id',
        'x-fb-http-engine',
        'sec-fetch-site',
        'sec-fetch-mode',
        'sec-fetch-dest',
        'user-agent',
      ]);

      const headers = {};
      for (const h of details.requestHeaders || []) {
        const name = String(h?.name || '').toLowerCase();
        if (keep.has(name)) headers[name] = redactHeaderValue(name, h.value);
      }

      rec.requestHeaders = headers;
      facebookApiRecorder.pending.set(details.requestId, rec);
    } catch (_) {}
  },
  {
    urls: ['https://*.facebook.com/*', 'https://facebook.com/*', 'https://graph.facebook.com/*', 'https://upload.facebook.com/*', 'https://rupload.facebook.com/*'],
    types: ['xmlhttprequest'],
  },
  ['requestHeaders', 'extraHeaders']
);

chrome.webRequest.onCompleted.addListener(
  (details) => {
    try {
      if (!mercariApiRecorder.enabled) return;
      if (!shouldRecordMercariUrl(details.url)) return;
      const rec = mercariApiRecorder.pending.get(details.requestId);
      if (!rec) return;
      rec.statusCode = details.statusCode;
      rec.fromCache = !!details.fromCache;
      pushFinalMercariRecord(rec);
      mercariApiRecorder.pending.delete(details.requestId);
    } catch (_) {}
  },
  { urls: ['https://*.mercari.com/*', 'https://mercari.com/*'] }
);

chrome.webRequest.onCompleted.addListener(
  (details) => {
    try {
      if (!facebookApiRecorder.enabled) return;
      if (!shouldRecordFacebookRequest(details)) return;
      const rec = facebookApiRecorder.pending.get(details.requestId);
      if (!rec) return;
      rec.statusCode = details.statusCode;
      rec.fromCache = !!details.fromCache;
      pushFinalFacebookRecord(rec);
      facebookApiRecorder.pending.delete(details.requestId);
    } catch (_) {}
  },
  { urls: ['https://*.facebook.com/*', 'https://facebook.com/*', 'https://graph.facebook.com/*', 'https://upload.facebook.com/*', 'https://rupload.facebook.com/*'] }
);

chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    try {
      if (!mercariApiRecorder.enabled) return;
      if (!shouldRecordMercariUrl(details.url)) return;
      const rec = mercariApiRecorder.pending.get(details.requestId);
      if (!rec) return;
      rec.error = details.error || 'unknown';
      pushFinalMercariRecord(rec);
      mercariApiRecorder.pending.delete(details.requestId);
    } catch (_) {}
  },
  { urls: ['https://*.mercari.com/*', 'https://mercari.com/*'] }
);

chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    try {
      if (!facebookApiRecorder.enabled) return;
      if (!shouldRecordFacebookRequest(details)) return;
      const rec = facebookApiRecorder.pending.get(details.requestId);
      if (!rec) return;
      rec.error = details.error || 'unknown';
      pushFinalFacebookRecord(rec);
      facebookApiRecorder.pending.delete(details.requestId);
    } catch (_) {}
  },
  { urls: ['https://*.facebook.com/*', 'https://facebook.com/*', 'https://graph.facebook.com/*', 'https://upload.facebook.com/*', 'https://rupload.facebook.com/*'] }
);

// -----------------------------
// CONNECT_PLATFORM (cookie export)
// -----------------------------

async function exportCookiesForDomain(domain, urls = []) {
  const buckets = [];
  try {
    buckets.push(await chrome.cookies.getAll({ domain }));
  } catch (_) {}
  for (const url of urls) {
    try {
      buckets.push(await chrome.cookies.getAll({ url }));
    } catch (_) {}
  }
  const cookies = buckets.flat().filter(Boolean);

  const mapSameSite = (v) => {
    if (!v) return undefined;
    const s = String(v).toLowerCase();
    if (s === 'lax') return 'Lax';
    if (s === 'strict') return 'Strict';
    if (s === 'no_restriction') return 'None';
    return undefined;
  };

  return cookies.map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    expires: cookie.expirationDate || -1,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: mapSameSite(cookie.sameSite),
  }));
}

async function getMercariApiHeaders() {
  try {
    const stored = await chrome.storage.local.get(['mercariApiHeaders']);
    return stored?.mercariApiHeaders || null;
  } catch (_) {
    return null;
  }
}

async function connectPlatform(platform, apiUrl, authToken) {
  const isMercari = platform === 'mercari';
  const isFacebook = platform === 'facebook';
  const cookies = await exportCookiesForDomain(
    isMercari ? 'mercari.com' : `${platform}.com`,
    isMercari
      ? ['https://www.mercari.com/', 'https://www.mercari.com/sell/']
      : isFacebook
        ? ['https://www.facebook.com/', 'https://www.facebook.com/marketplace/', 'https://m.facebook.com/']
        : []
  );
  const apiHeaders = isMercari ? await getMercariApiHeaders() : null;

  const resp = await fetch(`${apiUrl}/api/platform/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ platform, cookies, apiHeaders }),
  });

  const text = await resp.text().catch(() => '');
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_) {
    json = null;
  }

  if (!resp.ok) {
    const msg =
      json?.error || json?.message || `API error: ${resp.status}${text ? ` - ${text.slice(0, 300)}` : ''}`;
    throw new Error(msg);
  }

  return json || { success: true };
}

// -----------------------------
// Messages
// -----------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const type = message?.type;

  if (type && type.endsWith('_LOGIN_STATUS')) {
    const marketplace = message.marketplace;
    const data = message.data || {};
    if (marketplace && marketplaceStatus[marketplace]) {
      marketplaceStatus[marketplace] = {
        loggedIn: !!data.loggedIn,
        userName: data.userName || null,
        lastChecked: Date.now(),
        ...data,
      };
      saveMarketplaceStatus();
      notifyProfitOrbit({
        type: 'MARKETPLACE_STATUS_UPDATE',
        marketplace,
        data: marketplaceStatus[marketplace],
      }).catch(() => {});
    }
    sendResponse({ success: true });
    return true;
  }

  if (type === 'GET_ALL_STATUS') {
    sendResponse({ status: marketplaceStatus });
    return true;
  }

  if (type === 'START_MERCARI_API_RECORDING') {
    mercariApiRecorder.enabled = true;
    mercariApiRecorder.startedAt = Date.now();
    mercariApiRecorder.records = [];
    mercariApiRecorder.pending.clear();
    sendResponse({ success: true, startedAt: mercariApiRecorder.startedAt });
    return true;
  }

  if (type === 'STOP_MERCARI_API_RECORDING') {
    mercariApiRecorder.enabled = false;
    const count = mercariApiRecorder.records.length;
    const safeRecords = mercariApiRecorder.records.map((r) => {
      const hdrs = { ...(r.requestHeaders || {}) };
      if (hdrs.authorization) {
        const v = String(hdrs.authorization);
        hdrs.authorization = v.startsWith('Bearer ') ? `Bearer ${v.slice(7, 17)}…redacted…` : '…redacted…';
      }
      return { ...r, requestHeaders: hdrs };
    });
    chrome.storage.local.set(
      { mercariApiLastRecording: { startedAt: mercariApiRecorder.startedAt, stoppedAt: Date.now(), recordsCount: count, records: safeRecords } },
      () => {}
    );
    sendResponse({ success: true, startedAt: mercariApiRecorder.startedAt, stoppedAt: Date.now(), recordsCount: count, records: safeRecords });
    return true;
  }

  if (type === 'GET_MERCARI_API_RECORDING') {
    const safe = mercariApiRecorder.records.map((r) => {
      const hdrs = { ...(r.requestHeaders || {}) };
      if (hdrs.authorization) {
        const v = String(hdrs.authorization);
        hdrs.authorization = v.startsWith('Bearer ') ? `Bearer ${v.slice(7, 17)}…redacted…` : '…redacted…';
      }
      return { ...r, requestHeaders: hdrs };
    });
    sendResponse({ success: true, startedAt: mercariApiRecorder.startedAt, records: safe });
    return true;
  }

  if (type === 'CLEAR_MERCARI_API_RECORDING') {
    mercariApiRecorder.records = [];
    mercariApiRecorder.pending.clear();
    sendResponse({ success: true });
    return true;
  }

  // -----------------------------
  // Facebook API Recorder controls
  // -----------------------------

  if (type === 'START_FACEBOOK_API_RECORDING') {
    facebookApiRecorder.enabled = true;
    facebookApiRecorder.startedAt = Date.now();
    facebookApiRecorder.records = [];
    facebookApiRecorder.pending = new Map();
    console.log('🟦 [FACEBOOK] API recording started');
    sendResponse({ success: true, startedAt: facebookApiRecorder.startedAt });
    return true;
  }

  if (type === 'STOP_FACEBOOK_API_RECORDING') {
    facebookApiRecorder.enabled = false;
    const endedAt = Date.now();
    const records = facebookApiRecorder.records.slice();
    console.log('🟦 [FACEBOOK] API recording stopped', { count: records.length });
    try {
      chrome.storage.local.set(
        { facebookApiLastRecording: { t: endedAt, count: records.length, records } },
        () => {}
      );
    } catch (_) {}
    sendResponse({ success: true, startedAt: facebookApiRecorder.startedAt, endedAt, count: records.length, records });
    return true;
  }

  if (type === 'GET_FACEBOOK_API_RECORDING') {
    sendResponse({
      success: true,
      enabled: facebookApiRecorder.enabled,
      startedAt: facebookApiRecorder.startedAt,
      count: facebookApiRecorder.records.length,
      records: facebookApiRecorder.records.slice(),
    });
    return true;
  }

  if (type === 'CLEAR_FACEBOOK_API_RECORDING') {
    facebookApiRecorder.records = [];
    facebookApiRecorder.pending = new Map();
    facebookApiRecorder.startedAt = null;
    facebookApiRecorder.enabled = false;
    try {
      chrome.storage.local.remove(['facebookApiLastRecording'], () => {});
    } catch (_) {}
    console.log('🟦 [FACEBOOK] API recording cleared');
    sendResponse({ success: true, cleared: true });
    return true;
  }

  // (removed duplicate Facebook recorder message handler block)

  if (type === 'CREATE_MERCARI_LISTING') {
    (async () => {
      try {
        console.log('🟣 [MERCARI] CREATE_MERCARI_LISTING received', {
          fromTabId: sender?.tab?.id ?? null,
          hasListingData: !!message?.listingData,
        });

        const listingData = message?.listingData || {};
        const payload = listingData?.payload || listingData || {};

        const title = String(payload.title || payload.name || '').trim();
        const description = String(payload.description || '').trim();
        const price = Number(payload.price);

        // Accept a few common payload shapes and normalize to images[]
        const toUrl = (v) => {
          if (!v) return null;
          if (typeof v === 'string') return v;
          if (typeof v === 'object') {
            return (
              v.preview ||
              v.url ||
              v.href ||
              v.src ||
              v.original ||
              v.signedUrl ||
              v.publicUrl ||
              null
            );
          }
          return null;
        };

        const images =
          (Array.isArray(payload.images) ? payload.images :
          (typeof payload.images === 'string' && payload.images) ? [payload.images] :
          Array.isArray(payload.image_urls) ? payload.image_urls :
          Array.isArray(payload.imageUrls) ? payload.imageUrls :
          Array.isArray(payload.photo_urls) ? payload.photo_urls :
          Array.isArray(payload.photoUrls) ? payload.photoUrls :
          Array.isArray(payload.photos) ? payload.photos :
          (typeof payload.image_url === 'string' && payload.image_url) ? [payload.image_url] :
          (typeof payload.imageUrl === 'string' && payload.imageUrl) ? [payload.imageUrl] :
          []).map(toUrl).filter(Boolean);

        if (!title) throw new Error('Missing title');
        if (!Number.isFinite(price) || price <= 0) throw new Error('Missing/invalid price');
        if (!images.length) throw new Error('Missing images (need at least 1 image URL). Expected payload.images[] or payload.image_url.');

        // Load defaults learned from prior successful listings (zipCode, shipping defaults, etc.)
        const defaults = await getMercariListingDefaults();

        const normalizeZip = (z) => {
          if (!z) return null;
          const s = String(z).trim();
          // keep only digits
          const digits = s.replace(/\D/g, '');
          if (digits.length >= 5) return digits.slice(0, 5);
          return null;
        };

        // Prefer explicit zip from payload (your app already has shipsFrom like "02356")
        // Fallback to stored defaults, and finally try Mercari sellQuery.
        let zipCode = normalizeZip(
          payload.zipCode ??
            payload.zip ??
            payload.postalCode ??
            payload.postal_code ??
            payload.shipsFrom ??
            payload.ships_from ??
            defaults.zipCode
        );
        if (!zipCode) {
          try {
            const sell = await mercariPersistedJson(
              MERCARI_PERSISTED.sellQuery.operationName,
              MERCARI_PERSISTED.sellQuery.sha256Hash,
              { sellInput: { shippingPayerId: 2, photoIds: [] }, shouldFetchSuggestedPrice: true, includeSuggestedShippingOptions: false }
            );
            const zipNode = deepFindFirst(sell, (o) => typeof o?.zipCode === 'string' && o.zipCode.length >= 5);
            if (zipNode?.zipCode) {
              zipCode = normalizeZip(zipNode.zipCode);
              await setMercariListingDefaults({ zipCode });
            }
          } catch (_) {
            // ignore; we'll validate later
          }
        }

        // Upload first image (MVP).
        const firstUrl = images[0];
        console.log('🟦 [MERCARI] Using image URL', { firstUrlType: typeof firstUrl, firstUrl });
        const rawBlob = await fetchBlobFromUrl(firstUrl);
        const filename = payload.filename || 'image.jpg';
        console.log('🟦 [MERCARI] Downloaded image blob', {
          type: rawBlob?.type || null,
          size: rawBlob?.size || null,
          filename,
        });

        const normalized = await normalizeMercariImageForUpload(rawBlob, filename);
        const blob = normalized.blob;
        const uploadName = normalized.filename;
        console.log('🟦 [MERCARI] Normalized image for upload', {
          note: normalized.note,
          type: blob?.type || null,
          size: blob?.size || null,
          uploadName,
        });

        const up = await mercariUploadTempListingPhoto(blob, uploadName);
        const photoIds = [up.photoId];

        // Suggest category/brand/condition based on image (Mercari's own flow).
        let suggestion = null;
        try {
          const suggestData = await mercariKandoSuggest(up.photoId, blob, filename);
          suggestion = extractMercariSuggestion(suggestData);
        } catch (_) {
          suggestion = null;
        }

        const categoryId = Number(payload.categoryId ?? payload.mercariCategoryId ?? suggestion?.categoryId);

        const conditionText = String(payload.condition ?? payload.itemCondition ?? '').trim().toLowerCase();
        const mapConditionTextToId = (t) => {
          // Best-effort fallback mapping when kandoSuggest doesn't provide a condition.
          // NOTE: Mercari condition IDs can change; this mapping is a pragmatic default.
          // If Mercari rejects it, we'll capture the error and refine using recorded API calls.
          if (!t) return null;
          if (t.includes('new') && (t.includes('with tags') || t.includes('nwt'))) return 1;
          if (t === 'new' || t.includes('brand new')) return 1;
          if (t.includes('like new') || t.includes('ln')) return 2;
          if (t.includes('good')) return 3;
          if (t.includes('fair')) return 4;
          if (t.includes('poor') || t.includes('damaged') || t.includes('for parts')) return 5;
          return null;
        };

        const conditionIdRaw =
          payload.conditionId ??
          payload.mercariConditionId ??
          suggestion?.conditionId ??
          defaults.conditionId ??
          mapConditionTextToId(conditionText);
        const conditionId = Number(conditionIdRaw);
        const brandIdRaw = payload.brandId ?? payload.mercariBrandId ?? suggestion?.brandId;
        const brandId = brandIdRaw === undefined || brandIdRaw === null || brandIdRaw === '' ? null : Number(brandIdRaw);

        if (!Number.isFinite(categoryId) || categoryId <= 0) {
          throw new Error('Missing Mercari categoryId (kandoSuggest did not provide one).');
        }
        if (!Number.isFinite(conditionId) || conditionId <= 0) {
          console.warn('⚠️ [MERCARI] Missing conditionId from kandoSuggest; tried fallbacks', {
            fromPayloadConditionId: payload.conditionId ?? payload.mercariConditionId ?? null,
            fromDefaultsConditionId: defaults.conditionId ?? null,
            fromConditionText: conditionText || null,
            fromMappedConditionId: mapConditionTextToId(conditionText),
            suggestionConditionId: suggestion?.conditionId ?? null,
          });
          throw new Error('Missing Mercari conditionId (kandoSuggest did not provide one, and no fallback was available).');
        }
        if (!zipCode) {
          throw new Error('Missing zipCode (could not infer from Mercari). Please provide zipCode in payload.');
        }

        const shippingPayerId = Number(payload.shippingPayerId ?? defaults.shippingPayerId ?? 2);
        const shippingClassIds = Array.isArray(payload.shippingClassIds)
          ? payload.shippingClassIds.map(Number)
          : Array.isArray(defaults.shippingClassIds)
            ? defaults.shippingClassIds.map(Number)
            : [0];

        const shippingPackageWeight = Number(
          payload.shippingPackageWeight ?? defaults.shippingPackageWeight ?? suggestion?.shippingPackageWeight ?? 0
        );
        const sizeId = Number(payload.sizeId ?? defaults.sizeId ?? suggestion?.sizeId ?? 0);

        const isAutoPriceDrop = payload.isAutoPriceDrop ?? defaults.isAutoPriceDrop ?? false;
        const minPriceForAutoPriceDrop = Number(payload.minPriceForAutoPriceDrop ?? defaults.minPriceForAutoPriceDrop ?? 0);

        // Mercari fee is typically 10%; use 10% as default if not provided.
        const salesFee = Number(payload.salesFee ?? Math.round(price * 0.1));

        const input = {
          photoIds,
          name: title,
          price,
          description,
          categoryId,
          conditionId,
          zipCode,
          shippingPayerId,
          shippingClassIds,
          salesFee,
        };

        if (Number.isFinite(brandId) && brandId > 0) input.brandId = brandId;
        if (Number.isFinite(shippingPackageWeight) && shippingPackageWeight > 0) input.shippingPackageWeight = shippingPackageWeight;
        if (Number.isFinite(sizeId) && sizeId > 0) input.sizeId = sizeId;
        if (isAutoPriceDrop) {
          input.isAutoPriceDrop = true;
          if (Number.isFinite(minPriceForAutoPriceDrop) && minPriceForAutoPriceDrop > 0) {
            input.minPriceForAutoPriceDrop = minPriceForAutoPriceDrop;
          }
        }

        // Persist defaults for next time (helps reduce required user inputs).
        await setMercariListingDefaults({
          zipCode,
          shippingPayerId,
          shippingClassIds,
          conditionId,
          shippingPackageWeight: Number.isFinite(shippingPackageWeight) ? shippingPackageWeight : undefined,
          sizeId: Number.isFinite(sizeId) ? sizeId : undefined,
          isAutoPriceDrop: !!isAutoPriceDrop,
          minPriceForAutoPriceDrop: Number.isFinite(minPriceForAutoPriceDrop) ? minPriceForAutoPriceDrop : undefined,
        });

        const created = await mercariCreateListing(input);
        if (!created.itemId) {
          // Save debug and return a "might be processing" success to avoid double-posting.
          try {
            chrome.storage.local.set({ mercariLastCreateDebug: { t: Date.now(), data: created.raw } }, () => {});
          } catch (_) {}
          throw new Error('Listing created but could not determine Mercari itemId from response');
        }

        const itemIdStr = String(created.itemId);
        // Prefer canonical items URL; keep /us/item as secondary fallback.
        const url =
          itemIdStr.startsWith('m')
            ? `https://www.mercari.com/items/${itemIdStr}/`
            : `https://www.mercari.com/us/item/${itemIdStr}/`;
        console.log('🟢 [MERCARI] Listing created', { itemId: created.itemId, url });
        sendResponse({
          success: true,
          itemId: created.itemId,
          url,
          photoIds,
          used: { categoryId, conditionId, brandId: brandId || null, zipCode },
        });
      } catch (e) {
        console.error('🔴 [MERCARI] CREATE_MERCARI_LISTING failed', e);
        sendResponse({ success: false, error: e?.message || String(e) });
      }
    })();
    return true;
  }

  if (type === 'CREATE_FACEBOOK_LISTING') {
    (async () => {
      try {
        console.log('🟣 [FACEBOOK] CREATE_FACEBOOK_LISTING received', {
          fromTabId: sender?.tab?.id ?? null,
          hasListingData: !!message?.listingData,
        });

        const listingData = message?.listingData || {};
        const payload = listingData?.payload || listingData || {};

        const title = String(payload.title || payload.name || '').trim();
        const description = String(payload.description || '').trim();
        const price = payload.price ?? payload.listing_price ?? payload.amount ?? null;

        const toUrl = (v) => {
          if (!v) return null;
          if (typeof v === 'string') return v;
          if (typeof v === 'object') {
            return (
              v.preview ||
              v.url ||
              v.href ||
              v.src ||
              v.original ||
              v.signedUrl ||
              v.publicUrl ||
              null
            );
          }
          return null;
        };

        const images =
          (Array.isArray(payload.images) ? payload.images :
          (typeof payload.images === 'string' && payload.images) ? [payload.images] :
          Array.isArray(payload.image_urls) ? payload.image_urls :
          Array.isArray(payload.imageUrls) ? payload.imageUrls :
          Array.isArray(payload.photo_urls) ? payload.photo_urls :
          Array.isArray(payload.photoUrls) ? payload.photoUrls :
          Array.isArray(payload.photos) ? payload.photos :
          (typeof payload.image_url === 'string' && payload.image_url) ? [payload.image_url] :
          (typeof payload.imageUrl === 'string' && payload.imageUrl) ? [payload.imageUrl] :
          []).map(toUrl).filter(Boolean);

        if (!title) throw new Error('Missing title');
        if (!images.length) throw new Error('Missing images (need at least 1 image URL). Expected payload.images[] or payload.image_url.');

        // Load last FB recording as a "template" for endpoints/doc_ids/headers.
        const last = await new Promise((resolve) => {
          try {
            chrome.storage.local.get(['facebookApiLastRecording'], (r) => resolve(r?.facebookApiLastRecording || null));
          } catch (_) {
            resolve(null);
          }
        });
        const records = Array.isArray(last?.records) ? last.records : Array.isArray(last) ? last : [];
        if (!records.length) {
          throw new Error('No Facebook API recording found in extension storage. Run start/stop Facebook API recording once while creating a Marketplace item.');
        }

        const pickGraphqlTemplate = (recs) => {
          // Heuristic: find a Marketplace create/publish mutation call
          const graphql = recs.filter((r) => typeof r?.url === 'string' && r.url.includes('/api/graphql') && String(r.method || '').toUpperCase() === 'POST');
          const scored = graphql
            .map((r) => {
              const body = String(r?.requestBody || '');
              const friendly = /fb_api_req_friendly_name=([^&]+)/.exec(body)?.[1] || '';
              const hasMarketplace = body.includes('Marketplace') || decodeURIComponent(friendly || '').includes('Marketplace');
              const hasCreate = body.toLowerCase().includes('create') || decodeURIComponent(friendly || '').toLowerCase().includes('create');
              const hasDoc = /doc_id=\d+/.test(body);
              const score = (hasMarketplace ? 10 : 0) + (hasCreate ? 5 : 0) + (hasDoc ? 5 : 0) + (body.includes('variables=') ? 2 : 0);
              return { r, score };
            })
            .sort((a, b) => b.score - a.score);
          return scored[0]?.r || null;
        };

        const pickUploadTemplate = (recs) => {
          const uploads = recs.filter(
            (r) =>
              typeof r?.url === 'string' &&
              (r.url.includes('rupload.facebook.com') || r.url.includes('upload.facebook.com')) &&
              String(r.method || '').toUpperCase() === 'POST'
          );
          return uploads[0] || null;
        };

        const graphqlTemplate = pickGraphqlTemplate(records);
        if (!graphqlTemplate) throw new Error('Could not find a Facebook Marketplace GraphQL template in the recording.');

        const uploadTemplate = pickUploadTemplate(records);
        if (!uploadTemplate) {
          throw new Error('Could not find a Facebook upload template in the recording (rupload/upload). Re-record while uploading at least 1 photo.');
        }

        const parseFormBody = (bodyText) => {
          const out = {};
          const s = String(bodyText || '');
          for (const part of s.split('&')) {
            if (!part) continue;
            const [k, v = ''] = part.split('=');
            try {
              out[decodeURIComponent(k)] = decodeURIComponent(v);
            } catch (_) {
              out[k] = v;
            }
          }
          return out;
        };

        const encodeFormBody = (obj) => {
          const parts = [];
          for (const [k, v] of Object.entries(obj || {})) {
            if (v === undefined || v === null) continue;
            parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
          }
          return parts.join('&');
        };

        // Get user id from cookies (used by FB bodies as __user/av)
        const fbUserId = await new Promise((resolve) => {
          try {
            chrome.cookies.get({ url: 'https://www.facebook.com', name: 'c_user' }, (c) => resolve(c?.value || null));
          } catch (_) {
            resolve(null);
          }
        });

        // Download first image
        const firstUrl = images[0];
        console.log('🟦 [FACEBOOK] Using image URL', { firstUrlType: typeof firstUrl, firstUrl });
        const rawBlob = await fetchBlobFromUrl(firstUrl);
        console.log('🟦 [FACEBOOK] Downloaded image blob', { type: rawBlob?.type || null, size: rawBlob?.size || null });

        // Upload using the recorded template URL/headers (best-effort)
        const uploadHeaders = { ...(uploadTemplate.requestHeaders || {}) };
        // Avoid forbidden headers
        delete uploadHeaders['content-length'];
        delete uploadHeaders['host'];
        delete uploadHeaders['cookie'];
        // Update content-type for binary upload if not present
        if (!uploadHeaders['content-type']) uploadHeaders['content-type'] = 'application/octet-stream';
        if (rawBlob?.type) uploadHeaders['x-fb-photo-content-type'] = rawBlob.type;

        const uploadResp = await fetch(uploadTemplate.url, {
          method: 'POST',
          headers: uploadHeaders,
          body: await rawBlob.arrayBuffer(),
          credentials: 'include',
        });
        const uploadText = await uploadResp.text().catch(() => '');
        let uploadJson = null;
        try { uploadJson = uploadText ? JSON.parse(uploadText) : null; } catch (_) { uploadJson = null; }

        const findFirstId = (j) => {
          const hit = deepFindFirst(j, (o) => typeof o?.fbid === 'string' || typeof o?.fbid === 'number' || typeof o?.photo_id === 'string' || typeof o?.photo_id === 'number');
          const v = hit?.fbid ?? hit?.photo_id ?? null;
          if (v) return String(v);
          const m = /"fbid"\s*:\s*"?(\d{8,})"?/.exec(uploadText) || /"photo_id"\s*:\s*"?(\d{8,})"?/.exec(uploadText);
          return m?.[1] || null;
        };
        const photoId = uploadJson ? findFirstId(uploadJson) : findFirstId({ text: uploadText });
        if (!photoId) {
          try { chrome.storage.local.set({ facebookLastUploadDebug: { t: Date.now(), ok: uploadResp.ok, status: uploadResp.status, url: uploadTemplate.url, headers: uploadHeaders, text: uploadText.slice(0, 20000) } }, () => {}); } catch (_) {}
          throw new Error('Facebook upload succeeded but could not determine uploaded photo id. Saved debug as facebookLastUploadDebug.');
        }
        console.log('🟦 [FACEBOOK] Uploaded photo', { photoId, status: uploadResp.status });

        // Build GraphQL request from template, overriding variables + tokens where possible
        const form = parseFormBody(graphqlTemplate.requestBody || '');
        const friendlyName = form.fb_api_req_friendly_name || null;
        const docId = form.doc_id || null;
        if (!docId) throw new Error('Facebook GraphQL template missing doc_id');

        let vars = {};
        try { vars = form.variables ? JSON.parse(form.variables) : {}; } catch (_) { vars = {}; }

        // Best-effort variable overrides
        const deepMutate = (obj, visit) => {
          if (!obj || typeof obj !== 'object') return;
          if (Array.isArray(obj)) return obj.forEach((v) => deepMutate(v, visit));
          for (const k of Object.keys(obj)) {
            visit(obj, k);
            deepMutate(obj[k], visit);
          }
        };
        deepMutate(vars, (o, k) => {
          const lk = String(k).toLowerCase();
          if (lk.includes('title') && typeof o[k] === 'string') o[k] = title;
          if (lk.includes('description') && typeof o[k] === 'string') o[k] = description;
          if (lk.includes('price')) {
            if (typeof o[k] === 'number') o[k] = Number(price) || o[k];
            if (typeof o[k] === 'string' && String(price ?? '').trim()) o[k] = String(price);
          }
        });

        // Inject photoId into common fields
        const setFirstPhotoField = (obj) => {
          let did = false;
          deepMutate(obj, (o, k) => {
            const lk = String(k).toLowerCase();
            if (did) return;
            if (lk === 'photo_id' || lk === 'photoid' || lk === 'photo_fbid') {
              o[k] = photoId;
              did = true;
              return;
            }
            if ((lk.includes('photo') || lk.includes('image')) && Array.isArray(o[k])) {
              // replace first array that looks like ids
              o[k] = [photoId];
              did = true;
            }
          });
          return did;
        };
        setFirstPhotoField(vars);

        // Override known token fields if present
        if (fbUserId) {
          if (form.__user) form.__user = fbUserId;
          if (form.av) form.av = fbUserId;
        }
        form.doc_id = docId;
        if (friendlyName) form.fb_api_req_friendly_name = friendlyName;
        form.variables = JSON.stringify(vars);

        const gqlHeaders = { ...(graphqlTemplate.requestHeaders || {}) };
        delete gqlHeaders['content-length'];
        delete gqlHeaders['host'];
        delete gqlHeaders['cookie'];
        if (!gqlHeaders['content-type']) gqlHeaders['content-type'] = 'application/x-www-form-urlencoded';

        const gqlResp = await fetch(graphqlTemplate.url, {
          method: 'POST',
          headers: gqlHeaders,
          body: encodeFormBody(form),
          credentials: 'include',
        });
        const gqlText = await gqlResp.text().catch(() => '');
        let gqlJson = null;
        try { gqlJson = gqlText ? JSON.parse(gqlText) : null; } catch (_) { gqlJson = null; }

        // Extract listing id best-effort
        const idNode = gqlJson ? deepFindFirst(gqlJson, (o) => typeof o?.id === 'string' && /^\d{8,}$/.test(o.id)) : null;
        const listingId = idNode?.id || (/\"id\"\s*:\s*\"(\d{8,})\"/.exec(gqlText)?.[1] || null);
        const url = listingId ? `https://www.facebook.com/marketplace/item/${listingId}/` : null;

        try { chrome.storage.local.set({ facebookLastCreateDebug: { t: Date.now(), ok: gqlResp.ok, status: gqlResp.status, url: graphqlTemplate.url, docId, friendlyName, listingId, response: gqlJson || gqlText.slice(0, 20000) } }, () => {}); } catch (_) {}

        if (!gqlResp.ok) {
          throw new Error(`Facebook GraphQL create failed: ${gqlResp.status}`);
        }

        console.log('🟢 [FACEBOOK] Listing request completed', { listingId, url });
        sendResponse({ success: true, listingId, url, photoId });
      } catch (e) {
        console.error('🔴 [FACEBOOK] CREATE_FACEBOOK_LISTING failed', e);
        sendResponse({ success: false, error: e?.message || String(e) });
      }
    })();
    return true;
  }

  if (type === 'CONNECT_PLATFORM') {
    (async () => {
      try {
        const { platform, apiUrl, authToken } = message || {};
        if (!platform) throw new Error('platform is required');
        if (!apiUrl || !authToken) throw new Error('API URL and auth token are required');
        const result = await connectPlatform(platform, apiUrl, authToken);
        sendResponse({ success: true, result });
      } catch (e) {
        sendResponse({ success: false, error: e?.message || String(e) });
      }
    })();
    return true;
  }

  sendResponse({ ok: false, ignored: true });
  return true;
});

console.log('Profit Orbit Extension: Background initialized');