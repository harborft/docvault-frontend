// ClientPortalPage.js — what clients see when they log in
import React, { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { api }     from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

const STATUS_PILL = {
  pending:   { bg: '#E6F1FB', color: '#0C447C', label: 'In Review' },
  in_review: { bg: '#FFF7E6', color: '#8A5C00', label: 'Being Reviewed' },
  approved:  { bg: '#EAF3DE', color: '#27500A', label: 'Approved ✓' },
  flagged:   { bg: '#FCEBEB', color: '#A32D2D', label: 'Action Needed' },
};

export default function ClientPortalPage() {
  const { profile, client, signOut } = useAuth();
  const [docs,     setDocs]     = useState([]);
  const [requests, setRequests] = useState([]);
  const [folders,  setFolders]  = useState([]);
  const [selFolder,setSelFolder]= useState(null);
  const [uploading,setUploading]= useState(false);
  const [tab,      setTab]      = useState('upload'); // 'upload' | 'docs' | 'requests'

  useEffect(() => {
    if (!client) return;
    api.listDocuments({ client_id: client.id, limit: 10 }).then(d => setDocs(d.documents || []));
    api.listRequests({ client_id: client.id, status: 'open' }).then(d => setRequests(d.requests || []));
    api.listFolders(client.id).then(d => setFolders(d.folders || []));
  }, [client]);

  const onDrop = useCallback(async (files) => {
    if (!client) return;
    setUploading(true);
    try {
      const result = await api.uploadDocuments(files, client.id, selFolder, 'web');
      toast.success(result.message);
      api.listDocuments({ client_id: client.id, limit: 10 }).then(d => setDocs(d.documents || []));
    } catch (err) { toast.error(err.message); }
    finally { setUploading(false); }
  }, [client, selFolder]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg','.jpeg','.png'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxSize: 100 * 1024 * 1024,
    multiple: true,
  });

  async function handleDownload(doc) {
    try {
      const { url } = await api.downloadDocument(doc.id);
      window.open(url, '_blank');
    } catch (err) { toast.error('Download failed'); }
  }

  return (
    <div style={p.page}>
      {/* Hero bar */}
      <div style={p.hero}>
        <div>
          <div style={p.heroLogo}>DocVault</div>
          <div style={p.heroName}>Welcome back, {client?.name || profile?.full_name}</div>
          <div style={p.heroSub}>Your secure financial document portal</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={p.pill2}><div style={p.pillVal}>{docs.length}</div><div style={p.pillLbl}>Docs uploaded</div></div>
          <div style={p.pill2}><div style={{ ...p.pillVal, color: requests.length > 0 ? '#F09595' : '#E8C96A' }}>{requests.length}</div><div style={p.pillLbl}>Requests open</div></div>
          <button onClick={signOut} style={p.signOutBtn}>Sign out</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={p.tabs}>
        {[['upload','📤 Upload'], ['docs','📄 My Documents'], ['requests','📋 Requests' + (requests.length ? ` (${requests.length})` : '')]].map(([id, label]) => (
          <div key={id} style={{ ...p.tab, ...(tab === id ? p.tabOn : {}) }} onClick={() => setTab(id)}>{label}</div>
        ))}
      </div>

      {/* Upload tab */}
      {tab === 'upload' && (
        <div style={p.content}>
          <div style={p.section}>
            {folders.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <label style={p.label}>Upload to folder</label>
                <select style={p.select} value={selFolder || ''} onChange={e => setSelFolder(e.target.value || null)}>
                  <option value="">General / Uncategorized</option>
                  {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            )}
            <div {...getRootProps()} style={{ ...p.dropzone, ...(isDragActive ? p.dropActive : {}) }}>
              <input {...getInputProps()} />
              <div style={{ fontSize: 32, marginBottom: 10 }}>📤</div>
              <div style={p.dzTitle}>{uploading ? 'Uploading…' : isDragActive ? 'Drop here!' : 'Upload for your CFO team'}</div>
              <div style={p.dzHint}>Receipts, statements, invoices, payroll — any format accepted</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}>
                <button style={p.btnGold} disabled={uploading}>
                  {uploading ? 'Uploading…' : 'Choose Files'}
                </button>
              </div>
            </div>
            <div style={p.secNote}>
              🔒 Your documents are encrypted and only accessible by your CFO team. Every access is logged.
            </div>
          </div>
        </div>
      )}

      {/* Docs tab */}
      {tab === 'docs' && (
        <div style={p.content}>
          {docs.length === 0 ? (
            <div style={p.empty}>No documents uploaded yet. Go to the Upload tab to get started.</div>
          ) : docs.map(doc => {
            const pill = STATUS_PILL[doc.status] || STATUS_PILL.pending;
            return (
              <div key={doc.id} style={p.docRow}>
                <div style={p.docIcon}>
                  {doc.file_type === 'pdf' ? '📄' : doc.file_type?.includes('xl') ? '📊' : '🖼'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={p.docName}>{doc.original_name}</div>
                  <div style={p.docInfo}>
                    {doc.folders?.name && <>{doc.folders.name} · </>}
                    {Math.round(doc.file_size / 1024)} KB ·{' '}
                    {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                  </div>
                  {doc.review_note && (
                    <div style={p.reviewNote}>💬 {doc.review_note}</div>
                  )}
                </div>
                <span style={{ ...p.statusPill, background: pill.bg, color: pill.color }}>{pill.label}</span>
                <button style={p.dlBtn} onClick={() => handleDownload(doc)} title="Download">⬇</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Requests tab */}
      {tab === 'requests' && (
        <div style={p.content}>
          {requests.length === 0 ? (
            <div style={p.empty}>🎉 No open requests — you're all caught up!</div>
          ) : requests.map(req => (
            <div key={req.id} style={p.reqCard}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>📋</div>
              <div style={{ flex: 1 }}>
                <div style={p.reqTitle}>{req.title}</div>
                {req.description && <div style={p.reqDesc}>{req.description}</div>}
                <div style={p.reqMeta}>
                  Requested by your CFO team{req.due_date ? ` · Due ${req.due_date}` : ''}
                </div>
              </div>
              <button style={p.btnGold} onClick={() => setTab('upload')}>Upload</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const p = {
  page:      { fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#F2F4F7' },
  hero:      { background: '#0D1B2A', padding: '20px 28px', display: 'flex',
               alignItems: 'center', justifyContent: 'space-between' },
  heroLogo:  { fontSize: 14, fontWeight: 700, color: '#C9A84C', marginBottom: 4 },
  heroName:  { fontSize: 18, fontWeight: 700, color: '#fff' },
  heroSub:   { fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: 2 },
  pill2:     { background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
               borderRadius: 9, padding: '8px 16px', textAlign: 'center' },
  pillVal:   { fontSize: 18, fontWeight: 700, color: '#E8C96A' },
  pillLbl:   { fontSize: 9, color: 'rgba(255,255,255,.38)', textTransform: 'uppercase', letterSpacing: '.6px' },
  signOutBtn:{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)',
               borderRadius: 7, padding: '7px 14px', color: 'rgba(255,255,255,.6)',
               fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  tabs:      { display: 'flex', gap: 4, borderBottom: '1.5px solid #E4E8EE',
               background: '#fff', padding: '0 28px' },
  tab:       { padding: '12px 16px', fontSize: 13, color: '#4A6070', cursor: 'pointer',
               borderBottom: '2px solid transparent', marginBottom: '-1.5px', fontWeight: 600 },
  tabOn:     { color: '#0D1B2A', borderBottomColor: '#C9A84C' },
  content:   { maxWidth: 680, margin: '24px auto', padding: '0 16px' },
  section:   {},
  label:     { display: 'block', fontSize: 11, fontWeight: 600, color: '#2A3F55', marginBottom: 5 },
  select:    { border: '1px solid #E4E8EE', borderRadius: 7, padding: '8px 10px', fontSize: 13,
               color: '#0D1B2A', background: '#fff', width: '100%', fontFamily: 'inherit' },
  dropzone:  { border: '2px dashed #CBD2DB', borderRadius: 14, padding: '36px 24px',
               textAlign: 'center', cursor: 'pointer', background: '#fff', marginTop: 12 },
  dropActive:{ borderColor: '#C9A84C', background: '#FFFCF0' },
  dzTitle:   { fontSize: 16, fontWeight: 700, color: '#0D1B2A', marginBottom: 4 },
  dzHint:    { fontSize: 13, color: '#4A6070' },
  btnGold:   { background: '#C9A84C', color: '#0D1B2A', border: 'none', borderRadius: 8,
               padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  secNote:   { background: '#EAF3DE', border: '1px solid #C0DD97', borderRadius: 8,
               padding: '10px 14px', fontSize: 12, color: '#27500A', marginTop: 14 },
  empty:     { textAlign: 'center', padding: '40px 0', color: '#4A6070', fontSize: 14 },
  docRow:    { background: '#fff', border: '1px solid #E4E8EE', borderRadius: 10,
               padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 },
  docIcon:   { fontSize: 22, flexShrink: 0 },
  docName:   { fontSize: 13, fontWeight: 600, color: '#0D1B2A' },
  docInfo:   { fontSize: 11, color: '#4A6070', marginTop: 2 },
  reviewNote:{ fontSize: 11, color: '#8A5C00', background: '#FFF7E6',
               borderRadius: 6, padding: '4px 8px', marginTop: 5 },
  statusPill:{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, flexShrink: 0 },
  dlBtn:     { background: '#F2F4F7', border: 'none', borderRadius: 6, width: 30, height: 30,
               cursor: 'pointer', fontSize: 14, flexShrink: 0 },
  reqCard:   { background: '#FFF7E6', border: '1px solid #F0C050', borderRadius: 10,
               padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 12 },
  reqTitle:  { fontSize: 14, fontWeight: 700, color: '#8A5C00' },
  reqDesc:   { fontSize: 12, color: '#4A6070', marginTop: 3 },
  reqMeta:   { fontSize: 11, color: '#B8860B', marginTop: 4 },
};
