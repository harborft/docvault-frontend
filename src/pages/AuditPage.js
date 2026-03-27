import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { format } from 'date-fns';

const ACTION_BADGE = {
  upload:   { bg: '#E6F1FB', color: '#0C447C' },
  download: { bg: '#EAF3DE', color: '#27500A' },
  approved: { bg: '#EAF3DE', color: '#27500A' },
  flagged:  { bg: '#FCEBEB', color: '#A32D2D' },
  login:    { bg: '#F1EFE8', color: '#5F5E5A' },
  view:     { bg: '#F1EFE8', color: '#5F5E5A' },
};

export default function AuditPage() {
  const [log,     setLog]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [filter,  setFilter]  = useState('');

  useEffect(() => {
    api.listClients().then(d => setClients(d.clients || []));
    loadLog();
  }, []);

  async function loadLog(clientId) {
    setLoading(true);
    try {
      const params = {};
      if (clientId) params.client_id = clientId;
      const d = await api.getAuditLog(params);
      setLog(d.log || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={s.title}>Audit Log</div>
          <div style={s.sub}>Every upload, view, download, and approval — permanently recorded.</div>
        </div>
        <select style={s.select}
          onChange={e => { setFilter(e.target.value); loadLog(e.target.value || undefined); }}>
          <option value="">All clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div style={s.table}>
        <div style={s.thead}>
          <div style={{ flex: 1.5 }}>When</div>
          <div style={{ flex: 1 }}>User</div>
          <div style={{ flex: 1 }}>Client</div>
          <div style={{ flex: 1 }}>Action</div>
          <div style={{ flex: 2 }}>Document / Detail</div>
          <div style={{ flex: 1 }}>IP Address</div>
        </div>

        {loading && <div style={s.empty}>Loading audit log…</div>}
        {!loading && log.length === 0 && <div style={s.empty}>No audit entries found.</div>}

        {log.map(entry => {
          const badge = ACTION_BADGE[entry.action] || ACTION_BADGE.view;
          return (
            <div key={entry.id} style={s.row}>
              <div style={{ flex: 1.5, ...s.cell }}>
                {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
              </div>
              <div style={{ flex: 1, ...s.cell }}>{entry.profiles?.full_name || '—'}</div>
              <div style={{ flex: 1, ...s.cell }}>{entry.clients?.name || '—'}</div>
              <div style={{ flex: 1, ...s.cell }}>
                <span style={{ ...s.badge, background: badge.bg, color: badge.color }}>
                  {entry.action}
                </span>
              </div>
              <div style={{ flex: 2, ...s.cell, color: '#4A6070' }}>
                {entry.documents?.original_name || JSON.stringify(entry.metadata || '') || '—'}
              </div>
              <div style={{ flex: 1, ...s.cell, fontFamily: 'monospace', fontSize: 11 }}>
                {entry.ip_address || '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  page:   { padding: '24px 26px' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  title:  { fontSize: 18, fontWeight: 700, color: '#0D1B2A' },
  sub:    { fontSize: 12, color: '#4A6070', marginTop: 3 },
  select: { border: '1px solid #E4E8EE', borderRadius: 7, padding: '7px 10px', fontSize: 12,
            color: '#0D1B2A', background: '#fff', cursor: 'pointer' },
  table:  { background: '#fff', border: '1px solid #E4E8EE', borderRadius: 12, overflow: 'hidden' },
  thead:  { display: 'flex', padding: '10px 16px', background: '#F2F4F7',
            fontSize: 10, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase',
            letterSpacing: '.5px', borderBottom: '1px solid #E4E8EE' },
  row:    { display: 'flex', padding: '11px 16px', borderBottom: '1px solid #F2F4F7',
            alignItems: 'center' },
  cell:   { fontSize: 12, color: '#0D1B2A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  badge:  { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 },
  empty:  { padding: '30px 0', textAlign: 'center', color: '#4A6070', fontSize: 13 },
};
