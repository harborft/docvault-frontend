import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api }  from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const STATUS_PILL = {
  pending:   { bg: '#E6F1FB', color: '#0C447C', label: 'Awaiting' },
  in_review: { bg: '#FFF7E6', color: '#8A5C00', label: 'In Review' },
  approved:  { bg: '#EAF3DE', color: '#27500A', label: 'Approved'  },
  flagged:   { bg: '#FCEBEB', color: '#A32D2D', label: 'Flagged'   },
  archived:  { bg: '#F1EFE8', color: '#5F5E5A', label: 'Archived'  },
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const navigate    = useNavigate();
  const [stats,     setStats]     = useState(null);
  const [docs,      setDocs]      = useState([]);
  const [clients,   setClients]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.approvalStats(),
      api.listDocuments({ limit: 6 }),
      api.listClients()
    ]).then(([s, d, c]) => {
      setStats(s);
      setDocs(d.documents || []);
      setClients(c.clients || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const totalStorage = clients.reduce((a, c) => a + (c.storage_used || 0), 0);
  const gbUsed = (totalStorage / 1e9).toFixed(1);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.greeting}>Good morning, {profile?.full_name?.split(' ')[0]} 👋</div>
          <div style={styles.sub}>Here's what needs your attention today.</div>
        </div>
        <button style={styles.btnGold} onClick={() => navigate('/approvals')}>
          Review Queue ({stats?.pending || 0})
        </button>
      </div>

      {/* Stat cards */}
      <div style={styles.stats}>
        {[
          { label: 'Active Clients',   value: clients.length,     sub: '↑ 2 this month',   subColor: '#0E7C6E' },
          { label: 'Total Documents',  value: stats?.total || 0,  sub: '↑ 31 this week',   subColor: '#0E7C6E' },
          { label: 'Pending Approval', value: stats?.pending || 0,sub: 'Needs attention',   subColor: stats?.pending > 0 ? '#A32D2D' : '#0E7C6E', valColor: stats?.pending > 0 ? '#A32D2D' : undefined },
          { label: 'Storage Used',     value: `${gbUsed} GB`,     sub: 'across all clients',subColor: '#4A6070' },
        ].map(card => (
          <div key={card.label} style={styles.statCard}>
            <div style={styles.statLabel}>{card.label}</div>
            <div style={{ ...styles.statValue, ...(card.valColor ? { color: card.valColor } : {}) }}>{card.value}</div>
            <div style={{ ...styles.statSub, color: card.subColor }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={styles.twoCol}>
        {/* Recent documents */}
        <div style={styles.panel}>
          <div style={styles.panelHead}>
            <div style={styles.panelTitle}>Recent Uploads</div>
            <button style={styles.btnGhost} onClick={() => navigate('/documents')}>View all</button>
          </div>
          {docs.length === 0 && <Empty label="No documents yet" />}
          {docs.map(doc => {
            const pill = STATUS_PILL[doc.status] || STATUS_PILL.pending;
            return (
              <div key={doc.id} style={styles.docRow} onClick={() => navigate('/documents')}>
                <div style={{ ...styles.docIcon, background: doc.file_type === 'pdf' ? '#FEE8E8' : doc.file_type?.includes('xl') ? '#E8F5EE' : '#E8EEF9' }}>
                  {doc.file_type === 'pdf' ? '📄' : doc.file_type?.includes('xl') ? '📊' : '🖼'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.docName}>{doc.original_name}</div>
                  <div style={styles.docInfo}>
                    {doc.clients?.name} · {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                    {doc.upload_source === 'mobile_scan' ? ' · 📷 scan' : ''}
                  </div>
                </div>
                <span style={{ ...styles.pill, background: pill.bg, color: pill.color }}>{pill.label}</span>
              </div>
            );
          })}
        </div>

        {/* Client overview */}
        <div style={styles.panel}>
          <div style={styles.panelHead}>
            <div style={styles.panelTitle}>Clients Overview</div>
            <button style={styles.btnGhost} onClick={() => navigate('/clients')}>Manage</button>
          </div>
          {clients.slice(0, 5).map(client => (
            <div key={client.id} style={styles.clientRow}>
              <div style={{ ...styles.cliAvatar, background: '#EEF0FE', color: '#3B4EBE' }}>
                {client.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.cliName}>{client.name}</div>
                <div style={styles.cliSub}>{client.industry || 'General'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={styles.cliStat}>{client.storage_used ? Math.round(client.storage_used / 1e6) : 0} MB</div>
                <div style={styles.cliSub}>used</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageLoader() {
  return <div style={{ padding: 40, color: '#4A6070' }}>Loading dashboard…</div>;
}

function Empty({ label }) {
  return <div style={{ padding: '20px 0', color: '#4A6070', fontSize: 13, textAlign: 'center' }}>{label}</div>;
}

const styles = {
  page:      { padding: '24px 26px', maxWidth: 1100, margin: '0 auto' },
  header:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  greeting:  { fontSize: 20, fontWeight: 700, color: '#0D1B2A' },
  sub:       { fontSize: 13, color: '#4A6070', marginTop: 3 },
  btnGold:   { background: '#C9A84C', color: '#0D1B2A', border: 'none', borderRadius: 8,
               padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnGhost:  { background: 'transparent', border: '1px solid #E4E8EE', borderRadius: 7,
               padding: '5px 12px', fontSize: 12, cursor: 'pointer', color: '#0D1B2A' },
  stats:     { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 },
  statCard:  { background: '#fff', border: '1px solid #E4E8EE', borderRadius: 12, padding: '14px 16px' },
  statLabel: { fontSize: 10, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 },
  statValue: { fontSize: 26, fontWeight: 700, color: '#0D1B2A', lineHeight: 1 },
  statSub:   { fontSize: 11, marginTop: 4 },
  twoCol:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 },
  panel:     { background: '#fff', border: '1px solid #E4E8EE', borderRadius: 12, padding: 16 },
  panelHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  panelTitle:{ fontSize: 13, fontWeight: 700, color: '#0D1B2A' },
  docRow:    { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
               borderBottom: '1px solid #F2F4F7', cursor: 'pointer' },
  docIcon:   { width: 32, height: 32, borderRadius: 7, display: 'flex', alignItems: 'center',
               justifyContent: 'center', fontSize: 15, flexShrink: 0 },
  docName:   { fontSize: 12, fontWeight: 600, color: '#0D1B2A', overflow: 'hidden',
               textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  docInfo:   { fontSize: 10, color: '#4A6070', marginTop: 1 },
  pill:      { fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 },
  clientRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #F2F4F7' },
  cliAvatar: { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center',
               justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  cliName:   { fontSize: 12, fontWeight: 600, color: '#0D1B2A' },
  cliSub:    { fontSize: 10, color: '#4A6070' },
  cliStat:   { fontSize: 13, fontWeight: 700, color: '#0D1B2A' },
};
