import React, { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const STATUS_PILL = {
  pending:   { bg: '#E6F1FB', color: '#0C447C', label: 'Awaiting Review' },
  in_review: { bg: '#FFF7E6', color: '#8A5C00', label: 'In Review' },
  approved:  { bg: '#EAF3DE', color: '#27500A', label: 'Approved' },
  flagged:   { bg: '#FCEBEB', color: '#A32D2D', label: 'Flagged' },
  archived:  { bg: '#F1EFE8', color: '#5F5E5A', label: 'Archived' },
};

export default function DocumentsPage() {
  const { isAdmin } = useAuth();
  const [clients,       setClients]       = useState([]);
  const [folders,       setFolders]       = useState([]);
  const [documents,     setDocuments]     = useState([]);
  const [selectedClient,setSelectedClient]= useState(null);
  const [selectedFolder,setSelectedFolder]= useState(null);
  const [statusFilter,  setStatusFilter]  = useState('');
  const [uploading,     setUploading]     = useState(false);
  const [loading,       setLoading]       = useState(true);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedClient) params.client_id = selectedClient;
      if (selectedFolder) params.folder_id = selectedFolder;
      if (statusFilter)   params.status    = statusFilter;
      const d = await api.listDocuments(params);
      setDocuments(d.documents || []);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedFolder, statusFilter]);

  useEffect(() => {
    if (isAdmin) api.listClients().then(d => setClients(d.clients || []));
    loadDocuments();
  }, [isAdmin, loadDocuments]);

  useEffect(() => {
    if (selectedClient) {
      api.listFolders(selectedClient).then(d => setFolders(d.folders || []));
    } else {
      setFolders([]);
      setSelectedFolder(null);
    }
  }, [selectedClient]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!selectedClient && isAdmin) {
      toast.error('Please select a client folder before uploading');
      return;
    }
    setUploading(true);
    try {
      const clientId = selectedClient || 'default';
      const result   = await api.uploadDocuments(acceptedFiles, clientId, selectedFolder, 'web');
      toast.success(result.message);
      loadDocuments();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [selectedClient, selectedFolder, isAdmin, loadDocuments]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    maxSize: 100 * 1024 * 1024,
    multiple: true
  });

  async function handleDownload(doc) {
    try {
      const { url } = await api.downloadDocument(doc.id);
      window.open(url, '_blank');
    } catch (err) {
      toast.error('Download failed: ' + err.message);
    }
  }

  async function handleStatusChange(docId, status) {
    try {
      await api.updateDocStatus(docId, status);
      toast.success(`Document ${status}`);
      loadDocuments();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>Documents</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select style={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Awaiting Review</option>
            <option value="approved">Approved</option>
            <option value="flagged">Flagged</option>
            <option value="in_review">In Review</option>
          </select>
        </div>
      </div>

      <div style={styles.layout}>
        {/* Folder tree */}
        <div style={styles.sidebar}>
          <div style={styles.sideTitle}>Folders</div>
          <div
            style={{ ...styles.folderItem, ...(selectedClient === null ? styles.folderSel : {}) }}
            onClick={() => { setSelectedClient(null); setSelectedFolder(null); }}
          >
            📁 All Documents
            <span style={styles.folderBadge}>{documents.length}</span>
          </div>

          {isAdmin && clients.map(client => (
            <React.Fragment key={client.id}>
              <div
                style={{ ...styles.folderItem, ...(selectedClient === client.id && !selectedFolder ? styles.folderSel : {}) }}
                onClick={() => { setSelectedClient(client.id); setSelectedFolder(null); }}
              >
                📂 {client.name}
              </div>
              {selectedClient === client.id && folders.map(folder => (
                <div
                  key={folder.id}
                  style={{ ...styles.folderItem, paddingLeft: 28, fontSize: 12,
                    ...(selectedFolder === folder.id ? styles.folderSel : {}) }}
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  📄 {folder.name}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>

        {/* Main doc area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Upload zone */}
          <div {...getRootProps()} style={{ ...styles.dropzone, ...(isDragActive ? styles.dropActive : {}) }}>
            <input {...getInputProps()} />
            <div style={{ fontSize: 28, marginBottom: 8 }}>☁️</div>
            <div style={styles.dzTitle}>
              {uploading ? 'Uploading…' : isDragActive ? 'Drop files here!' : 'Drop files here or click to upload'}
            </div>
            <div style={styles.dzHint}>PDF, JPG, PNG, XLSX · Max 100 MB · Encrypted in transit and at rest</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              <button style={styles.btnDark} disabled={uploading}>
                {uploading ? 'Uploading…' : 'Browse Files'}
              </button>
            </div>
          </div>

          {/* Security notice */}
          <div style={styles.secBar}>
            🔒 All files encrypted with AES-256 · Access logged · Signed URLs expire in 5 minutes
          </div>

          {/* Document list */}
          {loading ? (
            <div style={styles.empty}>Loading documents…</div>
          ) : documents.length === 0 ? (
            <div style={styles.empty}>No documents found. Upload your first file above.</div>
          ) : (
            documents.map(doc => {
              const pill = STATUS_PILL[doc.status] || STATUS_PILL.pending;
              return (
                <div key={doc.id} style={styles.docRow}>
                  <div style={{ ...styles.docIcon,
                    background: doc.file_type === 'pdf' ? '#FEE8E8' :
                                doc.file_type?.includes('xl') || doc.file_type === 'csv' ? '#E8F5EE' : '#E8EEF9'
                  }}>
                    {doc.file_type === 'pdf' ? '📄' : doc.file_type?.includes('xl') ? '📊' : '🖼'}
                  </div>

                  <div style={styles.docMeta}>
                    <div style={styles.docName}>{doc.original_name}</div>
                    <div style={styles.docInfo}>
                      {doc.clients?.name && <><strong>{doc.clients.name}</strong> · </>}
                      {doc.folders?.name && <>{doc.folders.name} · </>}
                      {Math.round(doc.file_size / 1024)} KB ·{' '}
                      {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                      {doc.upload_source === 'mobile_scan' && ' · 📷 mobile scan'}
                    </div>
                  </div>

                  <span style={{ ...styles.pill, background: pill.bg, color: pill.color }}>
                    {pill.label}
                  </span>

                  <div style={styles.actions}>
                    <button style={styles.actionBtn} onClick={() => handleDownload(doc)} title="Download">⬇</button>
                    {isAdmin && doc.status !== 'approved' && (
                      <button style={{ ...styles.actionBtn, color: '#27500A' }}
                        onClick={() => handleStatusChange(doc.id, 'approved')} title="Approve">✓</button>
                    )}
                    {isAdmin && doc.status !== 'flagged' && (
                      <button style={{ ...styles.actionBtn, color: '#A32D2D' }}
                        onClick={() => handleStatusChange(doc.id, 'flagged')} title="Flag">⚑</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:       { padding: '24px 26px' },
  header:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title:      { fontSize: 18, fontWeight: 700, color: '#0D1B2A' },
  select:     { border: '1px solid #E4E8EE', borderRadius: 7, padding: '6px 10px',
                fontSize: 12, color: '#0D1B2A', background: '#fff', cursor: 'pointer' },
  layout:     { display: 'grid', gridTemplateColumns: '190px 1fr', gap: 18 },
  sidebar:    { background: '#fff', border: '1px solid #E4E8EE', borderRadius: 12, padding: 14, alignSelf: 'start' },
  sideTitle:  { fontSize: 12, fontWeight: 700, color: '#0D1B2A', marginBottom: 10 },
  folderItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                padding: '7px 8px', borderRadius: 7, cursor: 'pointer', fontSize: 13,
                color: '#2A3F55', fontWeight: 500, transition: 'background .12s' },
  folderSel:  { background: '#E6F5F3', color: '#0E7C6E', fontWeight: 700 },
  folderBadge:{ background: '#F2F4F7', borderRadius: 10, padding: '1px 7px', fontSize: 10, color: '#4A6070', fontWeight: 600 },
  dropzone:   { border: '2px dashed #CBD2DB', borderRadius: 12, padding: '28px 20px',
                textAlign: 'center', cursor: 'pointer', marginBottom: 14, transition: 'all .2s' },
  dropActive: { borderColor: '#C9A84C', background: '#FFFCF0' },
  dzTitle:    { fontSize: 14, fontWeight: 700, color: '#0D1B2A', marginBottom: 4 },
  dzHint:     { fontSize: 12, color: '#4A6070' },
  btnDark:    { background: '#0D1B2A', color: '#fff', border: 'none', borderRadius: 8,
                padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  secBar:     { background: '#EAF3DE', border: '1px solid #C0DD97', borderRadius: 8,
                padding: '8px 14px', fontSize: 11, color: '#27500A', marginBottom: 14 },
  empty:      { padding: '30px 0', textAlign: 'center', color: '#4A6070', fontSize: 13 },
  docRow:     { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                background: '#fff', border: '1px solid #E4E8EE', borderRadius: 9,
                marginBottom: 6, cursor: 'default' },
  docIcon:    { width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  docMeta:    { flex: 1, minWidth: 0 },
  docName:    { fontSize: 13, fontWeight: 600, color: '#0D1B2A', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  docInfo:    { fontSize: 11, color: '#4A6070', marginTop: 2 },
  pill:       { fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, flexShrink: 0 },
  actions:    { display: 'flex', gap: 4, flexShrink: 0 },
  actionBtn:  { background: '#F2F4F7', border: 'none', borderRadius: 6, width: 30, height: 30,
                cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};
