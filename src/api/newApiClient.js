/**
 * New API Client - Replacement for Base44 SDK
 * 
 * This client provides a similar interface to Base44 SDK but uses our Supabase API routes.
 * This makes migration easier as we can keep similar patterns.
 */

// Base API URL
const API_BASE = '/api';

// Helper function to get user ID from Supabase auth
import { getCurrentUserId } from './supabaseClient';

async function getUserId() {
  try {
    const userId = await getCurrentUserId();
    return userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const userId = await getUserId();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(userId && { 'x-user-id': userId }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API request failed: ${response.statusText}`);
  }

  return response.json();
}

// Entity wrapper class to mimic Base44 pattern
class EntityWrapper {
  constructor(entityName) {
    this.entityName = entityName;
  }

  async get(id) {
    return apiRequest(`/${this.entityName}?id=${id}`);
  }

  async list(sort = null) {
    const params = sort ? `?sort=${sort}` : '';
    return apiRequest(`/${this.entityName}${params}`);
  }

  async create(data) {
    return apiRequest(`/${this.entityName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(id, data) {
    return apiRequest(`/${this.entityName}?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(id, hard = false) {
    const params = hard ? `?id=${id}&hard=true` : `?id=${id}`;
    return apiRequest(`/${this.entityName}${params}`, {
      method: 'DELETE',
    });
  }
}

// File upload function (replaces base44.integrations.Core.UploadFile)
export async function uploadFile({ file }) {
  const userId = await getUserId();
  
  const formData = new FormData();
  formData.append('file', file);

  const headers = {
    ...(userId && { 'x-user-id': userId }),
  };

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'File upload failed');
  }

  const result = await response.json();
  return { file_url: result.file_url };
}

// Create entity instances
export const entities = {
  InventoryItem: new EntityWrapper('inventory'),
  Sale: new EntityWrapper('sales'),
  ImageEditorTemplate: new EntityWrapper('image-templates'),
  Crosslisting: new EntityWrapper('crosslistings'),
};

// Export a default object that mimics Base44 structure
const newApiClient = {
  entities,
  integrations: {
    Core: {
      UploadFile: uploadFile,
    },
  },
};

export default newApiClient;

