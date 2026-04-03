// ApprovalsPage.js
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api }  from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

export default function ApprovalsPage() {
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [note,    setNote]    = useState({});
  const [stats,   setStats]   = useState(null);

  // State for the "Request Document" form
  const [clients,  setClients]  = useState([]);
  const [reqForm,  setReqForm]  = useState({ client_id: '', title: '', description: '', due_date: '' });
  const [sending,  setSending]  = useState(false);

  useEffect(() => {
    load();
    api.listClients().then(d => setClients(d.clients || []));
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([api.listApprovals(), api.approvalStats()]);
      setDocs(d.documents || []);
      setStats(s);
    } catch { toast.error('Failed to load approvals'); }
    finally { setLoading(false); }
  }

  async function action(docId, status) {
    try {
      await api.updateDocStatus(docId, status, note[docId] || '');
      toast.success(`Document ${status}`);
      setNote(n => ({ ...n, [docId]: '' }));
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function sendRequest(e) {
    e.preventDefault();
    setSending(true);
    try {
      await api.createRequest(reqForm);
      toast.success('Request sent — client notified!');
      setReqForm({ client_id: '', title: '', description: '', due_date: '' });
    } catch (err) { toast.error(err.message); }
    finally { setSending(false); }
  }

  return (
    <div style={styles.page}>
      <div style={styles.title}>Approval Queue</div>
      {stats && (
        <div style={styles.statsRow}>
          {[
            { l: 'Pending',  v: stats.pending,  c: '#A32D2D' },
            { l: 'Approved', v: stats.approved, c: '#27500A' },
            { l: 'Flagged',  v: stats.flagged,  c: '#8A5C00' },
            { l: 'Total',    v: stats.total,    c: '#0D1B2A' },
          ].map(x => (
            <div key={x.l} style={styles.statCard}>
              <div style={styles.statLabel}>{x.l}</div>
              <div style={{ ...styles.statVal, color: x.c }}>{x.v}</div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.layout}>
        <div>
          {loading && <div style={styles.empty}>Loading…</div>}
          {!loading && docs.length === 0 && <div style={styles.empty}>🎉 All caught up — no pending documents!</div>}
          {docs.map(doc => (
            <div key={doc.id} style={{ ...styles.card, ...(doc.status === 'flagged' ? styles.cardFlagged : {}) }}>
              <div style={styles.cardHead}>
                <div style={styles.docIcon}>📄</div>
                <div style={{ flex: 1 }}>
                  <div style={styles.docName}>{doc.original_name}</div>
                  <div style={styles.docInfo}>
                    {doc.clients?.name} · {Math.round(doc.file_size / 1024)} KB ·{' '}
                    {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                    {doc.upload_source === 'mobile_scan' ? ' · 📷 scan' : ''}
                    {doc.page_count ? ` · ${doc.page_count} pages` : ''}
                  </div>
                </div>
                <span style={{ ...styles.pill, ...pillStyle(doc.status) }}>{doc.status}</span>
              </div>

              {doc.review_note && (
                <div style={styles.existingNote}>💬 {doc.review_note}</div>
              )}

              <input
                style={styles.noteInput}
                placeholder="Add a review note (optional)"
                value={note[doc.id] || ''}
                onChange={e => setNote(n => ({ ...n, [doc.id]: e.target.value }))}
              />

              <div style={styles.btnRow}>
                <button style={styles.btnApprove} onClick={() => action(doc.id, 'approved')}>✓ Approve</button>
                <button style={styles.btnReview}  onClick={() => action(doc.id, 'in_review')}>👁 Mark In Review</button>
                <button style={styles.btnFlag}    onClick={() => action(doc.id, 'flagged')}>⚑ Flag Issue</button>
                <button style={styles.btnArchive} onClick={() => action(doc.id, 'archived')}>Archive</button>
              </div>
            </div>
          ))}
        </div>

        {/* Request form */}
        <div>
          <div style={styles.card}>
            <div style={styles.sectionTitle}>Request a Document</div>
            <div style={styles.hint}>Send a request to a client — they'll receive a push notification and see it in their portal.</div>
            <form onSubmit={sendRequest}>
              <label style={styles.label}>Client</label>
              <select style={styles.input} required value={reqForm.client_id}
                onChange={e => setReqForm(f => ({ ...f, client_id: e.target.value }))}>
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <label style={styles.label}>Document needed</label>
              <input style={styles.input} required placeholder="e.g. March bank statement"
                value={reqForm.title} onChange={e => setReqForm(f => ({ ...f, title: e.target.value }))} />
              <label style={styles.label}>Details (optional)</label>
              <textarea style={{ ...styles.input, height: 70, resize: 'none' }}
                placeholder="Any additional context…"
                value={reqForm.description} onChange={e => setReqForm(f => ({ ...f, description: e.target.value }))} />
              <label style={styles.label}>Due date</label>
              <input style={styles.input} type="date" value={reqForm.due_date}
                onChange={e => setReqForm(f => ({ ...f, due_date: e.target.value }))} />
              <button style={styles.btnSend} type="submit" disabled={sending}>
                {sending ? 'Sending…' : 'Send Request + Notify Client'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function pillStyle(status) {
  const m = {
    pending:   { background: '#E6F1FB', color: '#0C447C' },
    in_review: { background: '#FFF7E6', color: '#8A5C00' },
    approved:  { background: '#EAF3DE', color: '#27500A' },
    flagged:   { background: '#FCEBEB', color: '#A32D2D' },
  };
  return m[status] || m.pending;
}

const styles = {
  page:        { padding: '24px 26px' },
  title:       { fontSize: 18, fontWeight: 700, color: '#0D1B2A', marginBottom: 16 },
  statsRow:    { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 },
  statCard:    { background: '#fff', border: '1px solid #E4E8EE', borderRadius: 10, padding: '12px 14px' },
  statLabel:   { fontSize: 10, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 },
  statVal:     { fontSize: 24, fontWeight: 700 },
  layout:      { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18 },
  card:        { background: '#fff', border: '1px solid #E4E8EE', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardFlagged: { borderColor: '#E24B4A', background: '#FFFAFA' },
  cardHead:    { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  docIcon:     { width: 38, height: 38, borderRadius: 8, background: '#FEE8E8',
                 display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
  docName:     { fontSize: 13, fontWeight: 700, color: '#0D1B2A' },
  docInfo:     { fontSize: 11, color: '#4A6070', marginTop: 2 },
  pill:        { fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, flexShrink: 0 },
  existingNote:{ background: '#F2F4F7', borderRadius: 7, padding: '8px 12px', fontSize: 12,
                 color: '#4A6070', marginBottom: 10 },
  noteInput:   { width: '100%', border: '1px solid #E4E8EE', borderRadius: 7, padding: '8px 11px',
                 fontSize: 12, color: '#0D1B2A', marginBottom: 10, fontFamily: 'inherit', boxSizing: 'border-box' },
  btnRow:      { display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid #F2F4F7', paddingTop: 10 },
  btnApprove:  { background: '#EAF3DE', color: '#27500A', border: 'none', borderRadius: 7,
                 padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  btnReview:   { background: '#FFF7E6', color: '#8A5C00', border: 'none', borderRadius: 7,
                 padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  btnFlag:     { background: '#FCEBEB', color: '#A32D2D', border: 'none', borderRadius: 7,
                 padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  btnArchive:  { background: '#F2F4F7', color: '#4A6070', border: 'none', borderRadius: 7,
                 padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' },
  sectionTitle:{ fontSize: 14, fontWeight: 700, color: '#0D1B2A', marginBottom: 6 },
  hint:        { fontSize: 12, color: '#4A6070', marginBottom: 14, lineHeight: 1.5 },
  label:       { display: 'block', fontSize: 11, fontWeight: 600, color: '#2A3F55', marginBottom: 4 },
  input:       { width: '100%', border: '1px solid #E4E8EE', borderRadius: 7, padding: '8px 10px',
                 fontSize: 13, color: '#0D1B2A', marginBottom: 12, fontFamily: 'inherit',
                 boxSizing: 'border-box', background: '#fff' },
  btnSend:     { width: '100%', background: '#C9A84C', color: '#0D1B2A', border: 'none',
                 borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  empty:       { padding: '30px 0', textAlign: 'center', color: '#4A6070', fontSize: 13 },
};