import { supabase } from './supabase';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const REQUEST_TIMEOUT = 30000; // 30 seconds

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type':  'application/json'
  };
}

async function request(method, path, body = null, { timeout = REQUEST_TIMEOUT, retries = 1 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const headers = await authHeaders();
      const res = await fetch(`${BASE}/api${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (res.status === 401) {
        await supabase.auth.signOut();
        window.location.href = '/login';
        throw new Error('Session expired. Please sign in again.');
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      return data;

    } catch (err) {
      clearTimeout(timer);
      lastError = err;

      if (err.name === 'AbortError') {
        lastError = new Error(`Request timed out after ${timeout / 1000}s`);
      }

      // Only retry on network errors, not on 4xx/5xx
      if (attempt < retries && err.name === 'TypeError') {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError;
}

export const api = {
  // Documents
  listDocuments:  (params = {}) => request('GET', `/documents?${new URLSearchParams(params)}`),
  uploadDocuments: async (files, clientId, folderId, source = 'web') => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000); // 2 min for uploads

    try {
      const form = new FormData();
      files.forEach(f => form.append('files', f));
      form.append('client_id', clientId);
      if (folderId) form.append('folder_id', folderId);
      form.append('upload_source', source);

      const res = await fetch(`${BASE}/api/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (res.status === 401) {
        await supabase.auth.signOut();
        window.location.href = '/login';
        throw new Error('Session expired. Please sign in again.');
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data;
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') throw new Error('Upload timed out');
      throw err;
    }
  },
  downloadDocument: (id)                     => request('GET',   `/documents/${id}/download`),
  updateDocStatus:  (id, status, note)        => request('PATCH', `/documents/${id}/status`, { status, review_note: note }),
  deleteDocument:   (id)                      => request('DELETE',`/documents/${id}`),

  // Clients
  listClients:   ()        => request('GET',  '/clients'),
  createClient:  (body)    => request('POST', '/clients', body),
  getClient:     (id)      => request('GET',  `/clients/${id}`),
  updateClient:  (id, body)=> request('PATCH',`/clients/${id}`, body),

  // Folders
  listFolders:  (clientId) => request('GET',  `/folders?client_id=${clientId}`),
  createFolder: (body)     => request('POST', '/folders', body),

  // Document requests
  listRequests:    (params = {}) => request('GET',  `/requests?${new URLSearchParams(params)}`),
  createRequest:   (body)        => request('POST', '/requests', body),
  fulfillRequest:  (id, docId)   => request('PATCH',`/requests/${id}/fulfill`, { document_id: docId }),

  // Approvals
  listApprovals: ()  => request('GET', '/approvals'),
  approvalStats: ()  => request('GET', '/approvals/stats'),

  // Auth / profile
  me:                  ()    => request('GET',   '/auth/me'),
  registerClient:      (body)=> request('POST',  '/auth/register-client', body),
  inviteClient:        (email)=>request('POST',  '/auth/invite', { email }),
  getNotifications:    ()    => request('GET',   '/auth/notifications'),
  markAllRead:         ()    => request('PATCH', '/auth/notifications/read-all'),

  // Audit
  getAuditLog: (params = {}) => request('GET', `/audit?${new URLSearchParams(params)}`),

  // Staff management
  listStaff:       (params = {}) => request('GET',  `/staff?${new URLSearchParams(params)}`),
  createStaff:     (body)        => request('POST', '/staff', body),
  assignStaff:     (body)        => request('POST', '/staff/assign', body),
  removeAssignment:(id)          => request('DELETE', `/staff/assign/${id}`),
  getStaffClients: (id)          => request('GET',  `/staff/${id}/clients`),

  // Pending actions
  listPendingActions:  (params = {}) => request('GET',   `/pending-actions?${new URLSearchParams(params)}`),
  createPendingAction: (body)        => request('POST',  '/pending-actions', body),
  reviewPendingAction: (id, body)    => request('PATCH', `/pending-actions/${id}`, body),
};
