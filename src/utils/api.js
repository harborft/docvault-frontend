import { supabase } from './supabase';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Attach the logged-in user's JWT to every request automatically
async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type':  'application/json'
  };
}

async function request(method, path, body = null) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Documents
export const api = {
  // Documents
  listDocuments:  (params = {}) => request('GET', `/documents?${new URLSearchParams(params)}`),
  uploadDocuments: async (files, clientId, folderId, source = 'web') => {
    const { data: { session } } = await supabase.auth.getSession();
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    form.append('client_id', clientId);
    if (folderId) form.append('folder_id', folderId);
    form.append('upload_source', source);
    const res = await fetch(`${BASE}/api/documents/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
      body: form
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
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
};
