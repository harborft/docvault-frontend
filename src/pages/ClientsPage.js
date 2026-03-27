import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';

const COLORS = [
  { bg: '#EEF0FE', color: '#3B4EBE' }, { bg: '#EAF3DE', color: '#27500A' },
  { bg: '#FFF7E6', color: '#8A5C00' }, { bg: '#FCEBEB', color: '#A32D2D' },
  { bg: '#E1F5EE', color: '#085041' }, { bg: '#E6F1FB', color: '#0C447C' },
];

export default function ClientsPage() {
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm,setShowForm]  = useState(false);
  const [form,    setForm]      = useState({ name:'', industry:'', email:'', phone:'' });
  const [saving,  setSaving]    = useState(false);
  const [showInvite, setShowInvite] = useState(null); // client id
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePwd,   setInvitePwd]   = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { const d = await api.listClients(); setClients(d.clients || []); }
    catch { toast.error('Failed to load clients'); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createClient(form);
      toast.success(`Client "${form.name}" created with default folders!`);
      setForm({ name:'', industry:'', email:'', phone:'' });
      setShowForm(false);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  async function handleInvite(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.registerClient({
        email: inviteEmail, password: invitePwd,
        full_name: inviteEmail.split('@')[0], client_id: showInvite
      });
      toast.success('Portal user created & invite sent!');
      setShowInvite(null); setInviteEmail(''); setInvitePwd('');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.title}>Clients</div>
        <button style={s.btnDark} onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ New Client'}
        </button>
      </div>

      {showForm && (
        <div style={s.formCard}>
          <div style={s.formTitle}>Add New Client</div>
          <form onSubmit={handleCreate} style={s.formGrid}>
            <div>
              <label style={s.label}>Company name *</label>
              <input style={s.input} required placeholder="Acme Corp"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={s.label}>Industry</label>
              <input style={s.input} placeholder="e.g. Healthcare"
                value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
            </div>
            <div>
              <label style={s.label}>Email *</label>
              <input style={s.input} type="email" required placeholder="contact@company.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label style={s.label}>Phone</label>
              <input style={s.input} placeholder="(555) 000-0000"
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button style={s.btnGold} type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Create Client + Default Folders'}
              </button>
              <div style={s.hint}>Default folders (Bank Statements, Invoices, Tax Docs, Payroll, Contracts) are created automatically.</div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={s.empty}>Loading clients…</div>
      ) : (
        <div style={s.grid}>
          {clients.map((client, i) => {
            const col = COLORS[i % COLORS.length];
            return (
              <div key={client.id} style={s.card}>
                <div style={{ ...s.avatar, background: col.bg, color: col.color }}>
                  {client.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={s.clientName}>{client.name}</div>
                <div style={s.clientSub}>{client.industry || 'General'} · {client.email}</div>

                <div style={s.statsRow}>
                  <div style={s.stat}>
                    <div style={s.statVal}>{client.storage_used ? Math.round(client.storage_used / 1e6) : 0} MB</div>
                    <div style={s.statLbl}>Storage</div>
                  </div>
                  <div style={s.stat}>
                    <div style={{ ...s.statVal, color: client.portal_active ? '#27500A' : '#A32D2D' }}>
                      {client.portal_active ? 'Active' : 'Inactive'}
                    </div>
                    <div style={s.statLbl}>Portal</div>
                  </div>
                </div>

                <button style={s.inviteBtn} onClick={() => setShowInvite(client.id)}>
                  + Invite Portal User
                </button>

                {showInvite === client.id && (
                  <div style={s.inviteForm}>
                    <div style={s.formTitle}>Create portal login for {client.name}</div>
                    <form onSubmit={handleInvite}>
                      <input style={{ ...s.input, marginBottom: 8 }} type="email" required
                        placeholder="Client email" value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)} />
                      <input style={{ ...s.input, marginBottom: 8 }} type="password" required
                        placeholder="Set initial password (min 8 chars)" value={invitePwd}
                        onChange={e => setInvitePwd(e.target.value)} minLength={8} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={s.btnGold} type="submit" disabled={saving}>
                          {saving ? '…' : 'Create & Send Invite'}
                        </button>
                        <button style={s.btnCancel} type="button" onClick={() => setShowInvite(null)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ ...s.card, border: '2px dashed #CBD2DB', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer', minHeight: 140 }}
            onClick={() => setShowForm(true)}>
            <div style={{ fontSize: 24, color: '#CBD2DB' }}>+</div>
            <div style={{ fontSize: 13, color: '#4A6070', fontWeight: 600, marginTop: 6 }}>Add client</div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:      { padding: '24px 26px' },
  header:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title:     { fontSize: 18, fontWeight: 700, color: '#0D1B2A' },
  btnDark:   { background: '#0D1B2A', color: '#fff', border: 'none', borderRadius: 8,
               padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnGold:   { background: '#C9A84C', color: '#0D1B2A', border: 'none', borderRadius: 8,
               padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnCancel: { background: '#F2F4F7', color: '#0D1B2A', border: 'none', borderRadius: 8,
               padding: '9px 14px', fontSize: 13, cursor: 'pointer' },
  formCard:  { background: '#fff', border: '1px solid #E4E8EE', borderRadius: 12, padding: 20, marginBottom: 20 },
  formTitle: { fontSize: 14, fontWeight: 700, color: '#0D1B2A', marginBottom: 14 },
  formGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' },
  label:     { display: 'block', fontSize: 11, fontWeight: 600, color: '#2A3F55', marginBottom: 4 },
  input:     { width: '100%', border: '1px solid #E4E8EE', borderRadius: 7, padding: '8px 10px',
               fontSize: 13, color: '#0D1B2A', marginBottom: 12, fontFamily: 'inherit',
               boxSizing: 'border-box' },
  hint:      { fontSize: 11, color: '#4A6070', marginTop: 8 },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 16 },
  card:      { background: '#fff', border: '1px solid #E4E8EE', borderRadius: 12, padding: 16,
               display: 'flex', flexDirection: 'column' },
  avatar:    { width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center',
               justifyContent: 'center', fontSize: 16, fontWeight: 700, marginBottom: 10 },
  clientName:{ fontSize: 14, fontWeight: 700, color: '#0D1B2A' },
  clientSub: { fontSize: 11, color: '#4A6070', marginTop: 2, marginBottom: 12 },
  statsRow:  { display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px solid #F2F4F7', marginBottom: 12 },
  stat:      {},
  statVal:   { fontSize: 16, fontWeight: 700, color: '#0D1B2A' },
  statLbl:   { fontSize: 9, color: '#4A6070', textTransform: 'uppercase' },
  inviteBtn: { background: '#F2F4F7', border: '1px solid #E4E8EE', borderRadius: 7,
               padding: '7px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
               color: '#0D1B2A', width: '100%', marginTop: 'auto' },
  inviteForm:{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F2F4F7' },
  empty:     { padding: '30px 0', textAlign: 'center', color: '#4A6070', fontSize: 13 },
};
